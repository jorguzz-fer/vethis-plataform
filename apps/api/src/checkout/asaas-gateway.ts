import { BadRequestException, Logger, ServiceUnavailableException } from '@nestjs/common';
import type { AppConfig } from '../config/configuration';
import type { ChargeResult, CreateChargeInput, PaymentGateway } from './payment-gateway';

/** Mapeia o status do Asaas para o status normalizado do domínio. */
export function asaasStatusToCharge(status: string): ChargeResult['status'] {
  switch (status) {
    case 'CONFIRMED':
    case 'RECEIVED':
    case 'RECEIVED_IN_CASH':
      return 'paid';
    case 'PENDING':
    case 'AWAITING_PAYMENT':
    case 'AWAITING_RISK_ANALYSIS':
      return 'pending';
    default:
      return 'failed';
  }
}

/** Mapeia o evento de webhook do Asaas para confirmação de pagamento. */
export function asaasEventToStatus(event: string): 'paid' | null {
  switch (event) {
    case 'PAYMENT_CONFIRMED':
    case 'PAYMENT_RECEIVED':
    case 'PAYMENT_RECEIVED_IN_CASH':
      return 'paid';
    default:
      return null;
  }
}

const BILLING_TYPE: Record<CreateChargeInput['method'], string> = {
  pix: 'PIX',
  boleto: 'BOLETO',
  card: 'CREDIT_CARD',
};

interface AsaasPayment {
  id: string;
  status: string;
  invoiceUrl?: string | null;
  bankSlipUrl?: string | null;
}

/** Data de vencimento (hoje + `days`) no formato YYYY-MM-DD exigido pelo Asaas. */
function dueDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function onlyDigits(v: string | undefined): string {
  return (v ?? '').replace(/\D/g, '');
}

/**
 * Adapter Asaas do `PaymentGateway` (ADR 0004). Cria o cliente (por CPF/CNPJ),
 * abre a cobrança (Pix/boleto/cartão) e devolve o resultado normalizado. Nunca
 * persiste dados de cartão; `externalReference` carrega o id do pedido para o
 * webhook casar com robustez. `simulatable = false` (confirmação vem do webhook).
 */
export class AsaasPaymentGateway implements PaymentGateway {
  readonly provider = 'asaas';
  readonly simulatable = false;
  private readonly logger = new Logger(AsaasPaymentGateway.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(config: AppConfig) {
    if (!config.ASAAS_API_KEY) {
      throw new Error('ASAAS_API_KEY ausente para o gateway asaas');
    }
    this.baseUrl = config.ASAAS_BASE_URL.replace(/\/+$/, '');
    this.apiKey = config.ASAAS_API_KEY;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          access_token: this.apiKey,
          'Content-Type': 'application/json',
          'User-Agent': 'Vethis',
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (err) {
      this.logger.error(`Asaas ${method} ${path} — falha de rede: ${String(err)}`);
      throw new ServiceUnavailableException('Pagamento indisponível no momento. Tente novamente.');
    }
    const text = await res.text();
    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = null; // corpo não-JSON (ex.: página de erro de infra)
      }
    }
    if (!res.ok) {
      const message = extractAsaasError(data) ?? `Asaas ${res.status}`;
      this.logger.warn(`Asaas ${method} ${path} → ${res.status}: ${message}`);
      throw new BadRequestException(message);
    }
    if (data === null) {
      this.logger.error(`Asaas ${method} ${path} → resposta não-JSON: ${text.slice(0, 200)}`);
      throw new ServiceUnavailableException('Pagamento indisponível no momento. Tente novamente.');
    }
    return data as T;
  }

  /** Reaproveita o cliente pelo CPF/CNPJ; cria se ainda não existir. */
  private async ensureCustomer(input: CreateChargeInput): Promise<string> {
    const cpfCnpj = onlyDigits(input.customer.cpfCnpj);
    if (!cpfCnpj) throw new BadRequestException('CPF/CNPJ é obrigatório para o pagamento.');

    const found = await this.request<{ data: Array<{ id: string }> }>(
      'GET',
      `/customers?cpfCnpj=${cpfCnpj}&limit=1`,
    );
    if (found.data?.[0]?.id) return found.data[0].id;

    const created = await this.request<{ id: string }>('POST', '/customers', {
      name: input.customer.name ?? input.customer.email,
      email: input.customer.email,
      cpfCnpj,
      mobilePhone: onlyDigits(input.customer.phone) || undefined,
    });
    return created.id;
  }

  async createCharge(input: CreateChargeInput): Promise<ChargeResult> {
    const customer = await this.ensureCustomer(input);
    const value = Number((input.amountCents / 100).toFixed(2));

    const payload: Record<string, unknown> = {
      customer,
      billingType: BILLING_TYPE[input.method],
      value,
      dueDate: dueDate(input.method === 'boleto' ? 3 : 1),
      externalReference: input.orderId,
      description: `Matrícula Vethis — pedido ${input.orderId}`,
    };

    if (input.method === 'card') {
      if (!input.card) throw new BadRequestException('Dados do cartão ausentes.');
      payload.creditCard = {
        holderName: input.card.holderName,
        number: onlyDigits(input.card.number),
        expiryMonth: String(input.card.expMonth).padStart(2, '0'),
        expiryYear: String(input.card.expYear),
        ccv: input.card.cvv,
      };
      payload.creditCardHolderInfo = {
        name: input.card.holderName,
        email: input.customer.email,
        cpfCnpj: onlyDigits(input.customer.cpfCnpj),
        postalCode: onlyDigits(input.customer.postalCode),
        addressNumber: input.customer.addressNumber,
        phone: onlyDigits(input.customer.phone),
      };
      payload.installmentCount = input.card.installments > 1 ? input.card.installments : undefined;
      if (input.customer.remoteIp) payload.remoteIp = input.customer.remoteIp;
    }

    const payment = await this.request<AsaasPayment>('POST', '/payments', payload);
    const status = asaasStatusToCharge(payment.status);

    if (input.method === 'pix') {
      const pix = await this.request<{ payload?: string; encodedImage?: string }>(
        'GET',
        `/payments/${payment.id}/pixQrCode`,
      );
      return {
        providerChargeId: payment.id,
        status,
        pixCopyPaste: pix.payload,
        pixQrCode: pix.encodedImage,
      };
    }

    if (input.method === 'boleto') {
      return {
        providerChargeId: payment.id,
        status,
        boletoUrl: payment.bankSlipUrl ?? payment.invoiceUrl ?? undefined,
      };
    }

    return { providerChargeId: payment.id, status };
  }
}

/** Extrai a mensagem de erro do corpo de resposta do Asaas. */
function extractAsaasError(data: unknown): string | null {
  if (
    data &&
    typeof data === 'object' &&
    'errors' in data &&
    Array.isArray((data as { errors: unknown }).errors)
  ) {
    const first = (data as { errors: Array<{ description?: string }> }).errors[0];
    if (first?.description) return first.description;
  }
  return null;
}
