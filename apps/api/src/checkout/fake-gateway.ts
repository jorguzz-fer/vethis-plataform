import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { ChargeResult, CreateChargeInput, PaymentGateway } from './payment-gateway';

/**
 * Adapter de desenvolvimento do `PaymentGateway`. Simula o comportamento real
 * dos meios de pagamento sem tocar em nenhum PSP:
 *
 * - **Cartão**: autoriza na hora → `paid` (como um cartão aprovado de verdade).
 * - **Pix**: fica `pending` e devolve um copia-e-cola/QR falso; a confirmação
 *   chega depois (webhook real ou o endpoint de simulação em dev).
 * - **Boleto**: fica `pending` e devolve uma URL falsa.
 *
 * Mantém o fluxo ponta-a-ponta testável (pedido → pagamento → matrícula) antes
 * de ligar o Asaas sandbox.
 */
@Injectable()
export class FakePaymentGateway implements PaymentGateway {
  readonly provider = 'fake';
  readonly simulatable = true;

  async createCharge(input: CreateChargeInput): Promise<ChargeResult> {
    const providerChargeId = `fake_${randomUUID()}`;

    if (input.method === 'card') {
      return { providerChargeId, status: 'paid' };
    }

    if (input.method === 'pix') {
      const payload = buildFakePixPayload(input.amountCents, providerChargeId);
      return {
        providerChargeId,
        status: 'pending',
        pixQrCode: payload,
        pixCopyPaste: payload,
      };
    }

    return {
      providerChargeId,
      status: 'pending',
      boletoUrl: `https://sandbox.pay.vethis.dev/boleto/${providerChargeId}`,
    };
  }
}

/** Copia-e-cola de Pix fictício (formato aproximado do BR Code EMV). */
function buildFakePixPayload(amountCents: number, id: string): string {
  const amount = (amountCents / 100).toFixed(2);
  return `00020126VETHIS-DEMO-PIX-${id}5204000053039865406${amount}5802BR5906VETHIS6009SAO PAULO`;
}
