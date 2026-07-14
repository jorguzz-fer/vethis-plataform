import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, ProgressBar } from '@vethis/ui';
import { api, type EnrolledCourse } from '../api';
import { EmptyCourses } from '../components/empty-courses';

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <p className="font-serif text-2xl font-semibold text-green-800">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

export function HomePage() {
  const [courses, setCourses] = useState<EnrolledCourse[] | null>(null);

  useEffect(() => {
    api
      .GET('/v1/me/courses')
      .then(({ data }) => setCourses(data ?? []))
      .catch(() => setCourses([]));
  }, []);

  const stats = useMemo(() => {
    const list = courses ?? [];
    const totalLessons = list.reduce((a, c) => a + c.progress.total, 0);
    const doneLessons = list.reduce((a, c) => a + c.progress.completed, 0);
    const avg = list.length
      ? Math.round(list.reduce((a, c) => a + c.progress.pct, 0) / list.length)
      : 0;
    return { totalLessons, doneLessons, avg, count: list.length };
  }, [courses]);

  // "Continuar assistindo": curso em andamento com maior progresso; se nenhum
  // começou, o primeiro da lista.
  const continueCourse = useMemo(() => {
    const list = courses ?? [];
    const inProgress = list
      .filter((c) => c.progress.pct > 0 && c.progress.pct < 100)
      .sort((a, b) => b.progress.pct - a.progress.pct);
    return inProgress[0] ?? list.find((c) => c.progress.pct < 100) ?? list[0];
  }, [courses]);

  if (courses === null) return <p className="text-muted">Carregando…</p>;

  return (
    <div>
      {/* Banner de boas-vindas — escondido no mobile. Some sozinho se o arquivo
          ainda não existir em /public (evita imagem quebrada). */}
      <img
        src="/banner-inicio.png"
        alt="Um focinho a mais respira, porque você não parou de estudar"
        className="mb-6 hidden w-full rounded-2xl lg:block"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />

      <h1 className="font-serif text-2xl font-semibold text-green-800">Olá! 👋</h1>
      <p className="mt-1 text-muted">
        {courses.length > 0
          ? 'Bom te ver de volta. Continue de onde parou.'
          : 'Bem-vindo à sua área de estudos.'}
      </p>

      {courses.length === 0 ? (
        <div className="mt-8">
          <EmptyCourses />
        </div>
      ) : (
        <>
          {continueCourse ? (
            <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-green-900 text-[#EAF0EC] shadow-[0_18px_40px_-24px_rgba(10,31,25,.6)]">
              <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
                <div className="min-w-0">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gold-400">
                    Continuar assistindo
                  </span>
                  <h2 className="mt-1 truncate font-serif text-xl font-semibold">
                    {continueCourse.title}
                  </h2>
                  <div className="mt-3 max-w-sm">
                    <ProgressBar
                      value={continueCourse.progress.pct}
                      aria-label={`Progresso ${continueCourse.progress.pct}%`}
                    />
                    <p className="mt-1.5 text-sm text-[#C6D3CA]">
                      {continueCourse.progress.completed}/{continueCourse.progress.total} aulas ·{' '}
                      {continueCourse.progress.pct}%
                    </p>
                  </div>
                </div>
                <Link to={`/curso/${continueCourse.slug}`} className="shrink-0">
                  <Button variant="gold" className="px-8">
                    {continueCourse.progress.pct > 0 ? 'Continuar' : 'Começar'}
                  </Button>
                </Link>
              </div>
            </section>
          ) : null}

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatTile label="Cursos matriculados" value={String(stats.count)} />
            <StatTile
              label="Aulas concluídas"
              value={`${stats.doneLessons}/${stats.totalLessons}`}
            />
            <StatTile label="Progresso médio" value={`${stats.avg}%`} />
          </div>

          <div className="mt-8 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted">Meus cursos</h3>
            <Link
              to="/meus-cursos"
              className="text-sm font-semibold text-green-700 hover:underline"
            >
              Ver todos →
            </Link>
          </div>
          <ul className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {courses.slice(0, 3).map((c) => (
              <li key={c.id}>
                <Link
                  to={`/curso/${c.slug}`}
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
                    <div className="mt-auto">
                      <ProgressBar
                        value={c.progress.pct}
                        aria-label={`Progresso ${c.progress.pct}%`}
                      />
                      <p className="mt-2 text-sm text-muted">
                        {c.progress.completed}/{c.progress.total} aulas · {c.progress.pct}%
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
