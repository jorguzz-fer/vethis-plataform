import Link from 'next/link';
import type { ReactNode } from 'react';

type Esp = { slug: string; name: string; desc: string; count: string; icon: ReactNode };

const S = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: '1.7',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const ESPECIALIDADES: Esp[] = [
  {
    slug: 'cardiologia',
    name: 'Cardiologia',
    desc: 'Ecocardiografia, arritmias e manejo clínico.',
    count: '18 cursos',
    icon: (
      <svg viewBox="0 0 24 24" {...S}>
        <path d="M20.8 6.6a4.6 4.6 0 00-7.8-2.4L12 5.2l-1-1A4.6 4.6 0 003.2 6.6c0 4.9 8.8 10.4 8.8 10.4s8.8-5.5 8.8-10.4z" />
        <path d="M2 13h4l1.6-3.2L10 15l2-3.5 1.4 1.5H22" />
      </svg>
    ),
  },
  {
    slug: 'cirurgia',
    name: 'Cirurgia',
    desc: 'Tecidos moles, ortopedia e técnicas minimamente invasivas.',
    count: '22 cursos',
    icon: (
      <svg viewBox="0 0 24 24" {...S}>
        <path d="M14 3.5l6.5 6.5-9.5 9.5L4 21l1.5-7z" />
        <path d="M11.5 6l6.5 6.5" />
      </svg>
    ),
  },
  {
    slug: 'animais-exoticos',
    name: 'Animais Exóticos',
    desc: 'Aves, répteis, silvestres e pets não convencionais.',
    count: '11 cursos',
    icon: (
      <svg viewBox="0 0 24 24" {...S}>
        <circle cx="7" cy="6" r="2.2" />
        <circle cx="17" cy="6" r="2.2" />
        <circle cx="4.5" cy="12" r="2" />
        <circle cx="19.5" cy="12" r="2" />
        <path d="M9 15.5c0-2 1.4-3.5 3-3.5s3 1.5 3 3.5c0 1.6-.7 2-1.6 2.6-.9.6-1.4 2.4-1.4 2.9 0-.5-.5-2.3-1.4-2.9-.9-.6-1.6-1-1.6-2.6z" />
      </svg>
    ),
  },
  {
    slug: 'diagnostico-por-imagem',
    name: 'Diagnóstico por Imagem',
    desc: 'Radiologia, ultrassom e interpretação prática.',
    count: '14 cursos',
    icon: (
      <svg viewBox="0 0 24 24" {...S}>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M8 4v16M8 8h13M8 13h13" />
        <circle cx="5.5" cy="6.4" r=".8" fill="currentColor" />
        <circle cx="5.5" cy="10.4" r=".8" fill="currentColor" />
      </svg>
    ),
  },
  {
    slug: 'dermatologia',
    name: 'Dermatologia',
    desc: 'Dermatoses, alergias e citologia cutânea.',
    count: '9 cursos',
    icon: (
      <svg viewBox="0 0 24 24" {...S}>
        <path d="M4 7h9a4 4 0 010 8h-2l-1 5H8l-1-5H4z" />
        <path d="M13 7V4M16 8V5" />
      </svg>
    ),
  },
  {
    slug: 'anestesiologia',
    name: 'Anestesiologia',
    desc: 'Protocolos, monitoração e pacientes críticos.',
    count: '8 cursos',
    icon: (
      <svg viewBox="0 0 24 24" {...S}>
        <path d="M6 3c2 0 3 1 6 1s4-1 6-1c1 0 2 .8 2 3 0 3-1 4-1.6 7-.5 2.4-.8 6-2.4 6-1.4 0-1.6-3-2.2-5-.4-1.3-.7-2-1.8-2s-1.4.7-1.8 2c-.6 2-.8 5-2.2 5-1.6 0-1.9-3.6-2.4-6C4.6 10 3.6 9 3.6 6 3.6 3.8 4.6 3 6 3z" />
      </svg>
    ),
  },
  {
    slug: 'odontologia',
    name: 'Odontologia',
    desc: 'Profilaxia, extrações e afecções orais.',
    count: '6 cursos',
    icon: (
      <svg viewBox="0 0 24 24" {...S}>
        <path d="M12 3c-3 0-5 2-5 5 0 4 1.5 5 2 9 .3 2.3.8 4 3 4s2.7-1.7 3-4c.5-4 2-5 2-9 0-3-2-5-5-5z" />
        <path d="M9.5 8h5" />
      </svg>
    ),
  },
  {
    slug: 'emergencia-uti',
    name: 'Emergência & UTI',
    desc: 'Triagem, choque e estabilização do paciente.',
    count: '12 cursos',
    icon: (
      <svg viewBox="0 0 24 24" {...S}>
        <path d="M12 2v20M2 12h20" opacity=".9" />
        <path d="M12 6a6 6 0 016 6 6 6 0 01-6 6 6 6 0 01-6-6 6 6 0 016-6z" />
      </svg>
    ),
  },
];

export function Especialidades() {
  return (
    <section className="blk" id="especialidades">
      <div className="wrap">
        <div className="head-row">
          <div className="lead">
            <span className="eyebrow">Trilhas por especialidade</span>
            <h2>Cada área da clínica, com profundidade</h2>
          </div>
          <p className="desc">
            Do generalista ao especialista: trilhas estruturadas com casos reais, protocolos
            atualizados e prática guiada.
          </p>
        </div>
        <div className="esp-grid">
          {ESPECIALIDADES.map((e) => (
            <Link key={e.slug} href={`/cursos?specialty=${e.slug}`} className="esp">
              <div className="ic">{e.icon}</div>
              <b>{e.name}</b>
              <span>{e.desc}</span>
              <span className="cnt">{e.count}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
