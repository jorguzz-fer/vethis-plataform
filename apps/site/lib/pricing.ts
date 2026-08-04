/**
 * Regras de parcelamento/desconto exibidas na vitrine (home e catálogo).
 * Espelham a regra server-authoritative do checkout/API. O checkout continua
 * mostrando o valor cheio; aqui a oferta aparece parcelada.
 */

/** Teto de parcelas sem juros. */
export const INSTALLMENTS = 24;
/** Desconto do Pix à vista (%). */
export const PIX_DISCOUNT_PERCENT = 5;

/** Valor de cada parcela, em centavos (arredonda para cima como no offer-card). */
export function installmentCents(priceCents: number): number {
  return Math.ceil(priceCents / INSTALLMENTS);
}
