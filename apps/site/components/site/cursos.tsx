import Link from 'next/link';
import { formatBRL } from '@vethis/shared';
import type { ReactNode } from 'react';
import type { CourseSummary } from '@/lib/api';

const GRADIENTS = [
  'linear-gradient(150deg,#12603f,#0a2b20)',
  'linear-gradient(150deg,#3a5a4a,#0f2f24)',
  'linear-gradient(150deg,#8a6a2e,#4a3818)',
];

const LEVEL_LABEL: Record<CourseSummary['level'], string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
};

const cimgSvgProps = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: '1.4',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const HEART = (
  <svg viewBox="0 0 24 24" {...cimgSvgProps}>
    <path d="M20.8 6.6a4.6 4.6 0 00-7.8-2.4L12 5.2l-1-1A4.6 4.6 0 003.2 6.6c0 4.9 8.8 10.4 8.8 10.4s8.8-5.5 8.8-10.4z" />
    <path d="M2 13h4l1.6-3.4L10 16l2-4 1.4 1.6H22" stroke="#CDA968" />
  </svg>
);
const SCALPEL = (
  <svg viewBox="0 0 24 24" {...cimgSvgProps}>
    <path d="M14 3.5l6.5 6.5-9.5 9.5L4 21l1.5-7z" />
    <path d="M11.5 6l6.5 6.5" />
  </svg>
);
const DERMA = (
  <svg viewBox="0 0 24 24" {...cimgSvgProps}>
    <path d="M4 7h9a4 4 0 010 8h-2l-1 5H8l-1-5H4z" />
    <path d="M13 7V4M16 8V5" />
  </svg>
);
const BOOK = (
  <svg viewBox="0 0 24 24" {...cimgSvgProps}>
    <path d="M4 5h16v14H4z" />
    <path d="M10 9l5 3-5 3z" />
  </svg>
);

function iconFor(specialtySlug?: string): ReactNode {
  if (!specialtySlug) return BOOK;
  if (specialtySlug.includes('cardio')) return HEART;
  if (specialtySlug.includes('cirurg')) return SCALPEL;
  if (specialtySlug.includes('derma')) return DERMA;
  return BOOK;
}

export function Cursos({ courses }: { courses: CourseSummary[] }) {
  return (
    <section
      className="blk"
      id="cursos"
      style={{ background: 'var(--paper-2)', borderBlock: '1px solid var(--line-2)' }}
    >
      <div className="wrap">
        <div className="head-row">
          <div className="lead">
            <span className="eyebrow">Cursos em destaque</span>
            <h2>Escolhidos pela nossa comunidade clínica</h2>
          </div>
          <Link href="/cursos" className="btn btn-ghost">
            Ver catálogo completo
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>

        {courses.length === 0 ? (
          <p
            style={{
              border: '1px dashed var(--line)',
              borderRadius: 16,
              background: 'var(--card)',
              padding: '48px 24px',
              textAlign: 'center',
              color: 'var(--sage)',
            }}
          >
            Nenhum curso disponível no momento. Volte em breve — novas trilhas clínicas estão a
            caminho.
          </p>
        ) : (
          <div className="courses">
            {courses.map((c, i) => {
              const gradient = GRADIENTS[i % GRADIENTS.length];
              const cimgStyle = c.coverUrl
                ? {
                    backgroundImage: `url(${c.coverUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : { background: gradient };
              const initial = c.instructor?.name?.trim().charAt(0).toUpperCase() ?? 'V';
              return (
                <Link key={c.id} href={`/cursos/${c.slug}`} className="course">
                  <div className="cimg" style={cimgStyle}>
                    {c.specialty ? <span className="badge">{c.specialty.name}</span> : null}
                    <span className="lvl">{LEVEL_LABEL[c.level]}</span>
                    {c.coverUrl ? null : iconFor(c.specialty?.slug)}
                  </div>
                  <div className="cbody">
                    <h3>{c.title}</h3>
                    {c.instructor ? (
                      <div className="inst">
                        <span className="ci">{initial}</span> {c.instructor.name}
                      </div>
                    ) : null}
                    {c.subtitle ? (
                      <p style={{ fontSize: '13.5px', color: 'var(--sage)', lineHeight: 1.5 }}>
                        {c.subtitle}
                      </p>
                    ) : null}
                    <div className="cfoot">
                      <div className="price">
                        {formatBRL(c.priceCents)}
                        <small>/à vista</small>
                      </div>
                      <div className="go">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        >
                          <path d="M5 12h14M13 6l6 6-6 6" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
