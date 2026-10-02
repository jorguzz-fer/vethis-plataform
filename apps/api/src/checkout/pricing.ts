import type { InstallmentPlan } from '../db/schema';
import type { PaymentMethodDto } from './dto';

/**
 * Regras comerciais de preço por meio de pagamento (server-authoritative).
 * A página de venda apenas exibe as condições; o valor cobrado é decidido aqui.
 */

/** Desconto do Pix à vista (percentual inteiro). */
export const PIX_DISCOUNT_PERCENT = 5;

/**
 * Teto global de parcelas (cartão e boleto/carnê). Cada curso pode oferecer
 * menos (`courses.max_installments`), nunca mais do que isto.
 */
export const MAX_INSTALLMENTS = 24;

/** Planos válidos, ordenados por nº de parcelas (sem duplicatas, até o teto global). */
export function normalizePlans(
  plans: readonly InstallmentPlan[] | null | undefined,
): InstallmentPlan[] {
  const seen = new Set<number>();
  return (plans ?? [])
    .filter(
      (p) =>
        Number.isInteger(p.installments) &&
        p.installments >= 1 &&
        p.installments <= MAX_INSTALLMENTS &&
        Number.isInteger(p.installmentCents) &&
        p.installmentCents > 0,
    )
    .sort((a, b) => a.installments - b.installments)
    .filter((p) => (seen.has(p.installments) ? false : (seen.add(p.installments), true)));
}

/** Teto de parcelas do curso: o maior plano, se houver; senão `maxInstallments`. */
export function courseMaxInstallments(
  maxInstallments: number,
  plans?: readonly InstallmentPlan[] | null,
): number {
  const sorted = normalizePlans(plans);
  return sorted.length ? sorted[sorted.length - 1]!.installments : maxInstallments;
}

/**
 * Total cobrado no cartão/boleto para `installments` parcelas. Sem planos, é o
 * preço cheio. Com planos, vale o total do menor plano que comporta o nº de
 * parcelas (ex.: 12x de 725 cobre 1–12x; 24x de 577 cobre 13–24x).
 */
export function cardAmountCents(
  priceCents: number,
  installments: number,
  plans?: readonly InstallmentPlan[] | null,
): number {
  const sorted = normalizePlans(plans);
  if (!sorted.length) return priceCents;
  const plan = sorted.find((p) => p.installments >= installments) ?? sorted[sorted.length - 1]!;
  return plan.installments * plan.installmentCents;
}

/**
 * Valor líquido a cobrar (em centavos) para o meio escolhido: Pix à vista ganha
 * `PIX_DISCOUNT_PERCENT`% de desconto sobre o preço base; cartão e boleto pagam o
 * preço cheio ou o total do plano correspondente. Arredonda para o centavo.
 */
export function netAmountCents(
  method: PaymentMethodDto,
  priceCents: number,
  installments = 1,
  plans?: readonly InstallmentPlan[] | null,
): number {
  if (method === 'pix') {
    return Math.round((priceCents * (100 - PIX_DISCOUNT_PERCENT)) / 100);
  }
  return cardAmountCents(priceCents, installments, plans);
}

/**
 * Parcelas efetivas: Pix é sempre à vista; cartão/boleto respeitam o teto do
 * curso (`courseMax`, quando informado) limitado ao teto global.
 */
export function effectiveInstallments(
  method: PaymentMethodDto,
  requested: number,
  courseMax = MAX_INSTALLMENTS,
): number {
  if (method === 'pix') return 1;
  const cap = Math.min(
    Number.isFinite(courseMax) && courseMax >= 1 ? Math.trunc(courseMax) : MAX_INSTALLMENTS,
    MAX_INSTALLMENTS,
  );
  if (!Number.isFinite(requested) || requested < 1) return 1;
  return Math.min(Math.trunc(requested), cap);
}
