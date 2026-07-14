import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { DB, type Database } from '../db/client';
import { courses } from '../db/schema/catalog';
import { enrollments } from '../db/schema/enrollment';
import { orders, payments, type Order, type Payment } from '../db/schema/commerce';
import { crmInteractions, leads } from '../db/schema/crm';
import { users } from '../db/schema/identity';
import { APP_CONFIG, type AppConfig } from '../config/configuration';
import type { AuthUser } from '../common/auth-user';
import type { CreateCheckoutDto, OrderDto, PaymentWebhookDto } from './dto';
import { PAYMENT_GATEWAY, type PaymentGateway } from './payment-gateway';

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    @Inject(DB) private readonly db: Database,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  /** Inicia o checkout: cria o pedido, cobra no gateway e (se já aprovado) matricula. */
  async createCheckout(user: AuthUser, dto: CreateCheckoutDto): Promise<OrderDto> {
    const [course] = await this.db
      .select({
        id: courses.id,
        slug: courses.slug,
        title: courses.title,
        coverUrl: courses.coverUrl,
        priceCents: courses.priceCents,
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

    const installments = dto.method === 'card' ? (dto.card?.installments ?? 1) : 1;

    const [order] = await this.db
      .insert(orders)
      .values({
        userId: user.id,
        courseId: course.id,
        amountCents: course.priceCents,
        ...(dto.attribution ?? {}),
      })
      .returning();
    if (!order) throw new BadRequestException('Falha ao criar pedido');

    const charge = await this.gateway.createCharge({
      orderId: order.id,
      amountCents: order.amountCents,
      method: dto.method,
      customer: { name: null, email: user.email },
      card: dto.card
        ? {
            number: dto.card.number,
            holderName: dto.card.holderName,
            expMonth: dto.card.expMonth,
            expYear: dto.card.expYear,
            cvv: dto.card.cvv,
            installments,
          }
        : undefined,
    });

    const [payment] = await this.db
      .insert(payments)
      .values({
        orderId: order.id,
        provider: this.gateway.provider,
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
    if (this.config.NODE_ENV === 'production' || !this.gateway.simulatable) {
      throw new ForbiddenException('Simulação de pagamento indisponível');
    }
    const [order] = await this.db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, user.id)))
      .limit(1);
    if (!order) throw new NotFoundException('Pedido não encontrado');

    await this.confirmOrderPaid(order.id);
    return this.loadOrderDto(order.id, user.id);
  }

  /** Webhook do gateway: localiza a cobrança e confirma/estorna o pedido. */
  async handleWebhook(dto: PaymentWebhookDto): Promise<{ ok: true }> {
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
      simulatable: this.gateway.simulatable && order.status === 'pending',
      createdAt: order.createdAt.toISOString(),
    };
  }
}
