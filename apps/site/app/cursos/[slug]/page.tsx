import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { formatBRL } from '@vethis/shared';
import { buttonClasses } from '@vethis/ui';
import { getCourse, getCourses, type CourseDetail, type CourseSummary } from '@/lib/api';
import { LeadFormTrigger } from '@/components/site/lead-form';

export const dynamic = 'force-dynamic';

const LEVEL_LABEL: Record<CourseDetail['level'], string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
};
const INSTALLMENTS = 12;

function formatDuration(seconds: number): string {
  return `${Math.round(seconds / 60)} min`;
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();

  let related = (await getCourses({ specialty: course.specialty?.slug ?? undefined })).filter(
    (c) => c.slug !== course.slug,
  );
  if (related.length === 0) {
    related = (await getCourses()).filter((c) => c.slug !== course.slug);
  }
  related = related.slice(0, 3);

  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const perMonth = Math.ceil(course.priceCents / INSTALLMENTS);

  return (
    <article className="bg-paper">
      <Hero course={course} perMonth={perMonth} />
      <Conditions />
      <Curriculum course={course} totalLessons={totalLessons} perMonth={perMonth} />
      <GuideBanner />
      {course.instructor ? <Faculty name={course.instructor.name} /> : null}
      <Benefits />
      <InvestmentBand course={course} perMonth={perMonth} />
      {related.length > 0 ? <Related courses={related} /> : null}
      <Faq />
    </article>
  );
}

// ---------------------------------------------------------------------------

