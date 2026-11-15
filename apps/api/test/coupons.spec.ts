import { describe, expect, it } from 'vitest';
import {
  MIN_CHARGE_CENTS,
  couponDiscountCents,
  couponProblem,
  endOfDaySaoPaulo,
} from '../src/coupons/coupon-pricing';
import {
  couponPreviewInputSchema,
  createCouponSchema,
  updateCouponSchema,
} from '../src/coupons/dto';
import { createCheckoutSchema } from '../src/checkout/dto';

describe('couponDiscountCents', () => {
  it('percentual sobre o valor do meio, arredondado ao centavo', () => {
    // Pix da Clínica Médica: R$ 29.115,60 com 20% → R$ 5.823,12
    expect(couponDiscountCents({ discountType: 'percent', discountValue: 20 }, 2911560)).toBe(
      582312,
    );
    expect(couponDiscountCents({ discountType: 'percent', discountValue: 10 }, 99999)).toBe(10000);
  });

  it('valor fixo em centavos, nunca maior que a base', () => {
    expect(couponDiscountCents({ discountType: 'fixed', discountValue: 50000 }, 870000)).toBe(
      50000,
    );
    expect(couponDiscountCents({ discountType: 'fixed', discountValue: 999999 }, 870000)).toBe(
      870000,
    );
  });

  it('100% zera o valor (o checkout recusa abaixo do mínimo)', () => {
    expect(couponDiscountCents({ discountType: 'percent', discountValue: 100 }, 1000)).toBe(1000);
    expect(MIN_CHARGE_CENTS).toBe(500);
  });
});

describe('couponProblem', () => {
  const ok = {
    active: true,
    expiresAt: null,
    maxUses: null,
    usedCount: 0,
    appliesToAllCourses: true,
  };
  const now = new Date('2026-11-12T12:00:00Z');

  it('cupom válido', () => {
    expect(couponProblem(ok, true, now)).toBeNull();
  });
  it('desativado, expirado, esgotado e fora do curso', () => {
    expect(couponProblem({ ...ok, active: false }, true, now)).toBe('inactive');
    expect(couponProblem({ ...ok, expiresAt: new Date('2026-11-11T00:00:00Z') }, true, now)).toBe(
      'expired',
    );
    expect(couponProblem({ ...ok, maxUses: 3, usedCount: 3 }, true, now)).toBe('exhausted');
    expect(couponProblem({ ...ok, appliesToAllCourses: false }, false, now)).toBe('course');
  });
  it('vale no próprio dia da expiração (até 23:59 de Brasília)', () => {
    const expires = endOfDaySaoPaulo('2026-11-12');
    expect(
      couponProblem({ ...ok, expiresAt: expires }, true, new Date('2026-11-13T02:30:00Z')),
    ).toBeNull();
    expect(
      couponProblem({ ...ok, expiresAt: expires }, true, new Date('2026-11-13T03:30:00Z')),
    ).toBe('expired');
  });
  it('cupom de cursos específicos vale no curso incluído', () => {
    expect(couponProblem({ ...ok, appliesToAllCourses: false }, true, now)).toBeNull();
  });
});

describe('createCouponSchema', () => {
  const base = { code: ' black30 ', discountType: 'percent', discountValue: 30 } as const;

  it('normaliza o código e aplica os padrões', () => {
    const r = createCouponSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.code).toBe('BLACK30');
      expect(r.data).toMatchObject({
        appliesToAllCourses: true,
        courseIds: [],
        maxUses: null,
        expiresAt: null,
        active: true,
      });
    }
  });

  it('recusa código inválido e percentual acima de 100', () => {
    expect(createCouponSchema.safeParse({ ...base, code: 'a b' }).success).toBe(false);
    expect(createCouponSchema.safeParse({ ...base, discountValue: 150 }).success).toBe(false);
  });

  it('valor fixo pode passar de 100 (centavos)', () => {
    expect(
      createCouponSchema.safeParse({ ...base, discountType: 'fixed', discountValue: 50000 })
        .success,
    ).toBe(true);
  });

  it('cursos específicos exige ao menos um curso; aceita vários', () => {
    expect(createCouponSchema.safeParse({ ...base, appliesToAllCourses: false }).success).toBe(
      false,
    );
    expect(
      createCouponSchema.safeParse({
        ...base,
        appliesToAllCourses: false,
        courseIds: ['00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'],
      }).success,
    ).toBe(true);
  });

  it('edição parcial aceita só o status', () => {
    expect(updateCouponSchema.safeParse({ active: false }).success).toBe(true);
  });
});

describe('checkout com cupom', () => {
  it('aceita o código no checkout e na prévia', () => {
    const customer = { name: 'Maria Silva', cpfCnpj: '390.533.447-05' };
    const r = createCheckoutSchema.safeParse({
      courseSlug: 'x',
      method: 'pix',
      customer,
      couponCode: ' black30 ',
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.couponCode).toBe('black30');
    expect(couponPreviewInputSchema.safeParse({ code: 'BLACK30', courseSlug: 'x' }).success).toBe(
      true,
    );
  });
});
