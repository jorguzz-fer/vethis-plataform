import type { PaymentMethodDto } from './dto';

/** Cliente cobrado (para NF/Pix). Não inclui dados de cartão. */
export interface ChargeCustomer {
  name: string | null;
  email: string;
  /** CPF ou CNPJ (só dígitos) — exigido pelo Asaas em Pix/boleto/cartão. */
  cpfCnpj?: string;
  /** Campos extras exigidos pelo antifraude no cartão. */
  phone?: string;
  postalCode?: string;
  addressNumber?: string;
  /** IP do comprador (antifraude do cartão). */
  remoteIp?: string;
}

/** Dados de cartão repassados ao gateway (nunca persistidos). */
export interface ChargeCard {
  number: string;
  holderName: string;
  expMonth: number;
  expYear: number;
  cvv: string;
}

export interface CreateChargeInput {
  orderId: string;
  amountCents: number;
  method: PaymentMethodDto;
  /** Parcelas (cartão e boleto/carnê); 1 = à vista. */
  installments: number;
  customer: ChargeCustomer;
  /** Cartão em claro — só para gateways que tokenizam no servidor (Asaas). */
  card?: ChargeCard;
  /** Cartão já tokenizado no navegador pelo Stripe.js (`pm_...`). */
  cardPaymentMethodId?: string;
}

/** Resultado normalizado de uma cobrança, independente do provedor. */
export interface ChargeResult {
  providerChargeId: string;
  status: 'pending' | 'paid' | 'failed';
  /** QR do Pix: PNG em base64 (Asaas) ou URL https da imagem (Stripe). */
  pixQrCode?: string;
  pixCopyPaste?: string;
  boletoUrl?: string;
  /**
   * Cartão aguardando autenticação do banco (3D Secure): o navegador conclui com
   * o Stripe.js usando este segredo. Não é persistido.
   */
  clientSecret?: string;
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
  /** Situação atual de uma cobrança no provedor (usado pela reconciliação). */
  getChargeStatus(providerChargeId: string): Promise<ChargeResult['status']>;
}

/**
 * Gateways ativos, por meio de pagamento (ex.: cartão e Pix na Stripe, carnê no
 * Asaas). Cada cobrança grava o `provider` que a emitiu, então reconciliação e
 * webhooks sempre voltam ao adapter certo.
 */
export interface PaymentGateways {
  forMethod(method: PaymentMethodDto): PaymentGateway;
  byProvider(provider: string): PaymentGateway | undefined;
  all(): readonly PaymentGateway[];
}

/** Token de injeção dos gateways ativos. */
export const PAYMENT_GATEWAYS = 'PAYMENT_GATEWAYS';
