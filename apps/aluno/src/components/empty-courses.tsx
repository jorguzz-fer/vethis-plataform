import { useEffect, useState } from 'react';
import { formatBRL } from '@vethis/shared';
import { Button } from '@vethis/ui';
import { api, siteUrl, type CourseSummary } from '../api';

/**
 * Estado vazio da área do aluno: em vez de um "nenhum curso" seco, convida a
 * explorar o catálogo (site) e mostra alguns cursos recomendados (catálogo
 * público). Usado em "Início" e "Meus cursos".
 */
export function EmptyCourses() {
  const [recommended, setRecommended] = useState<CourseSummary[]>([]);

  useEffect(() => {
    api
      .GET('/v1/catalog/courses', { params: { query: {} } })
      .then(({ data }) => setRecommended((data ?? []).slice(0, 3)))
      .catch(() => setRecommended([]));
  }, []);

  return (
    <div>
      <div className="rounded-2xl border border-dashed border-border bg-white p-8 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-green-50 text-green-700">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-7 w-7"
            aria-hidden
          >
            <path d="M4 6.5A1.5 1.5 0 0 1 5.5 5H11a2 2 0 0 1 2 2v12a1.5 1.5 0 0 0-1.5-1.5h-6A1.5 1.5 0 0 1 4 16Z" />
            <path d="M20 6.5A1.5 1.5 0 0 0 18.5 5H13a2 2 0 0 0-2 2v12a1.5 1.5 0 0 1 1.5-1.5h6A1.5 1.5 0 0 0 20 16Z" />
          </svg>
        </div>
        <h2 className="font-serif text-xl font-semibold text-green-800">
          Você ainda não tem cursos
        </h2>
        <p className="mx-auto mt-1 max-w-md text-muted">
          Explore o catálogo Vethis e comece sua próxima formação clínica. Assim que você se
          matricular, o curso aparece aqui.
        </p>
        <a href={`${siteUrl}/cursos`} className="mt-5 inline-block">
          <Button variant="gold" className="px-8">
            Explorar cursos
          </Button>
        </a>
      </div>

      {recommended.length > 0 ? (
        <div className="mt-8">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted">
            Recomendados para você
          </h3>
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {recommended.map((c) => (
              <li key={c.id}>
                <a
                  href={`${siteUrl}/cursos/${c.slug}`}
                  className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-white shadow-[0_1px_2px_rgba(10,31,25,.06),0_12px_34px_-18px_rgba(10,31,25,.30)] transition-shadow hover:shadow-[0_1px_2px_rgba(10,31,25,.08),0_18px_40px_-20px_rgba(10,31,25,.35)]"
                >
                  <div
                    className="aspect-[16/9] bg-cover bg-center"
                    style={{
                      backgroundImage: c.coverUrl
                        ? `url(${c.coverUrl})`
                        : 'linear-gradient(135deg,#0B3D2A,#14523A 60%,#3E7D5F)',
                    }}
                  />
                  <div className="flex flex-1 flex-col p-4">
                    {c.specialty ? (
                      <span className="mb-1 text-xs font-semibold uppercase tracking-wide text-gold-600">
                        {c.specialty.name}
                      </span>
                    ) : null}
                    <h4 className="mb-3 text-base font-bold text-ink">{c.title}</h4>
                    <p className="mt-auto font-serif text-lg font-semibold text-green-800">
                      {formatBRL(c.priceCents)}
                    </p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
