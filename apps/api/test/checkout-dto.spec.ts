import { describe, expect, it } from 'vitest';
import { createCheckoutSchema, paymentWebhookSchema } from '../src/checkout/dto';
import { FakePaymentGateway } from '../src/checkout/fake-gateway';

describe('createCheckoutSchema', () => {
  it('aceita Pix sem cartão', () => {
    const r = createCheckoutSchema.safeParse({ courseSlug: 'x', method: 'pix' });
    expect(r.success).toBe(true);
  });

  it('exige dados de cartão quando o método é cartão', () => {
    const r = createCheckoutSchema.safeParse({ courseSlug: 'x', method: 'card' });
    expect(r.success).toBe(false);
  });

  it('aceita cartão com dados completos', () => {
    const r = createCheckoutSchema.safeParse({
      courseSlug: 'x',
      method: 'card',
      card: {
        number: '4111111111111111',
        holderName: 'Ana Vet',
        expMonth: 12,
        expYear: 2030,
        cvv: '123',
        installments: 6,
      },
    });
    expect(r.success).toBe(true);
  });

  it('rejeita método desconhecido', () => {
    const r = createCheckoutSchema.safeParse({ courseSlug: 'x', method: 'crypto' });
    expect(r.success).toBe(false);
  });
});

describe('paymentWebhookSchema', () => {
  it('exige providerChargeId e status', () => {
    expect(
      paymentWebhookSchema.safeParse({
        event: 'PAYMENT_CONFIRMED',
        providerChargeId: 'c1',
        status: 'paid',
      }).success,
    ).toBe(true);
    expect(paymentWebhookSchema.safeParse({ event: 'x', status: 'paid' }).success).toBe(false);
  });
});

describe('FakePaymentGateway', () => {
  const gw = new FakePaymentGateway();

  it('autoriza cartão na hora (paid)', async () => {
    const r = await gw.createCharge({
      orderId: 'o1',
      amountCents: 1000,
      method: 'card',
      customer: { name: null, email: 'a@b.com' },
    });
    expect(r.status).toBe('paid');
    expect(r.providerChargeId).toMatch(/^fake_/);
  });

  it('deixa Pix pendente com copia-e-cola', async () => {
    const r = await gw.createCharge({
      orderId: 'o2',
      amountCents: 149700,
      method: 'pix',
      customer: { name: null, email: 'a@b.com' },
    });
    expect(r.status).toBe('pending');
    expect(r.pixCopyPaste).toBeTruthy();
  });

  it('deixa boleto pendente com URL', async () => {
    const r = await gw.createCharge({
      orderId: 'o3',
      amountCents: 5000,
      method: 'boleto',
      customer: { name: null, email: 'a@b.com' },
    });
    expect(r.status).toBe('pending');
    expect(r.boletoUrl).toContain('boleto/');
  });
});
