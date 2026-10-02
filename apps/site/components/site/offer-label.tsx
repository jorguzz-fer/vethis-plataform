import { formatBRL } from '@vethis/shared';
import { PIX_DISCOUNT_PERCENT, offerPlans, type Priced } from '@/lib/pricing';

/**
 * Rótulo de oferta dos cards (home + catálogo): parcelas em destaque (um ou mais
 * planos) e a condição do Pix à vista. A cor é herdada do container (dourado no
 * card escuro da home, verde no card claro do catálogo). O valor cheio fica só
 * no checkout.
 */
export function OfferLabel({ course, className = '' }: { course: Priced; className?: string }) {
  const plans = offerPlans(course);
  return (
    <span className={`flex flex-col gap-0.5 font-sans leading-tight ${className}`}>
      {plans.map((p, i) => (
        <span key={p.installments} className="text-[13px] font-medium">
          {i > 0 ? 'ou ' : ''}
          {p.installments}x de:{' '}
          <strong className="text-[15px] font-bold">{formatBRL(p.installmentCents)}</strong>
        </span>
      ))}
      <span className="text-[12px] font-normal opacity-75">
        no boleto ou cartão · ou {PIX_DISCOUNT_PERCENT}% de desconto à vista
      </span>
    </span>
  );
}
