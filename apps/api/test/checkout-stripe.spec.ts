import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi, type Mock } from 'vitest';
import type Stripe from 'stripe';
import StripeSdk from 'stripe';
import { gatewayForMethod, loadConfig } from '../src/config/configuration';
import { createCheckoutSchema } from '../src/checkout/dto';
import { buildPaymentGateways } from '../src/checkout/gateway-registry';
import { effectiveInstallments } from '../src/checkout/pricing';
import {
  StripePaymentGateway,
  declineMessage,
  stripeStatusToCharge,
  type StripeClientLike,
} from '../src/checkout/stripe-gateway';
import type { CreateChargeInput } from '../src/checkout/payment-gateway';

const baseEnv = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://vethis:vethis@localhost:5432/vethis',
  SESSION_SECRET: 'a-very-long-session-secret',
} as NodeJS.ProcessEnv;

const stripeEnv = {
  ...baseEnv,
  PAYMENT_GATEWAY: 'stripe',
  STRIPE_SECRET_KEY: 'sk_test_x',
  STRIPE_WEBHOOK_SECRET: 'whsec_x',
  ASAAS_API_KEY: '$aact_hmlg_x',
  ASAAS_WEBHOOK_TOKEN: 'tok',
} as NodeJS.ProcessEnv;

describe('gatewayForMethod / config', () => {
  it('PAYMENT_GATEWAY=stripe: cartão e Pix na Stripe, carnê no Asaas', () => {
    const cfg = loadConfig(stripeEnv);
    expect(gatewayForMethod(cfg, 'card')).toBe('stripe');
    expect(gatewayForMethod(cfg, 'pix')).toBe('stripe');
    expect(gatewayForMethod(cfg, 'boleto')).toBe('asaas');
  });

  it('sobrescrita por meio vence o padrão', () => {
    const cfg = loadConfig({ ...stripeEnv, PAYMENT_GATEWAY_PIX: 'asaas' });
    expect(gatewayForMethod(cfg, 'pix')).toBe('asaas');
    expect(gatewayForMethod(cfg, 'card')).toBe('stripe');
  });

  it('exige as chaves da Stripe quando ela atende algum meio', () => {
    const { STRIPE_SECRET_KEY: _k, ...semChave } = stripeEnv;
    void _k;
    expect(() => loadConfig(semChave as NodeJS.ProcessEnv)).toThrow(/STRIPE_SECRET_KEY/);
    const { STRIPE_WEBHOOK_SECRET: _w, ...semWebhook } = stripeEnv;
    void _w;
    expect(() => loadConfig(semWebhook as NodeJS.ProcessEnv)).toThrow(/STRIPE_WEBHOOK_SECRET/);
  });

  it('exige o Asaas para o carnê mesmo com PAYMENT_GATEWAY=stripe', () => {
    const { ASAAS_API_KEY: _a, ...semAsaas } = stripeEnv;
    void _a;
    expect(() => loadConfig(semAsaas as NodeJS.ProcessEnv)).toThrow(/ASAAS_API_KEY.*boleto/);
  });

  it('recusa boleto na Stripe (não emite carnê)', () => {
    expect(() => loadConfig({ ...stripeEnv, PAYMENT_GATEWAY_BOLETO: 'stripe' })).toThrow(
      /PAYMENT_GATEWAY_BOLETO/,
    );
  });

  it('o padrão continua fake sem nenhuma chave', () => {
    const cfg = loadConfig(baseEnv);
    expect(gatewayForMethod(cfg, 'card')).toBe('fake');
    expect(gatewayForMethod(cfg, 'boleto')).toBe('fake');
  });
});

describe('buildPaymentGateways', () => {
  it('resolve o adapter de cada meio e mantém o Asaas para cobranças antigas', () => {
    const gws = buildPaymentGateways(loadConfig(stripeEnv));
    expect(gws.forMethod('card').provider).toBe('stripe');
    expect(gws.forMethod('pix').provider).toBe('stripe');
    expect(gws.forMethod('boleto').provider).toBe('asaas');
    expect(gws.byProvider('asaas')?.provider).toBe('asaas');
    expect(gws.all()).toHaveLength(2);
  });

  it('mantém o Asaas registrado para webhooks mesmo sem atender meio algum', () => {
    const gws = buildPaymentGateways(loadConfig({ ...stripeEnv, PAYMENT_GATEWAY_BOLETO: 'fake' }));
    expect(gws.byProvider('asaas')).toBeDefined();
  });
});

describe('effectiveInstallments', () => {
  it('limita o carnê a 15x e o cartão a 24x', () => {
    expect(effectiveInstallments('boleto', 24, 24)).toBe(15);
    expect(effectiveInstallments('card', 24, 24)).toBe(24);
    expect(effectiveInstallments('boleto', 10, 12)).toBe(10);
    expect(effectiveInstallments('pix', 12, 24)).toBe(1);
  });
});

