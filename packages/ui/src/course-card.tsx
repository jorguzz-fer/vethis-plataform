import type { ReactNode } from 'react';
import { Badge, type BadgeVariant } from './badge';
import { cn } from './cn';

const LEVEL_LABEL: Record<string, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
};

export interface CourseCardProps {
  title: string;
  /** Preço já formatado (ex.: "R$ 1.497,00"). */
  priceLabel: string;
  specialty?: string;
  level?: 'iniciante' | 'intermediario' | 'avancado';
  coverUrl?: string;
  isNew?: boolean;
  /** Ação (ex.: link/botão "Ver curso"). */
  cta?: ReactNode;
  className?: string;
}

/** Card de curso (DS §7): capa em gradiente, badges, título, preço serif, CTA. */
export function CourseCard({
  title,
  priceLabel,
  specialty,
  level,
  coverUrl,
  isNew,
  cta,
  className,
}: CourseCardProps) {
  const badges: Array<{ label: string; variant: BadgeVariant }> = [];
  if (specialty) badges.push({ label: specialty, variant: 'category' });
  if (level) badges.push({ label: LEVEL_LABEL[level] ?? level, variant: 'level' });
  if (isNew) badges.push({ label: 'Novo', variant: 'new' });

  return (
    <article
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border border-border bg-white',
        'shadow-[0_1px_2px_rgba(10,31,25,.06),0_12px_34px_-18px_rgba(10,31,25,.30)]',
        className,
      )}
    >
      <div
        className="aspect-[16/9] bg-cover bg-center"
        style={{
          backgroundImage: coverUrl
            ? `url(${coverUrl})`
            : 'linear-gradient(135deg,#0B3D2A,#14523A 60%,#3E7D5F)',
        }}
      />
      <div className="flex flex-1 flex-col gap-3 p-4">
        {badges.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {badges.map((b) => (
              <Badge key={b.label} variant={b.variant}>
                {b.label}
              </Badge>
            ))}
          </div>
        ) : null}
        <h3 className="text-base font-bold leading-snug text-ink">{title}</h3>
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <span className="font-serif text-lg font-semibold text-green-700">{priceLabel}</span>
          {cta}
        </div>
      </div>
    </article>
  );
}
