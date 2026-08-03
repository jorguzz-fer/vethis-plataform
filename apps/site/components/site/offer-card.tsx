import Link from 'next/link';
import { formatBRL } from '@vethis/shared';
import { buttonClasses } from '@vethis/ui';
import { LeadFormTrigger } from '@/components/site/lead-form';

/** Teto de parcelas sem juros (espelha a regra da API/checkout). */
const INSTALLMENTS = 24;
/** Desconto do Pix à vista (espelha PIX_DISCOUNT_PERCENT do checkout). */
const PIX_DISCOUNT_PERCENT = 5;

const brl = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const CARD_CLASS =
  'rounded-3xl border border-gold-400/30 bg-gradient-to-br from-green-800 to-green-900 p-7 text-[#EAF0EC] shadow-[0_20px_50px_rgba(2,20,12,.35)]';

/**
 * Card de oferta da página do curso: preço cheio, parcela em destaque e CTA.
 * Cores da marca Vethis (verde escuro + dourado). Reutilizado no hero, no card
 * fixo lateral e na faixa final. Quando `comingSoon`, exibe o estado "Em breve"
 * (sem preço nem checkout, com captação de interesse).
 */
export function OfferCard({
  course,
  comingSoon = false,
  className = '',
}: {
  course: { slug: string; priceCents: number };
  comingSoon?: boolean;
  className?: string;
}) {
  if (comingSoon) {
    return (
      <div className={`${CARD_CLASS} ${className}`}>
        <span className="inline-flex items-center rounded-md bg-gold-500/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-gold-400">
          Em breve
        </span>
        <h3 className="mt-4 font-serif text-2xl font-semibold text-[#EAF0EC]">
          Matrículas em breve
        </h3>
        <p className="mt-3 text-[15px] leading-relaxed text-[#C6D3CA]">
          As inscrições para esta turma abrem em breve. Deixe seu contato e avisamos você assim que
          as matrículas forem liberadas.
        </p>
        <LeadFormTrigger
          source="curso-em-breve"
          className={`${buttonClasses('gold')} mt-6 w-full justify-center`}
        >
          Quero ser avisado
        </LeadFormTrigger>
      </div>
    );
  }

  const perMonth = Math.ceil(course.priceCents / INSTALLMENTS);
  const pixCents = Math.round((course.priceCents * (100 - PIX_DISCOUNT_PERCENT)) / 100);

  return (
    <div className={`${CARD_CLASS} ${className}`}>
      <span className="inline-flex items-center rounded-md bg-[#C0392B] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
        Oferta por tempo limitado
      </span>

      <h3 className="mt-4 font-serif text-2xl font-semibold text-[#EAF0EC]">Investimentos</h3>

      <p className="mt-3 text-[15px] text-[#C6D3CA]">
        Por: <span className="font-semibold text-white">{formatBRL(course.priceCents)}</span>
      </p>

      <p className="mt-5 text-[15px] text-[#C6D3CA]">
        Ou até <span className="font-semibold text-white">{INSTALLMENTS}x</span> de:
      </p>
      <p className="mt-1 flex items-baseline gap-1.5 font-serif text-gold-400">
        <span className="text-2xl font-semibold">R$</span>
        <span className="text-6xl font-bold leading-none">{brl.format(perMonth / 100)}</span>
      </p>

      <p className="mt-5 text-xs leading-relaxed text-[#9DB0A5]">
        No Pix à vista: <span className="font-medium text-[#EAF0EC]">{formatBRL(pixCents)}</span> —
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