describe('createCheckoutSchema (cartão tokenizado)', () => {
  const customer = { name: 'Maria Silva', cpfCnpj: '390.533.447-05' };

  it('aceita o token da Stripe sem telefone/CEP', () => {
    const r = createCheckoutSchema.safeParse({
      courseSlug: 'x',
      method: 'card',
      customer,
      card: { paymentMethodId: 'pm_1AbC' },
      installments: 3,
    });
    expect(r.success).toBe(true);
  });

  it('cartão em claro continua exigindo telefone, CEP e número', () => {
    const r = createCheckoutSchema.safeParse({
      courseSlug: 'x',
      method: 'card',
      customer,
      card: {
        number: '4111111111111111',
        holderName: 'MARIA',
        expMonth: 1,
        expYear: 2030,
        cvv: '123',
      },
    });
    expect(r.success).toBe(false);
  });

  it('recusa token que não é de PaymentMethod', () => {
    const r = createCheckoutSchema.safeParse({
      courseSlug: 'x',
      method: 'card',
      customer,
      card: { paymentMethodId: 'tok_123' },
    });
    expect(r.success).toBe(false);
  });
});

describe('stripeStatusToCharge / declineMessage', () => {
  it('mapeia os status do PaymentIntent', () => {
    expect(stripeStatusToCharge('succeeded')).toBe('paid');
    expect(stripeStatusToCharge('processing')).toBe('pending');
    expect(stripeStatusToCharge('requires_action')).toBe('pending');
    expect(stripeStatusToCharge('requires_payment_method')).toBe('failed');
    expect(stripeStatusToCharge('canceled')).toBe('failed');
  });

  it('traduz recusas e cai numa mensagem genérica', () => {
    expect(declineMessage('card_declined', 'insufficient_funds')).toMatch(/insuficiente/);
    expect(declineMessage('expired_card', null)).toMatch(/vencido/);
    expect(declineMessage('card_declined', 'do_not_honor')).toMatch(/recusado pelo banco/);
  });
});

/* ------------------------------------------------------------------ */
/* Adapter com dublê do SDK                                            */
/* ------------------------------------------------------------------ */

type Intent = Partial<Stripe.PaymentIntent> & { id: string; status: Stripe.PaymentIntent.Status };

type IntentMocks = Partial<Record<keyof StripeClientLike['paymentIntents'], Mock>>;

function fakeClient(over: IntentMocks = {}) {
  const paymentIntents = {
    create: vi.fn(async (): Promise<Stripe.PaymentIntent> =>
      intent({ id: 'pi_1', status: 'requires_confirmation' }),
    ),
    confirm: vi.fn(async (): Promise<Stripe.PaymentIntent> =>
      intent({ id: 'pi_1', status: 'succeeded' }),
    ),
    retrieve: vi.fn(async (): Promise<Stripe.PaymentIntent> =>
      intent({ id: 'pi_1', status: 'succeeded' }),
    ),
    cancel: vi.fn(async (): Promise<Stripe.PaymentIntent> =>
      intent({ id: 'pi_1', status: 'canceled' }),
    ),
    ...over,
  };
  const webhooks = {
    constructEvent: vi.fn((): Stripe.Event => {
      throw new Error('bad signature');
    }),
  };
  return { paymentIntents, webhooks } satisfies StripeClientLike;
}

function intent(i: Intent): Stripe.PaymentIntent {
  return i as Stripe.PaymentIntent;
}

const cfg = loadConfig(stripeEnv);

function input(over: Partial<CreateChargeInput> = {}): CreateChargeInput {
  return {
    orderId: '00000000-0000-0000-0000-000000000001',
    amountCents: 120_000,
    method: 'card',
    installments: 1,
    customer: { name: 'Maria', email: 'maria@x.com', cpfCnpj: '39053344705' },
    cardPaymentMethodId: 'pm_1',
    ...over,
  };
}

