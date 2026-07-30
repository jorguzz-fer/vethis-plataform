import { describe, expect, it } from 'vitest';
import {
  MAX_INSTALLMENTS,
  PIX_DISCOUNT_PERCENT,
  effectiveInstallments,
  netAmountCents,
} from '../src/checkout/pricing';

describe('netAmountCents', () => {
  it('aplica desconto do Pix à vista', () => {
    // 693600 * 0.95 = 658920
    expect(netAmountCents('pix', 693600)).toBe(658920);
    expect(PIX_DISCOUNT_PERCENT).toBe(5);
  });

  it('cobra preço cheio em cartão e boleto', () => {
    expect(netAmountCents('card', 693600)).toBe(693600);
    expect(netAmountCents('boleto', 693600)).toBe(693600);
  });

  it('arredonda para o centavo', () => {
    // 99999 * 0.95 = 94999.05 → 94999
    expect(netAmountCents('pix', 99999)).toBe(94999);
  });
});

describe('effectiveInstallments', () => {
  it('força Pix à vista (1x)', () => {
    expect(effectiveInstallments('pix', 12)).toBe(1);
  });

  it('respeita o pedido dentro do teto para cartão/boleto', () => {
    expect(effectiveInstallments('card', 24)).toBe(24);
    expect(effectiveInstallments('boleto', 10)).toBe(10);
  });

  it('limita ao teto e sanitiza valores inválidos', () => {
    expect(effectiveInstallments('card', 99)).toBe(MAX_INSTALLMENTS);
    expect(effectiveInstallments('boleto', 0)).toBe(1);
    expect(effectiveInstallments('card', Number.NaN)).toBe(1);
  });
});
