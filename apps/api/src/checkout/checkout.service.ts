import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { and, eq, gte, inArray, isNotNull, isNull } from 'drizzle-orm';
import { DB, type Database } from '../db/client';
import { courses } from '../db/schema/catalog';
import { enrollments } from '../db/schema/enrollment';
import { orders, payments, type Order, type Payment } from '../db/schema/commerce';
import { crmInteractions, leads } from '../db/schema/crm';
import { users } from '../db/schema/identity';
import { APP_CONFIG, type AppConfig } from '../config/configuration';
import type { AuthUser } from '../common/auth-user';
import type {
  AsaasWebhookDto,
  CheckoutConfigDto,
  CreateCheckoutDto,
  OrderDto,
  PaymentWebhookDto,
} from './dto';
import { PAYMENT_GATEWAYS, type PaymentGateways } from './payment-gateway';
import { StripePaymentGateway } from './stripe-gateway';
import { asaasEventToStatus } from './asaas-gateway';
import {
  BOLETO_MAX_INSTALLMENTS,
  courseMaxInstallments,
  effectiveInstallments,
  netAmountCents,
} from './pricing';
import { MailerService } from '../mail/mailer.service';
import { orderCreatedMail, paymentConfirmedMail, salesNoticeMail } from '../mail/templates';

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    @Inject(DB) private readonly db: Database,
    @Inject(PAYMENT_GATEWAYS) private readonly gateways: PaymentGateways,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    @Inject(MailerService) private readonly mailer: MailerService,
  ) {}

  /** Como o checkout deve se comportar: provedor de cada meio e teto do carnê. */
  getCheckoutConfig(): CheckoutConfigDto {
    return {
      providers: {
        pix: this.gateways.forMethod('pix').provider,
        card: this.gateways.forMethod('card').provider,
        boleto: this.gateways.forMethod('boleto').provider,
      },
      boletoMaxInstallments: BOLETO_MAX_INSTALLMENTS,
    };
  }

  /** Inicia o checkout: cria o pedido, cobra no gateway e (se já aprovado) matricula. */
  async createCheckout(
    user: AuthUser,
    dto: CreateCheckoutDto,
    remoteIp?: string,
  ): Promise<OrderDto> {
    const [course] = await this.db
      .select({
        id: courses.id,
        slug: courses.slug,
        title: courses.title,
        coverUrl: courses.coverUrl,
        priceCents: courses.priceCents,
        maxInstallments: courses.maxInstallments,
        installmentPlans: courses.installmentPlans,
      })
      .from(courses)
      .where(
        and(
          eq(courses.slug, dto.courseSlug),
          eq(courses.status, 'published'),
          isNull(courses.deletedAt),
        ),
      )
      .limit(1);
    if (!course) throw new NotFoundException('Curso não encontrado');

    const [already] = await this.db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(and(eq(enrollments.userId, user.id), eq(enrollments.courseId, course.id)))
      .limit(1);
    if (already) throw new ConflictException('Você já está matriculado neste curso');

    // Regra comercial (server-authoritative): Pix à vista tem desconto; cartão e
    // boleto/carnê pagam o preço cheio (ou o total do plano) parcelável até o teto.
    const installments = effectiveInstallments(
      dto.method,
      dto.installments,
      courseMaxInstallments(course.maxInstallments, course.installmentPlans),
    );
    const amountCents = netAmountCents(
      dto.method,
      course.priceCents,
      installments,
      course.installmentPlans,
    );

    const [order] = await this.db
      .insert(orders)
      .values({
        userId: user.id,
        courseId: course.id,
        amountCents,
        ...(dto.attribution ?? {}),
      })
      .returning();
    if (!order) throw new BadRequestException('Falha ao criar pedido');

    const gateway = this.gateways.forMethod(dto.method);
    // Cartão em claro só serve a gateways que tokenizam no servidor (Asaas); na
    // Stripe o navegador tokeniza e manda só o `pm_...`.
    const rawCard = dto.card && 'number' in dto.card ? dto.card : undefined;
    const cardPaymentMethodId =
      dto.card && 'paymentMethodId' in dto.card ? dto.card.paymentMethodId : undefined;
    if (dto.method === 'card' && gateway.provider === 'stripe' && !cardPaymentMethodId) {
      throw new BadRequestException(
        'Pagamento com cartão atualizado. Recarregue a página e tente novamente.',
      );
    }
    if (dto.method === 'card' && gateway.provider !== 'stripe' && !rawCard) {
      throw new BadRequestException('Dados do cartão ausentes.');
    }

    let charge;
    try {
      charge = await gateway.createCharge({
        orderId: order.id,
        amountCents: order.amountCents,
        method: dto.method,
        installments,
        customer: {
          name: dto.customer.name,
          email: user.email,
          cpfCnpj: dto.customer.cpfCnpj,
          phone: dto.customer.phone,
          postalCode: dto.customer.postalCode,
          addressNumber: dto.customer.addressNumber,
          remoteIp,
        },
        card: rawCard
          ? {
              number: rawCard.number,
              holderName: rawCard.holderName,
              expMonth: rawCard.expMonth,
              expYear: rawCard.expYear,
              cvv: rawCard.cvv,
            }
          : undefined,
        cardPaymentMethodId,
      });
    } catch (err) {
      // Cobrança falhou → não deixa o pedido órfão em `pending`.
      await this.db
        .update(orders)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(orders.id, order.id));
      throw err;
    }

    const [payment] = await this.db
      .insert(payments)
      .values({
        orderId: order.id,
        provider: gateway.provider,
        method: dto.method,
        status: charge.status,
        amountCents: order.amountCents,
        installments,
        providerChargeId: charge.providerChargeId,
        pixQrCode: charge.pixQrCode ?? null,
        pixCopyPaste: charge.pixCopyPaste ?? null,
        boletoUrl: charge.boletoUrl ?? null,
      })
      .returning();
    if (!payment) throw new BadRequestException('Falha ao registrar pagamento');

    if (charge.status === 'paid') {
      await this.confirmOrderPaid(order.id);
      return this.loadOrderDto(order.id, user.id);
    }

    // Cartão aguardando o 3D Secure no navegador: sem e-mail de "aguardando
    // pagamento" — o aluno conclui em segundos e recebe a confirmação.
    if (charge.clientSecret) {
      return { ...this.toOrderDto(order, payment, course), cardClientSecret: charge.clientSecret };
    }

    // Pedido aguardando pagamento (Pix/boleto): e-mail com o código/boleto.
    this.mailer.sendSafe(
      { email: user.email },
      orderCreatedMail({
        name: await this.userName(user.id),
        courseTitle: course.title,
        method: payment.method,
        amountCents: payment.amountCents,
        installments: payment.installments,
        pixCopyPaste: payment.pixCopyPaste,
        boletoUrl: payment.boletoUrl,
        alunoUrl: this.mailer.alunoUrl,
      }),
    );

    return this.toOrderDto(order, payment, course);
  }

  /** Consulta de pedido (polling do front). Só o dono acessa. */
  async getOrder(user: AuthUser, orderId: string): Promise<OrderDto> {
    return this.loadOrderDto(orderId, user.id);
  }

  /**
   * Simula a confirmação do pagamento (Pix/boleto) em desenvolvimento, no lugar
   * do webhook real. Bloqueado em produção e quando o gateway não é o fake.
   */
  async simulatePayment(user: AuthUser, orderId: string): Promise<OrderDto> {
    if (this.config.NODE_ENV === 'production' || !this.anySimulatable()) {
      throw new ForbiddenException('Simulação de pagamento indisponível');
    }
    const [order] = await this.db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, user.id)))
      .limit(1);
    if (!order) throw new NotFoundException('Pedido não encontrado');
    const [payment] = await this.db
      .select({ provider: payments.provider })
      .from(payments)
      .where(eq(payments.orderId, order.id))
      .limit(1);
    if (!payment || !this.gateways.byProvider(payment.provider)?.simulatable) {
      throw new ForbiddenException('Simulação de pagamento indisponível');
    }

    await this.confirmOrderPaid(order.id);
    return this.loadOrderDto(order.id, user.id);
  }

  private anySimulatable(): boolean {
    return this.gateways.all().some((g) => g.simulatable);
  }

  /**
   * Webhook genérico (dev/testes): localiza a cobrança e confirma o pedido. Não
   * tem autenticação, então só existe com o gateway fake fora de produção — com
   * o Asaas, a confirmação vem exclusivamente de `handleAsaasWebhook`.
   */
  async handleWebhook(dto: PaymentWebhookDto): Promise<{ ok: true }> {
    if (this.config.NODE_ENV === 'production' || !this.anySimulatable()) {
      throw new ForbiddenException('Webhook genérico indisponível');
    }
    const [payment] = await this.db
      .select()
      .from(payments)
      .where(eq(payments.providerChargeId, dto.providerChargeId))
      .limit(1);
    if (!payment) {
      this.logger.warn(`Webhook para cobrança desconhecida: ${dto.providerChargeId}`);
      return { ok: true };
    }
    if (dto.status === 'paid') {
      await this.confirmOrderPaid(payment.orderId);
    }
    return { ok: true };
  }

  /**
   * Webhook do Asaas. Autenticidade pelo token que o provedor envia no header
   * `asaas-access-token` (configurado no painel + `ASAAS_WEBHOOK_TOKEN`). Casa a
   * cobrança por `payment.id` (providerChargeId) ou `externalReference` (order id).
   */
  async handleAsaasWebhook(token: string | undefined, dto: AsaasWebhookDto): Promise<{ ok: true }> {
    const expected = this.config.ASAAS_WEBHOOK_TOKEN;
    if (!expected) {
      this.logger.warn('Webhook Asaas recebido sem ASAAS_WEBHOOK_TOKEN configurado — ignorado.');
      throw new UnauthorizedException();
    }
    if (token !== expected) {
      this.logger.warn('Webhook Asaas com token inválido.');
      throw new UnauthorizedException();
    }

    if (!dto.payment) return { ok: true };
    if (asaasEventToStatus(dto.event) !== 'paid') return { ok: true };

    const [payment] = await this.db
      .select({ orderId: payments.orderId })
      .from(payments)
      .where(eq(payments.providerChargeId, dto.payment.id))
      .limit(1);

    let orderId = payment?.orderId;
    if (!orderId && dto.payment.externalReference) {
      const [order] = await this.db
        .select({ id: orders.id })
        .from(orders)
        .where(eq(orders.id, dto.payment.externalReference))
        .limit(1);
      orderId = order?.id;
    }

    if (!orderId) {
      this.logger.warn(`Webhook Asaas para cobrança desconhecida: ${dto.payment.id}`);
      return { ok: true };
    }
    await this.confirmOrderPaid(orderId);
    return { ok: true };
  }

  /**
   * Webhook da Stripe. Autenticidade pela assinatura `stripe-signature` sobre o
   * corpo bruto (`STRIPE_WEBHOOK_SECRET`). Confirma em `payment_intent.succeeded`
   * casando por id do PaymentIntent ou pelo `metadata.orderId`.
   */
  async handleStripeWebhook(
    rawBody: Buffer | undefined,
    signature: string | undefined,
  ): Promise<{ ok: true }> {
    const stripe = this.gateways.byProvider('stripe');
    if (!(stripe instanceof StripePaymentGateway)) {
      this.logger.warn('Webhook Stripe recebido com a Stripe desligada — ignorado.');
      throw new UnauthorizedException();
    }
    const event = stripe.parseWebhook(rawBody, signature);
    if (event.type !== 'payment_intent.succeeded') {
      if (event.type === 'payment_intent.payment_failed') {
        const intent = event.data.object;
        this.logger.log(
          `Stripe: pagamento recusado (${intent.id}, pedido ${intent.metadata?.orderId ?? '?'}).`,
        );
      }
      return { ok: true };
    }

    const intent = event.data.object;
    const [payment] = await this.db
      .select({ orderId: payments.orderId })
      .from(payments)
      .where(eq(payments.providerChargeId, intent.id))
      .limit(1);
    let orderId = payment?.orderId;
    const metaOrderId = intent.metadata?.orderId;
    if (!orderId && metaOrderId && /^[0-9a-f-]{36}$/i.test(metaOrderId)) {
      const [order] = await this.db
        .select({ id: orders.id })
        .from(orders)
        .where(eq(orders.id, metaOrderId))
        .limit(1);
      orderId = order?.id;
    }
    if (!orderId) {
      this.logger.warn(`Webhook Stripe para cobrança desconhecida: ${intent.id}`);
      return { ok: true };
    }
    await this.confirmOrderPaid(orderId);
    return { ok: true };
  }

  /**
   * Reconciliação: para cada pedido pendente recente com cobrança em um gateway
   * real, consulta o provedor e confirma os já pagos (matrícula + e-mails).
   * Idempotente e tolerante: erro em um pedido não interrompe os demais.
   */
  async reconcilePendingPayments(): Promise<{ checked: number; confirmed: number }> {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const providers = this.gateways
      .all()
      .filter((g) => !g.simulatable)
      .map((g) => g.provider);
    if (providers.length === 0) return { checked: 0, confirmed: 0 };
    const rows = await this.db
      .select({
        orderId: orders.id,
        chargeId: payments.providerChargeId,
        provider: payments.provider,
      })
      .from(orders)
      .innerJoin(payments, eq(payments.orderId, orders.id))
      .where(
        and(
          eq(orders.status, 'pending'),
          gte(orders.createdAt, since),
          inArray(payments.provider, providers),
          isNotNull(payments.providerChargeId),
        ),
      )
      .limit(200);

    let confirmed = 0;
    for (const row of rows) {
      const gateway = this.gateways.byProvider(row.provider);
      if (!row.chargeId || !gateway) continue;
      try {
        const status = await gateway.getChargeStatus(row.chargeId);
        if (status === 'paid') {
          await this.confirmOrderPaid(row.orderId);
          confirmed += 1;
          this.logger.log(`Reconciliação confirmou o pedido ${row.orderId} (${row.chargeId}).`);
        }
      } catch (err) {
        this.logger.warn(`Reconciliação: falha no pedido ${row.orderId}: ${String(err)}`);
      }
    }
    return { checked: rows.length, confirmed };
  }

  /**
   * Promove o pedido a `paid`, marca o pagamento e cria a matrícula. Idempotente:
   * um segundo webhook para o mesmo pedido não duplica matrícula nem efeitos.
   */
  private async confirmOrderPaid(orderId: string): Promise<void> {
    const [order] = await this.db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) return;
    if (order.status === 'paid') return;

    const now = new Date();
    await this.db
      .update(orders)
      .set({ status: 'paid', paidAt: now, updatedAt: now })
      .where(eq(orders.id, orderId));
    await this.db
      .update(payments)
      .set({ status: 'paid', paidAt: now, updatedAt: now })
      .where(eq(payments.orderId, orderId));

    await this.db
      .insert(enrollments)
      .values({ userId: order.userId, courseId: order.courseId, status: 'active' })
      .onConflictDoNothing({ target: [enrollments.userId, enrollments.courseId] });

    await this.recordCrmPurchase(order).catch((err) => {
      // CRM é efeito secundário — nunca bloqueia a matrícula.
      this.logger.warn(`Falha ao registrar compra no CRM: ${String(err)}`);
    });
    await this.sendPaymentEmails(order).catch((err) => {
      this.logger.warn(`Falha ao preparar e-mails de confirmação: ${String(err)}`);
    });
  }

  private async userName(userId: string): Promise<string | null> {
    const [u] = await this.db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return u?.name ?? null;
  }

  /** Confirmação para o aluno + aviso interno de venda (se configurado). */
  private async sendPaymentEmails(order: Order): Promise<void> {
    const [buyer] = await this.db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, order.userId))
      .limit(1);
    const [course] = await this.db
      .select({ title: courses.title })
      .from(courses)
      .where(eq(courses.id, order.courseId))
      .limit(1);
    const [payment] = await this.db
      .select({
        method: payments.method,
        installments: payments.installments,
        amountCents: payments.amountCents,
      })
      .from(payments)
      .where(eq(payments.orderId, order.id))
      .limit(1);
    if (!buyer || !course || !payment) return;

    const common = {
      courseTitle: course.title,
      method: payment.method,
      amountCents: payment.amountCents,
      installments: payment.installments,
    };
    this.mailer.sendSafe(
      { email: buyer.email, name: buyer.name ?? undefined },
      paymentConfirmedMail({ ...common, name: buyer.name, alunoUrl: this.mailer.alunoUrl }),
    );
    const team = this.mailer.salesNotifyEmail;
    if (team) {
      this.mailer.sendSafe(
        { email: team },
        salesNoticeMail({
          ...common,
          buyerName: buyer.name,
          buyerEmail: buyer.email,
          orderId: order.id,
        }),
      );
    }
  }

  /** Alimenta a timeline do CRM na compra confirmada (lead ganho + interação). */
  private async recordCrmPurchase(order: Order): Promise<void> {
    const [buyer] = await this.db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, order.userId))
      .limit(1);
    if (!buyer?.email) return;

    const [course] = await this.db
      .select({ title: courses.title })
      .from(courses)
      .where(eq(courses.id, order.courseId))
      .limit(1);
    const title = course?.title ?? 'curso';
    const note = `Compra confirmada: ${title} — R$ ${(order.amountCents / 100).toFixed(2)}`;

    const [existing] = await this.db
      .select({ id: leads.id })
      .from(leads)
      .where(eq(leads.email, buyer.email))
      .limit(1);

    let leadId = existing?.id;
    if (leadId) {
      await this.db
        .update(leads)
        .set({ stage: 'won', updatedAt: new Date() })
        .where(eq(leads.id, leadId));
    } else {
      const [lead] = await this.db
        .insert(leads)
        .values({
          name: buyer.name ?? buyer.email.split('@')[0] ?? 'Aluno',
          email: buyer.email,
          source: 'checkout',
          stage: 'won',
          // Atribuição first-touch do comprador, capturada no checkout.
          utmSource: order.utmSource,
          utmMedium: order.utmMedium,
          utmCampaign: order.utmCampaign,
          utmContent: order.utmContent,
          utmTerm: order.utmTerm,
          referrer: order.referrer,
          landingPath: order.landingPath,
          gclid: order.gclid,
          fbclid: order.fbclid,
        })
        .returning({ id: leads.id });
      leadId = lead?.id;
    }
    if (leadId) {
      await this.db.insert(crmInteractions).values({ leadId, note });
    }
  }

  private async loadOrderDto(orderId: string, userId: string): Promise<OrderDto> {
    const [row] = await this.db
      .select({
        order: orders,
        payment: payments,
        courseSlug: courses.slug,
        courseTitle: courses.title,
        courseCover: courses.coverUrl,
      })
      .from(orders)
      .innerJoin(payments, eq(payments.orderId, orders.id))
      .innerJoin(courses, eq(orders.courseId, courses.id))
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
      .limit(1);
    if (!row) throw new NotFoundException('Pedido não encontrado');
    return this.toOrderDto(row.order, row.payment, {
      slug: row.courseSlug,
      title: row.courseTitle,
      coverUrl: row.courseCover,
    });
  }

  private toOrderDto(
    order: Order,
    payment: Payment,
    course: { slug: string; title: string; coverUrl: string | null },
  ): OrderDto {
    return {
      id: order.id,
      status: order.status,
      method: payment.method,
      amountCents: order.amountCents,
      currency: order.currency,
      installments: payment.installments,
      course: { slug: course.slug, title: course.title, coverUrl: course.coverUrl },
      pixQrCode: payment.pixQrCode,
      pixCopyPaste: payment.pixCopyPaste,
      boletoUrl: payment.boletoUrl,
      simulatable:
        Boolean(this.gateways.byProvider(payment.provider)?.simulatable) &&
        order.status === 'pending',
      createdAt: order.createdAt.toISOString(),
      cardClientSecret: null,
    };
  }
}