describe('StripePaymentGateway', () => {
  it('Pix: devolve copia-e-cola e URL do QR, pendente', async () => {
    const client = fakeClient({
      create: vi.fn(async () =>
        intent({
          id: 'pi_pix',
          status: 'requires_action',
          next_action: {
            type: 'pix_display_qr_code',
            pix_display_qr_code: {
              data: '000201PIX',
              image_url_png: 'https://qr.stripe.com/x.png',
            },
          } as Stripe.PaymentIntent.NextAction,
        }),
      ),
    });
    const gw = new StripePaymentGateway(cfg, client);
    const r = await gw.createCharge(input({ method: 'pix', cardPaymentMethodId: undefined }));
    expect(r).toMatchObject({
      providerChargeId: 'pi_pix',
      status: 'pending',
      pixCopyPaste: '000201PIX',
      pixQrCode: 'https://qr.stripe.com/x.png',
    });
    const params = client.paymentIntents.create.mock
      .calls[0]![0] as Stripe.PaymentIntentCreateParams;
    expect(params).toMatchObject({ amount: 120_000, currency: 'brl', confirm: true });
    expect(params.allowed_payment_method_types).toEqual(['pix']);
  });

  it('cartão à vista aprovado: paid, sem parcelamento', async () => {
    const client = fakeClient();
    const gw = new StripePaymentGateway(cfg, client);
    const r = await gw.createCharge(input());
    expect(r).toEqual({ providerChargeId: 'pi_1', status: 'paid' });
    const params = client.paymentIntents.create.mock
      .calls[0]![0] as Stripe.PaymentIntentCreateParams;
    expect(params.payment_method_options).toBeUndefined();
    const confirm = client.paymentIntents.confirm.mock
      .calls[0]![1] as Stripe.PaymentIntentConfirmParams;
    expect(confirm.payment_method_options).toBeUndefined();
  });

  it('cartão parcelado: confirma com o plano quando a Stripe oferece o nº de parcelas', async () => {
    const client = fakeClient({
      create: vi.fn(async () =>
        intent({
          id: 'pi_1',
          status: 'requires_confirmation',
          payment_method_options: {
            card: {
              installments: {
                enabled: true,
                plan: null,
                available_plans: [
                  { type: 'fixed_count', count: 3, interval: 'month' },
                  { type: 'fixed_count', count: 12, interval: 'month' },
                ],
              },
            },
          } as Stripe.PaymentIntent.PaymentMethodOptions,
        }),
      ),
    });
    const gw = new StripePaymentGateway(cfg, client);
    await gw.createCharge(input({ installments: 12 }));
    const confirm = client.paymentIntents.confirm.mock
      .calls[0]![1] as Stripe.PaymentIntentConfirmParams;
    expect(confirm.payment_method_options).toEqual({
      card: { installments: { plan: { type: 'fixed_count', count: 12, interval: 'month' } } },
    });
  });

  it('cartão parcelado: recusa nº de parcelas fora dos planos do cartão e cancela', async () => {
    const client = fakeClient({
      create: vi.fn(async () =>
        intent({
          id: 'pi_1',
          status: 'requires_confirmation',
          payment_method_options: {
            card: {
              installments: {
                enabled: true,
                plan: null,
                available_plans: [{ type: 'fixed_count', count: 12, interval: 'month' }],
              },
            },
          } as Stripe.PaymentIntent.PaymentMethodOptions,
        }),
      ),
    });
    const gw = new StripePaymentGateway(cfg, client);
    await expect(gw.createCharge(input({ installments: 24 }))).rejects.toThrow(/até 12x/);
    expect(client.paymentIntents.cancel).toHaveBeenCalledWith('pi_1');
    expect(client.paymentIntents.confirm).not.toHaveBeenCalled();
  });

  it('cartão com 3D Secure: pendente + clientSecret para o navegador', async () => {
    const client = fakeClient({
      confirm: vi.fn(async () =>
        intent({ id: 'pi_1', status: 'requires_action', client_secret: 'pi_1_secret_abc' }),
      ),
    });
    const gw = new StripePaymentGateway(cfg, client);
    const r = await gw.createCharge(input());
    expect(r).toEqual({
      providerChargeId: 'pi_1',
      status: 'pending',
      clientSecret: 'pi_1_secret_abc',
    });
  });

  it('cartão recusado: mensagem em português', async () => {
    const client = fakeClient({
      confirm: vi.fn(async () => {
        throw Object.assign(new Error('Your card has insufficient funds.'), {
          type: 'StripeCardError',
          code: 'card_declined',
          decline_code: 'insufficient_funds',
        });
      }),
    });
    const gw = new StripePaymentGateway(cfg, client);
    await expect(gw.createCharge(input())).rejects.toThrow(/insuficiente/);
  });

  it('cartão sem token e boleto são recusados', async () => {
    const gw = new StripePaymentGateway(cfg, fakeClient());
    await expect(gw.createCharge(input({ cardPaymentMethodId: undefined }))).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(gw.createCharge(input({ method: 'boleto' }))).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('webhook: assinatura inválida ou ausente vira 400', () => {
    const gw = new StripePaymentGateway(cfg, fakeClient());
    expect(() => gw.parseWebhook(Buffer.from('{}'), 't=1,v1=x')).toThrow(BadRequestException);
    expect(() => gw.parseWebhook(undefined, 't=1,v1=x')).toThrow(BadRequestException);
  });

  it('webhook com o SDK real: aceita a assinatura correta e recusa a adulterada', () => {
    const gw = new StripePaymentGateway(cfg); // cliente real, sem rede
    const payload = JSON.stringify({
      id: 'evt_1',
      object: 'event',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_1', object: 'payment_intent', metadata: {} } },
    });
    const header = new StripeSdk('sk_test_x').webhooks.generateTestHeaderString({
      payload,
      secret: 'whsec_x',
    });
    expect(gw.parseWebhook(Buffer.from(payload), header).type).toBe('payment_intent.succeeded');
    expect(() => gw.parseWebhook(Buffer.from(payload + ' '), header)).toThrow(BadRequestException);
  });

  it('reconciliação consulta o PaymentIntent', async () => {
    const client = fakeClient();
    const gw = new StripePaymentGateway(cfg, client);
    await expect(gw.getChargeStatus('pi_1')).resolves.toBe('paid');
    expect(client.paymentIntents.retrieve).toHaveBeenCalledWith('pi_1');
  });
});
