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

/**
 * Valor líquido a cobrar (em centavos) para o meio escolhido: Pix à vista ganha
 * `PIX_DISCOUNT_PERCENT`% de desconto; cartão e boleto pagam o preço cheio
 * (parcelável). Arredonda para o centavo mais próximo.
 */
export function netAmountCents(method: PaymentMethodDto, priceCents: number): number {
  if (method === 'pix') {
    return Math.round((priceCents * (100 - PIX_DISCOUNT_PERCENT)) / 100);
  }
  return priceCents;
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
