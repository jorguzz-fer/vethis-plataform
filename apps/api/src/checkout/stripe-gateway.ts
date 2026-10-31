import { BadRequestException, Logger, ServiceUnavailableException } from '@nestjs/common';
import Stripe from 'stripe';
import type { AppConfig } from '../config/configuration';
import type { ChargeResult, CreateChargeInput, PaymentGateway } from './payment-gateway';

/**
 * Superfície mínima do SDK que o adapter usa — permite testar com um dublê sem
 * rede. O `Stripe` real satisfaz esta interface.
 */
export interface StripeClientLike {
  paymentIntents: {
    create(
      params: Stripe.PaymentIntentCreateParams,
      options?: Stripe.RequestOptions,
    ): Promise<Stripe.PaymentIntent>;
    confirm(
      id: string,
      params?: Stripe.PaymentIntentConfirmParams,
      options?: Stripe.RequestOptions,
    ): Promise<Stripe.PaymentIntent>;
    retrieve(id: string): Promise<Stripe.PaymentIntent>;
    cancel(id: string): Promise<Stripe.PaymentIntent>;
  };
  webhooks: {
    constructEvent(payload: string | Buffer, header: string, secret: string): Stripe.Event;
  };
}

/** Situação de um PaymentIntent no formato do port. */
export function stripeStatusToCharge(status: Stripe.PaymentIntent.Status): ChargeResult['status'] {
  switch (status) {
    case 'succeeded':
      return 'paid';
    case 'processing':
    case 'requires_action':
    case 'requires_confirmation':
    case 'requires_capture':
      return 'pending';
    default:
      // requires_payment_method (recusado) e canceled.
      return 'failed';
  }
}

/** Mensagens de recusa em português (a Stripe responde em inglês). */
const DECLINE_MESSAGES: Record<string, string> = {
  insufficient_funds: 'Cartão recusado por saldo ou limite insuficiente.',
  expired_card: 'Cartão vencido. Confira a validade ou use outro cartão.',
  incorrect_cvc: 'Código de segurança (CVV) incorreto.',
  incorrect_number: 'Número do cartão incorreto.',
  invalid_cvc: 'Código de segurança (CVV) inválido.',
  invalid_expiry_month: 'Mês de validade inválido.',
  invalid_expiry_year: 'Ano de validade inválido.',
  processing_error: 'Erro ao processar o cartão. Tente novamente em instantes.',
  authentication_required: 'O banco exigiu autenticação e ela não foi concluída.',
  card_not_supported: 'Este cartão não aceita este tipo de compra.',
};

const GENERIC_DECLINE =
  'Pagamento recusado pelo banco emissor. Tente outro cartão ou fale com o seu banco.';

/** Traduz uma recusa (`code`/`decline_code`) para a mensagem mostrada no checkout. */
export function declineMessage(code?: string | null, declineCode?: string | null): string {
  return (
    (declineCode && DECLINE_MESSAGES[declineCode]) ||
    (code && DECLINE_MESSAGES[code]) ||
    GENERIC_DECLINE
  );
}

/**
 * Adapter Stripe do `PaymentGateway` (cartão e Pix).
 *
 * - **Pix**: cria e confirma o PaymentIntent na hora; devolve o copia-e-cola e
 *   a URL do QR. A confirmação chega pelo webhook `payment_intent.succeeded`.
 * - **Cartão**: o número nunca passa pela API — o navegador tokeniza com o
 *   Stripe.js e envia só o `pm_...`. O servidor cria o PaymentIntent, confere
 *   se o parcelamento pedido está entre os planos que a Stripe oferece para
 *   aquele cartão e confirma com o plano. Se o banco pedir 3D Secure, devolve
 *   `clientSecret` para o navegador concluir.
 * - **Boleto**: não atendido (a Stripe não emite carnê); o carnê fica no Asaas.
 *
 * O valor e o número de parcelas vêm sempre do servidor (pricing), nunca do cliente.
 */
export class StripePaymentGateway implements PaymentGateway {
  readonly provider = 'stripe';
  readonly simulatable = false;
  private readonly logger = new Logger(StripePaymentGateway.name);
  private readonly client: StripeClientLike;
  private readonly webhookSecret: string | undefined;

  constructor(config: AppConfig, client?: StripeClientLike) {
    if (!client && !config.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY ausente para o gateway stripe');
    }
    this.client =
      client ??
      (new Stripe(config.STRIPE_SECRET_KEY as string, {
        appInfo: { name: 'Vethis' },
        maxNetworkRetries: 2,
      }) as unknown as StripeClientLike);
    this.webhookSecret = config.STRIPE_WEBHOOK_SECRET;
  }

  /** Valida a assinatura do webhook e devolve o evento. Lança 400 se inválida. */
  parseWebhook(rawBody: Buffer | undefined, signature: string | undefined): Stripe.Event {
    if (!this.webhookSecret) {
      this.logger.warn('Webhook Stripe recebido sem STRIPE_WEBHOOK_SECRET configurado.');
      throw new BadRequestException('Webhook não configurado');
    }
    if (!rawBody || !signature) throw new BadRequestException('Assinatura ausente');
    try {
      return this.client.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
    } catch (err) {
      this.logger.warn(`Webhook Stripe com assinatura inválida: ${String(err)}`);
      throw new BadRequestException('Assinatura inválida');
    }
  }

