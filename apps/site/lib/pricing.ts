/**
 * Regras de parcelamento/desconto exibidas no site (vitrine, página do curso e
 * checkout). Espelham a regra server-authoritative da API
 * (`apps/api/src/checkout/pricing.ts`): o valor cobrado é sempre decidido lá.
 */

/** Teto global de parcelas (fallback quando o curso não define o seu). */
export const INSTALLMENTS = 24;
/** Desconto do Pix à vista (%). */
export const PIX_DISCOUNT_PERCENT = 5;

/** Plano de parcelamento com total próprio (ex.: 24x de R$ 577,00). */
export interface InstallmentPlan {
  installments: number;
  installmentCents: number;
}

/** O que o site precisa de um curso para calcular a oferta. */
export interface Priced {
  priceCents: number;
  maxInstallments?: number | null;
  installmentPlans?: readonly InstallmentPlan[] | null;
}

/** Teto de parcelas do curso, limitado ao teto global. */
export function installmentsFor(maxInstallments?: number | null): number {
  if (!maxInstallments || maxInstallments < 1) return INSTALLMENTS;
  return Math.min(Math.trunc(maxInstallments), INSTALLMENTS);
}

/** Valor de cada parcela, em centavos (arredonda para cima como no offer-card). */
export function installmentCents(priceCents: number, maxInstallments?: number | null): number {
  return Math.ceil(priceCents / installmentsFor(maxInstallments));
}

/** Planos válidos, em ordem crescente de parcelas. */
export function normalizePlans(plans?: readonly InstallmentPlan[] | null): InstallmentPlan[] {
  return [...(plans ?? [])]
    .filter((p) => p.installments >= 1 && p.installmentCents > 0)
    .sort((a, b) => a.installments - b.installments);
}

/**
 * Condições exibidas na vitrine: os planos do curso ou, sem planos, o preço
 * cheio dividido sem juros até o teto (ex.: [{ 24, 127700 }]).
 */
export function offerPlans(course: Priced): InstallmentPlan[] {
  const plans = normalizePlans(course.installmentPlans);
  if (plans.length) return plans;
  return [
    {
      installments: installmentsFor(course.maxInstallments),
      installmentCents: installmentCents(course.priceCents, course.maxInstallments),
    },
  ];
}

/** Teto de parcelas efetivo: o maior plano, se houver; senão `maxInstallments`. */
export function maxInstallmentsOf(course: Priced): number {
  const plans = normalizePlans(course.installmentPlans);
  return plans.length
    ? Math.min(plans[plans.length - 1]!.installments, INSTALLMENTS)
    : installmentsFor(course.maxInstallments);
}

/**
 * Total no cartão/boleto para `n` parcelas: preço cheio sem planos; com planos,
 * o total do menor plano que comporta `n` (ex.: 12x de 725 cobre 1–12x).
 */
export function cardAmountCents(course: Priced, n: number): number {
  const plans = normalizePlans(course.installmentPlans);
  if (!plans.length) return course.priceCents;
  const plan = plans.find((p) => p.installments >= n) ?? plans[plans.length - 1]!;
  return plan.installments * plan.installmentCents;
}

/** Valor do Pix à vista (com desconto sobre o preço base). */
export function pixAmountCents(priceCents: number): number {
  return Math.round((priceCents * (100 - PIX_DISCOUNT_PERCENT)) / 100);
}
