import { describe, expect, it } from 'vitest';
import { asaasEventToStatus, asaasStatusToCharge } from '../src/checkout/asaas-gateway';
import { createCheckoutSchema } from '../src/checkout/dto';
import { loadConfig } from '../src/config/configuration';

const baseEnv = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://vethis:vethis@localhost:5432/vethis',
  SESSION_SECRET: 'a-very-long-session-secret',
} as NodeJS.ProcessEnv;

describe('asaasStatusToCharge', () => {
  it('mapeia confirmados como pagos', () => {
    expect(asaasStatusToCharge('CONFIRMED')).toBe('paid');
    expect(asaasStatusToCharge('RECEIVED')).toBe('paid');
  });
  it('mapeia pendentes', () => {
    expect(asaasStatusToCharge('PENDING')).toBe('pending');
    expect(asaasStatusToCharge('AWAITING_RISK_ANALYSIS')).toBe('pending');
  });
  it('demais status caem em failed', () => {
    expect(asaasStatusToCharge('OVERDUE')).toBe('failed');
    expect(asaasStatusToCharge('REFUNDED')).toBe('failed');
  });
});

describe('asaasEventToStatus', () => {
  it('confirma nos eventos de recebimento', () => {
    expect(asaasEventToStatus('PAYMENT_CONFIRMED')).toBe('paid');
    expect(asaasEventToStatus('PAYMENT_RECEIVED')).toBe('paid');
  });
  it('ignora eventos que não confirmam pagamento', () => {
    expect(asaasEventToStatus('PAYMENT_OVERDUE')).toBeNull();
    expect(asaasEventToStatus('PAYMENT_CREATED')).toBeNull();
  });
});

describe('createCheckoutSchema', () => {
  const customer = { name: 'Maria Silva', cpfCnpj: '390.533.447-05' };

  it('aceita Pix com nome + CPF e normaliza os dígitos', () => {
    const r = createCheckoutSchema.safeParse({ courseSlug: 'x', method: 'pix', customer });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.customer.cpfCnpj).toBe('39053344705');
  });

  it('rejeita CPF inválido', () => {
    const r = createCheckoutSchema.safeParse({
      courseSlug: 'x',
      method: 'pix',
      customer: { name: 'Maria', cpfCnpj: '123' },
    });
    expect(r.success).toBe(false);
  });

  it('cartão exige telefone, CEP e número', () => {
    const semEndereco = createCheckoutSchema.safeParse({
      courseSlug: 'x',
      method: 'card',
      customer,
      card: {
        number: '4111111111111111',
        holderName: 'MARIA SILVA',
        expMonth: 12,
        expYear: 2030,
        cvv: '123',
      },
    });
    expect(semEndereco.success).toBe(false);

    const completo = createCheckoutSchema.safeParse({
      courseSlug: 'x',
      method: 'card',
      customer: { ...customer, phone: '11999999999', postalCode: '01310-100', addressNumber: '10' },
      card: {
        number: '4111111111111111',
        holderName: 'MARIA SILVA',
        expMonth: 12,
        expYear: 2030,
        cvv: '123',
      },
    });
    expect(completo.success).toBe(true);
  });
});

describe('loadConfig — gateway asaas', () => {
  it('exige ASAAS_API_KEY quando PAYMENT_GATEWAY=asaas', () => {
    expect(() => loadConfig({ ...baseEnv, PAYMENT_GATEWAY: 'asaas' })).toThrow(/ASAAS_API_KEY/);
  });
  it('aceita asaas com a chave presente', () => {
    const cfg = loadConfig({ ...baseEnv, PAYMENT_GATEWAY: 'asaas', ASAAS_API_KEY: 'k' });
    expect(cfg.PAYMENT_GATEWAY).toBe('asaas');
    expect(cfg.ASAAS_BASE_URL).toContain('sandbox');
  });
});