function Hero({ course, perMonth }: { course: CourseDetail; perMonth: number }) {
  return (
    <header className="relative overflow-hidden bg-green-900 text-[#EAF0EC]">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-24 h-96 w-96 rounded-full bg-green-700/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-gold-500/10 blur-3xl"
      />
      <div className="relative mx-auto grid max-w-[1140px] items-center gap-10 px-6 py-16 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            {course.specialty ? <Pill>{course.specialty.name}</Pill> : null}
            <Pill>{LEVEL_LABEL[course.level]}</Pill>
            <Pill gold>Pós-graduação online</Pill>
          </div>
          <h1 className="max-w-2xl font-serif text-4xl font-semibold leading-tight md:text-5xl">
            {course.title}
          </h1>
          {course.subtitle ? (
            <p className="mt-4 max-w-xl text-lg text-[#C6D3CA]">{course.subtitle}</p>
          ) : null}

          <div className="mt-8 flex flex-wrap items-end gap-x-6 gap-y-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-[#9DB0A5]">Investimento</p>
              <p className="font-serif text-3xl font-semibold text-gold-400">
                {formatBRL(course.priceCents)}
              </p>
              <p className="text-sm text-[#C6D3CA]">
                ou em até {INSTALLMENTS}x de {formatBRL(perMonth)}
              </p>
            </div>
            <Link href={`/checkout/${course.slug}`} className={buttonClasses('gold')}>
              Matricule-se agora
            </Link>
          </div>
          {course.instructor ? (
            <p className="mt-6 text-sm text-[#9DB0A5]">
              Coordenação: <span className="text-[#EAF0EC]">{course.instructor.name}</span>
            </p>
          ) : null}
        </div>

        <div className="hidden lg:block">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl">
            {course.coverUrl ? (
              <img
                src={course.coverUrl}
                alt={course.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-green-800 to-green-900">
                <span className="font-serif text-2xl text-gold-400/80">Vethis</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function Pill({ children, gold }: { children: ReactNode; gold?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
        gold
          ? 'border-gold-400/30 bg-gold-500/15 text-gold-400'
          : 'border-white/15 bg-white/10 text-white/90'
      }`}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------

function Conditions() {
  const items = [
    {
      title: 'Pagamento facilitado',
      desc: `Parcele em até ${INSTALLMENTS}x ou pague à vista com condição especial.`,
    },
    {
      title: 'Aprendizado 100% online',
      desc: 'Estude no seu ritmo, de qualquer lugar, com conteúdo sempre disponível.',
    },
    {
      title: 'Certificado reconhecido',
      desc: 'Emita seu certificado ao concluir o curso, direto na área do aluno.',
    },
  ];
  return (
    <section className="mx-auto max-w-[1140px] px-6 py-12">
      <div className="grid gap-4 rounded-2xl border border-border bg-white p-6 sm:grid-cols-3">
        {items.map((it) => (
          <div key={it.title} className="flex gap-3">
            <CheckIcon />
            <div>
              <p className="font-semibold text-ink">{it.title}</p>
              <p className="mt-0.5 text-sm text-muted">{it.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

function Curriculum({
  course,
  totalLessons,
  perMonth,
}: {
  course: CourseDetail;
  totalLessons: number;
  perMonth: number;
}) {
  return (
    <section id="disciplinas" className="mx-auto max-w-[1140px] px-6 py-4">
      <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <h2 className="font-serif text-3xl font-semibold text-green-800">Disciplinas</h2>
          <p className="mb-6 mt-1 text-sm text-muted">
            {course.modules.length} módulo(s) · {totalLessons} aula(s)
          </p>
          {course.description ? (
            <p className="mb-6 max-w-2xl text-[15px] leading-relaxed text-ink/80">
              {course.description}
            </p>
          ) : null}

          <div className="flex flex-col gap-3">
            {course.modules.map((m, i) => (
              <details
                key={m.id}
                className="group rounded-xl border border-border bg-white"
                open={i === 0}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
                  <span className="flex items-center gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-green-50 text-sm font-bold text-green-700">
                      {i + 1}
                    </span>
                    <span className="font-semibold text-ink">{m.title}</span>
                  </span>
                  <svg
                    className="h-5 w-5 shrink-0 text-muted transition-transform group-open:rotate-180"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </summary>
                <ul className="flex flex-col divide-y divide-border border-t border-border">
                  {m.lessons.map((l) => (
                    <li key={l.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <span className="flex items-center gap-2 text-sm text-ink">
                        {l.title}
                        {l.isFree ? (
                          <span className="rounded-full bg-gold-50 px-2 py-0.5 text-[11px] font-medium text-gold-600">
                            Prévia
                          </span>
                        ) : null}
                      </span>
                      <span className="shrink-0 text-xs text-muted">
                        {formatDuration(l.durationSeconds)}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </div>

        {/* Card de investimento fixo */}
        <aside className="lg:pt-14">
          <div className="sticky top-6 rounded-2xl border border-border bg-white p-6 shadow-[0_8px_30px_rgba(2,20,12,.08)]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-green-700">
              Matrícula aberta
            </span>
            <p className="mt-3 text-sm text-muted">Investimento</p>
            <p className="font-serif text-3xl font-semibold text-green-800">
              {formatBRL(course.priceCents)}
            </p>
            <p className="text-sm text-muted">
              ou em até {INSTALLMENTS}x de{' '}
              <strong className="text-ink">{formatBRL(perMonth)}</strong>
            </p>
            <Link
              href={`/checkout/${course.slug}`}
              className={`${buttonClasses('gold')} mt-4 w-full`}
            >
              Matricule-se
            </Link>
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted">
              <LockIcon />
              Pagamento seguro — Pix, cartão ou boleto
            </div>
            <ul className="mt-5 flex flex-col gap-2 border-t border-border pt-5 text-sm text-ink">
              {[
                'Acesso imediato após a matrícula',
                'Certificado ao concluir',
                'Conteúdo 100% online',
              ].map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <CheckIcon small />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

function GuideBanner() {
  return (
    <section className="mx-auto max-w-[1140px] px-6 py-8">
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-green-800 p-6 text-[#EAF0EC] sm:flex-row sm:items-center">
        <div>
          <h3 className="font-serif text-xl font-semibold">Guia do curso</h3>
          <p className="mt-1 text-sm text-[#C6D3CA]">
            Fale com nossa equipe e receba o guia completo com toda a grade e as condições.
          </p>
        </div>
        <LeadFormTrigger source="curso-guia" className={buttonClasses('gold')}>
          Quero o guia
        </LeadFormTrigger>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

function Faculty({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
  return (
    <section className="mx-auto max-w-[1140px] px-6 py-8">
      <h2 className="mb-5 font-serif text-3xl font-semibold text-green-800">
        Conheça a coordenação
      </h2>
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-white p-5">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-green-900 font-serif text-xl font-semibold text-gold-400">
          {initials}
        </span>
        <div>
          <p className="font-semibold text-ink">{name}</p>
          <p className="text-sm text-muted">
            Coordenação acadêmica — especialista com atuação clínica e docente.
          </p>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

function Benefits() {
  const items = [
    { title: 'Estudos 100% online', desc: 'Aprenda de onde estiver, sem deslocamento.' },
    { title: 'Certificação Vethis', desc: 'Certificado ao concluir, com carga horária.' },
    { title: 'Conteúdo multiplataforma', desc: 'Acesse pelo computador, tablet ou celular.' },
    { title: 'No ritmo da sua rotina', desc: 'Retome de onde parou, quando quiser.' },
  ];
  return (
    <section className="mx-auto max-w-[1140px] px-6 py-10">
      <h2 className="mb-6 font-serif text-3xl font-semibold text-green-800">
        Benefícios de estudar na Vethis
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it) => (
          <div key={it.title} className="rounded-2xl border border-border bg-white p-5">
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-green-50 text-green-700">
              <CheckIcon />
            </div>
            <p className="font-semibold text-ink">{it.title}</p>
            <p className="mt-1 text-sm text-muted">{it.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

function InvestmentBand({ course, perMonth }: { course: CourseDetail; perMonth: number }) {
  return (
    <section className="mx-auto max-w-[1140px] px-6 py-8">
      <div className="flex flex-col items-start justify-between gap-5 rounded-2xl bg-green-900 p-8 text-[#EAF0EC] sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-[#9DB0A5]">Investimento</p>
          <p className="font-serif text-3xl font-semibold text-gold-400">
            {formatBRL(course.priceCents)}
          </p>
          <p className="text-sm text-[#C6D3CA]">
            ou em até {INSTALLMENTS}x de {formatBRL(perMonth)}
          </p>
        </div>
        <Link href={`/checkout/${course.slug}`} className={buttonClasses('gold')}>
          Matricule-se
        </Link>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

function Related({ courses }: { courses: CourseSummary[] }) {
  return (
    <section className="mx-auto max-w-[1140px] px-6 py-10">
      <h2 className="mb-6 font-serif text-3xl font-semibold text-green-800">Cursos relacionados</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => (
          <Link
            key={c.id}
            href={`/cursos/${c.slug}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white transition-shadow hover:shadow-lg"
          >
            <div className="aspect-[16/9] overflow-hidden bg-green-900">
              {c.coverUrl ? (
                <img
                  src={c.coverUrl}
                  alt={c.title}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-green-800 to-green-900">
                  <span className="font-serif text-gold-400/70">Vethis</span>
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col p-4">
              {c.specialty ? (
                <span className="text-[11px] font-medium uppercase tracking-wide text-gold-600">
                  {c.specialty.name}
                </span>
              ) : null}
              <p className="mt-1 font-semibold leading-snug text-ink">{c.title}</p>
              <p className="mt-auto pt-3 font-serif text-lg font-semibold text-green-800">
                {formatBRL(c.priceCents)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

function Faq() {
  const items = [
    {
      q: 'Requisitos e documentação para matrícula',
      a: 'A matrícula é feita online. Após a compra, você cria seu acesso e conclui o cadastro na área do aluno. Não exigimos documentação prévia para começar a estudar.',
    },
    {
      q: 'Disponibilização do acesso',
      a: 'O acesso é liberado imediatamente após a confirmação do pagamento. Com Pix e cartão a liberação é na hora; com boleto, após a compensação.',
    },
    {
      q: 'Metodologia e funcionamento das aulas',
      a: 'As aulas são gravadas e ficam disponíveis 100% online. Você estuda no seu ritmo, acompanha o progresso por aula e retoma de onde parou em qualquer dispositivo.',
    },
    {
      q: 'Avaliações',
      a: 'O acompanhamento é por conclusão das aulas do curso. Ao finalizar todo o conteúdo, o certificado fica disponível.',
    },
    {
      q: 'Certificado',
      a: 'Ao concluir 100% do curso, o certificado é emitido automaticamente e fica disponível para download na área do aluno.',
    },
    {
      q: 'Política de cancelamento',
      a: 'Você pode solicitar o cancelamento com reembolso em até 7 dias após a compra, conforme o Código de Defesa do Consumidor.',
    },
  ];
  return (
    <section className="mx-auto max-w-[1140px] px-6 py-12">
      <h2 className="mb-6 font-serif text-3xl font-semibold text-green-800">
        Perguntas frequentes
      </h2>
      <div className="flex flex-col gap-3">
        {items.map((it) => (
          <details key={it.q} className="group rounded-xl border border-border bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-semibold text-ink">
              {it.q}
              <svg
                className="h-5 w-5 shrink-0 text-muted transition-transform group-open:rotate-180"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </summary>
            <p className="border-t border-border px-5 py-4 text-sm leading-relaxed text-muted">
              {it.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

function CheckIcon({ small }: { small?: boolean }) {
  return (
    <svg
      className={
        small ? 'mt-0.5 h-4 w-4 shrink-0 text-green-700' : 'h-5 w-5 shrink-0 text-green-700'
      }
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
