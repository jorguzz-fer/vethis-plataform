import { describe, expect, it } from 'vitest';
import {
  MAX_INSTALLMENTS,
  PIX_DISCOUNT_PERCENT,
  cardAmountCents,
  courseMaxInstallments,
  effectiveInstallments,
  netAmountCents,
  normalizePlans,
} from '../src/checkout/pricing';

// Medicina Felina: 12x de R$ 725 (R$ 8.700) ou 24x de R$ 577 (R$ 13.848).
const FELINA = [
  { installments: 24, installmentCents: 57700 },
  { installments: 12, installmentCents: 72500 },
];

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

  it('respeita o teto do curso quando menor que o global', () => {
    // Farmacoterapêutica: oferta de 10x, mesmo que o cliente peça 24x.
    expect(effectiveInstallments('boleto', 24, 10)).toBe(10);
    expect(effectiveInstallments('card', 6, 10)).toBe(6);
  });

  it('nunca ultrapassa o teto global, mesmo com teto de curso maior', () => {
    expect(effectiveInstallments('card', 48, 48)).toBe(MAX_INSTALLMENTS);
  });

  it('cai no teto global quando o curso não define um válido', () => {
    expect(effectiveInstallments('card', 24, 0)).toBe(MAX_INSTALLMENTS);
    expect(effectiveInstallments('card', 24, Number.NaN)).toBe(MAX_INSTALLMENTS);
  });
});

describe('planos de parcelamento', () => {
  it('ordena e descarta planos inválidos ou duplicados', () => {
    expect(
      normalizePlans([
        ...FELINA,
        { installments: 12, installmentCents: 1 },
        { installments: 0, installmentCents: 100 },
        { installments: 30, installmentCents: 100 },
        { installments: 6, installmentCents: 0 },
      ]),
    ).toEqual([
      { installments: 12, installmentCents: 72500 },
      { installments: 24, installmentCents: 57700 },
    ]);
  });

  it('cobra o total do menor plano que comporta as parcelas', () => {
    expect(cardAmountCents(870000, 1, FELINA)).toBe(870000);
    expect(cardAmountCents(870000, 12, FELINA)).toBe(870000);
    expect(cardAmountCents(870000, 13, FELINA)).toBe(1384800);
    expect(cardAmountCents(870000, 24, FELINA)).toBe(1384800);
  });

  it('sem planos, mantém o preço cheio', () => {
    expect(cardAmountCents(3064800, 24, [])).toBe(3064800);
    expect(cardAmountCents(3064800, 24, null)).toBe(3064800);
  });

  it('Pix à vista: 5% sobre o preço base, mesmo com planos', () => {
    expect(netAmountCents('pix', 870000, 24, FELINA)).toBe(826500);
    expect(netAmountCents('boleto', 870000, 24, FELINA)).toBe(1384800);
  });

  it('o maior plano define o teto de parcelas', () => {
    expect(courseMaxInstallments(10, FELINA)).toBe(24);
    expect(courseMaxInstallments(10, [])).toBe(10);
  });
});