  async getChargeStatus(providerChargeId: string): Promise<ChargeResult['status']> {
    const intent = await this.call(() => this.client.paymentIntents.retrieve(providerChargeId));
    return stripeStatusToCharge(intent.status);
  }

  async createCharge(input: CreateChargeInput): Promise<ChargeResult> {
    if (input.method === 'pix') return this.createPix(input);
    if (input.method === 'card') return this.createCard(input);
    throw new BadRequestException('Boleto não é emitido pela Stripe.');
  }

  private common(input: CreateChargeInput) {
    return {
      amount: input.amountCents,
      currency: 'brl',
      description: `Matrícula Vethis — pedido ${input.orderId}`,
      metadata: { orderId: input.orderId },
    };
  }

  private async createPix(input: CreateChargeInput): Promise<ChargeResult> {
    const intent = await this.call(() =>
      this.client.paymentIntents.create(
        {
          ...this.common(input),
          allowed_payment_method_types: ['pix'],
          payment_method_data: {
            type: 'pix',
            billing_details: {
              name: input.customer.name ?? undefined,
              email: input.customer.email,
              tax_id: input.customer.cpfCnpj,
            },
          },
          // Mesmo prazo do Asaas: o QR vale 24h.
          payment_method_options: { pix: { expires_after_seconds: 24 * 60 * 60 } },
          confirm: true,
        },
        { idempotencyKey: `order-${input.orderId}-pix` },
      ),
    );
    const qr = intent.next_action?.pix_display_qr_code;
    if (!qr?.data) {
      this.logger.error(`Stripe Pix sem QR (pedido ${input.orderId}, status ${intent.status}).`);
      throw new ServiceUnavailableException('Não foi possível gerar o Pix. Tente novamente.');
    }
    return {
      providerChargeId: intent.id,
      status: stripeStatusToCharge(intent.status),
      pixCopyPaste: qr.data,
      pixQrCode: qr.image_url_png ?? undefined,
    };
  }

  private async createCard(input: CreateChargeInput): Promise<ChargeResult> {
    if (!input.cardPaymentMethodId) {
      throw new BadRequestException('Cartão não tokenizado. Recarregue a página e tente de novo.');
    }
    const parcelado = input.installments > 1;

    const intent = await this.call(() =>
      this.client.paymentIntents.create(
        {
          ...this.common(input),
          allowed_payment_method_types: ['card'],
          payment_method: input.cardPaymentMethodId,
          // Habilitar o parcelamento faz a Stripe listar os planos aceitos por
          // este cartão em `available_plans` (só confirmamos depois de conferir).
          payment_method_options: parcelado
            ? { card: { installments: { enabled: true } } }
            : undefined,
          confirm: false,
        },
        { idempotencyKey: `order-${input.orderId}-card` },
      ),
    );

    let plan:
      Stripe.PaymentIntentConfirmParams.PaymentMethodOptions.Card.Installments.Plan | undefined;
    if (parcelado) {
      const available = intent.payment_method_options?.card?.installments?.available_plans ?? [];
      const match = available.find(
        (p) => p.type === 'fixed_count' && p.count === input.installments && p.interval === 'month',
      );
      if (!match) {
        await this.client.paymentIntents.cancel(intent.id).catch(() => undefined);
        const max = available
          .filter((p) => p.type === 'fixed_count' && p.count)
          .reduce((m, p) => Math.max(m, p.count ?? 0), 0);
        throw new BadRequestException(
          max > 1
            ? `Este cartão aceita parcelamento em até ${max}x. Escolha menos parcelas.`
            : 'Este cartão não aceita parcelamento. Escolha pagamento à vista ou outro cartão.',
        );
      }
      plan = { type: 'fixed_count', count: input.installments, interval: 'month' };
    }

    const confirmed = await this.call(() =>
      this.client.paymentIntents.confirm(
        intent.id,
        {
          ...(plan ? { payment_method_options: { card: { installments: { plan } } } } : {}),
          // 3D Secure é concluído no navegador pelo Stripe.js (handleNextAction).
          use_stripe_sdk: true,
        },
        { idempotencyKey: `order-${input.orderId}-card-confirm` },
      ),
    );

    if (confirmed.status === 'requires_action' && confirmed.client_secret) {
      return {
        providerChargeId: confirmed.id,
        status: 'pending',
        clientSecret: confirmed.client_secret,
      };
    }
    const status = stripeStatusToCharge(confirmed.status);
    if (status === 'failed') {
      const err = confirmed.last_payment_error;
      throw new BadRequestException(declineMessage(err?.code, err?.decline_code));
    }
    return { providerChargeId: confirmed.id, status };
  }

  /** Executa uma chamada à Stripe traduzindo erros para HTTP + português. */
  private async call<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      const e = err as {
        type?: string;
        code?: string;
        decline_code?: string;
        message?: string;
      };
      if (e.type === 'StripeCardError') {
        throw new BadRequestException(declineMessage(e.code, e.decline_code));
      }
      if (e.type === 'StripeInvalidRequestError') {
        this.logger.warn(`Stripe rejeitou a requisição: ${e.message ?? String(err)}`);
        throw new BadRequestException(
          e.message ? `Pagamento rejeitado: ${e.message}` : 'Pagamento rejeitado pela Stripe.',
        );
      }
      this.logger.error(`Stripe indisponível: ${e.message ?? String(err)}`);
      throw new ServiceUnavailableException('Pagamento indisponível no momento. Tente novamente.');
    }
  }
}
