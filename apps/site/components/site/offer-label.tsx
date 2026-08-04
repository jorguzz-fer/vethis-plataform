import { formatBRL } from '@vethis/shared';
import { INSTALLMENTS, PIX_DISCOUNT_PERCENT, installmentCents } from '@/lib/pricing';

/**
 * Rótulo de oferta dos cards (home + catálogo): parcela em destaque e a
 * condição do Pix à vista. A cor é herdada do container (dourado no card
 * escuro da home, verde no card claro do catálogo). O valor cheio fica só no
 * checkout.
 */
export function OfferLabel({
  priceCents,
  className = '',
}: {
  priceCents: number;
  className?: string;
}) {
  const per = installmentCents(priceCents);
  return (
    <span className={`flex flex-col gap-0.5 font-sans leading-tight ${className}`}>
      <span className="text-[13px] font-medium">
        {INSTALLMENTS}x de: <strong className="text-[15px] font-bold">{formatBRL(per)}</strong>
      </span>
      <span className="text-[12px] font-normal opacity-75">
        ou {PIX_DISCOUNT_PERCENT}% de desconto à vista
      </span>
    </span>
  );
}
