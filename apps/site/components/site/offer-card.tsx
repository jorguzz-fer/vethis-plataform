import Link from 'next/link';
import { formatBRL } from '@vethis/shared';
import { buttonClasses } from '@vethis/ui';

/** Teto de parcelas sem juros (espelha a regra da API/checkout). */
const INSTALLMENTS = 24;
/** Desconto do Pix à vista (espelha PIX_DISCOUNT_PERCENT do checkout). */
const PIX_DISCOUNT_PERCENT = 5;

const brl = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Card de oferta da página do curso: preço cheio, parcela em destaque e CTA.
 * Reutilizado no hero, no card fixo lateral e na faixa final.
 */
export function OfferCard({
  course,
  className = '',
}: {
  course: { slug: string; priceCents: number };
  className?: string;
}) {
  const perMonth = Math.ceil(course.priceCents / INSTALLMENTS);
  const pixCents = Math.round((course.priceCents * (100 - PIX_DISCOUNT_PERCENT)) / 100);

  return (
    <div
      className={`rounded-3xl border border-white/10 bg-[#233248] p-7 text-white shadow-[0_20px_50px_rgba(2,20,12,.35)] ${className}`}
    >
      <span className="inline-flex items-center rounded-md bg-[#E23B3B] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
        Oferta por tempo limitado
      </span>

      <h3 className="mt-4 font-serif text-2xl font-semibold">Investimentos</h3>

      <p className="mt-3 text-[15px] text-slate-300">
        Por: <span className="font-semibold text-white">{formatBRL(course.priceCents)}</span>
      </p>

      <p className="mt-5 text-[15px] text-slate-300">
        Ou até <span className="font-semibold text-white">{INSTALLMENTS}x</span> de:
      </p>
      <p className="mt-1 flex items-baseline gap-1.5 font-serif text-gold-400">
        <span className="text-2xl font-semibold">R$</span>
        <span className="text-6xl font-bold leading-none">{brl.format(perMonth / 100)}</span>
      </p>

      <p className="mt-5 text-xs leading-relaxed text-slate-400">
        No Pix à vista: <span className="font-medium text-slate-200">{formatBRL(pixCents)}</span> —
        5% de desconto
      </p>

      <Link
        href={`/checkout/${course.slug}`}
        className={`${buttonClasses('gold')} mt-6 w-full justify-center`}
      >
        Matricule-se
      </Link>
    </div>
  );
}
