/**
 * Regras de desconto do cupom (server-authoritative; o site só espelha).
 * O cupom incide sobre o valor do meio escolhido — Pix já com os 5%, cartão e
 * boleto sobre o total do plano — e o resultado continua parcelável.
 */

/** Valor mínimo de uma cobrança (limite do Asaas no Pix/boleto). */
export const MIN_CHARGE_CENTS = 500;

export interface CouponRule {
  discountType: 'percent' | 'fixed';
  discountValue: number;
}

/** Desconto em centavos sobre `baseCents` (nunca maior que a base). */
export function couponDiscountCents(rule: CouponRule, baseCents: number): number {
  if (baseCents <= 0 || rule.discountValue <= 0) return 0;
  const raw =
    rule.discountType === 'percent'
      ? Math.round((baseCents * Math.min(rule.discountValue, 100)) / 100)
      : rule.discountValue;
  return Math.min(raw, baseCents);
}

/** Fim do dia (23:59:59.999, horário de Brasília) para uma data AAAA-MM-DD. */
export function endOfDaySaoPaulo(date: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return new Date(`${date}T23:59:59.999-03:00`);
  return new Date(date);
}

export type CouponProblem = 'inactive' | 'expired' | 'exhausted' | 'course';

/** Mensagem mostrada no checkout para cada motivo de recusa. */
export const COUPON_PROBLEM_MESSAGE: Record<CouponProblem | 'not_found' | 'minimum', string> = {
  not_found: 'Cupom não encontrado. Confira o código.',
  inactive: 'Este cupom está desativado.',
  expired: 'Este cupom expirou.',
  exhausted: 'Este cupom atingiu o limite de usos.',
  course: 'Este cupom não vale para este curso.',
  minimum: 'Com este cupom o valor ficaria abaixo do mínimo de R$ 5,00.',
};

/** Por que um cupom não pode ser usado agora neste curso (ou `null` se pode). */
export function couponProblem(
  coupon: {
    active: boolean;
    expiresAt: Date | null;
    maxUses: number | null;
    usedCount: number;
    appliesToAllCourses: boolean;
  },
  courseAllowed: boolean,
  now = new Date(),
): CouponProblem | null {
  if (!coupon.active) return 'inactive';
  if (coupon.expiresAt && coupon.expiresAt.getTime() < now.getTime()) return 'expired';
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return 'exhausted';
  if (!coupon.appliesToAllCourses && !courseAllowed) return 'course';
  return null;
}
