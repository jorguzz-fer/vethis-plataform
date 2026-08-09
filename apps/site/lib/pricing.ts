/**
 * Regras de parcelamento/desconto exibidas na vitrine (home e catálogo).
 * Espelham a regra server-authoritative do checkout/API. O checkout continua
 * mostrando o valor cheio; aqui a oferta aparece parcelada.
 */

/** Teto global de parcelas sem juros (fallback quando o curso não define o seu). */
export const INSTALLMENTS = 24;
/** Desconto do Pix à vista (%). */
export const PIX_DISCOUNT_PERCENT = 5;

/** Teto de parcelas do curso, limitado ao teto global. */
export function installmentsFor(maxInstallments?: number | null): number {
  if (!maxInstallments || maxInstallments < 1) return INSTALLMENTS;
  return Math.min(Math.trunc(maxInstallments), INSTALLMENTS);
}

/** Valor de cada parcela, em centavos (arredonda para cima como no offer-card). */
export function installmentCents(priceCents: number, maxInstallments?: number | null): number {
  return Math.ceil(priceCents / installmentsFor(maxInstallments));
}
