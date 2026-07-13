import type { PaymentMethodDto } from './dto';

/** Cliente cobrado (para NF/Pix). Não inclui dados de cartão. */
export interface ChargeCustomer {
  name: string | null;
  email: string;
}

/** Dados de cartão repassados ao gateway (nunca persistidos). */
export interface ChargeCard {
  number: string;
  holderName: string;
  expMonth: number;
  expYear: number;
  cvv: string;
  installments: number;
}

export interface CreateChargeInput {
  orderId: string;
  amountCents: number;
  method: PaymentMethodDto;
  customer: ChargeCustomer;
  card?: ChargeCard;
}

/** Resultado normalizado de uma cobrança, independente do provedor. */
export interface ChargeResult {
  providerChargeId: string;
  status: 'pending' | 'paid' | 'failed';
  pixQrCode?: string;
  pixCopyPaste?: string;
  boletoUrl?: string;
}

/**
 * Port de pagamento (ADR 0004). A API depende só desta interface; adapters
 * concretos (`fake`, `asaas`) são plugados por DI. Trocar de PSP não toca no
 * domínio de checkout/matrícula.
 */
export interface PaymentGateway {
  /** Identificador do provedor, gravado em `payments.provider`. */
  readonly provider: string;
  /** `true` quando é um adapter de desenvolvimento (permite simular confirmação). */
  readonly simulatable: boolean;
  createCharge(input: CreateChargeInput): Promise<ChargeResult>;
}

/** Token de injeção do gateway ativo. */
export const PAYMENT_GATEWAY = 'PAYMENT_GATEWAY';
