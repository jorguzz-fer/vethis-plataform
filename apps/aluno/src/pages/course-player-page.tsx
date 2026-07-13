import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, ProgressBar } from '@vethis/ui';
import { api, type CoursePlayer, type EnrolledCourse } from '../api';

type Lesson = CoursePlayer['modules'][number]['lessons'][number];

function formatDuration(seconds: number): string {
  return `${Math.max(1, Math.round(seconds / 60))} min`;
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
      <path d="M8 5.5v13l11-6.5-11-6.5Z" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 transition-transform ${open ? '' : '-rotate-90'}`}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/** Círculo de status da aula: check preenchido se concluída, senão play/círculo. */
function LessonStatus({ completed, active }: { completed: boolean; active: boolean }) {
  if (completed) {
    return (
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-green-700 text-white">
        <CheckIcon />
      </span>
    );
  }
  return (
    <span
      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border ${
        active ? 'border-green-700 text-green-700' : 'border-border text-muted'
      }`}
    >
      <PlayIcon />
    </span>
  );
}

export function CoursePlayerPage() {
  const { slug = '' } = useParams();
  const [course, setCourse] = useState<CoursePlayer | null>(null);
  const [enrolled, setEnrolled] = useState<EnrolledCourse[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    api
      .GET('/v1/me/courses/{slug}', { params: { path: { slug } } })
      .then(({ data }) => {
        setCourse(data ?? null);
        const first = data?.modules[0]?.lessons[0];
        if (first) setCurrentId(first.id);
      })
      .catch(() => setCourse(null));
  }, [slug]);

  useEffect(() => {
    api
      .GET('/v1/me/courses')
      .then(({ data }) => setEnrolled(data ?? []))
      .catch(() => setEnrolled([]));
  }, []);

  const current: Lesson | undefined = useMemo(
    () => course?.modules.flatMap((m) => m.lessons).find((l) => l.id === currentId),
    [course, currentId],
  );

  const progress = useMemo(() => {
    const lessons = course?.modules.flatMap((m) => m.lessons) ?? [];
    const total = lessons.length;
    const completed = lessons.filter((l) => l.completed).length;
    const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, pct };
  }, [course]);

  const otherCourses = useMemo(() => enrolled.filter((c) => c.slug !== slug), [enrolled, slug]);

  async function markComplete(lessonId: string) {
    await api.POST('/v1/me/lessons/{lessonId}/complete', {
      params: { path: { lessonId } },
    });
    setCourse((prev) =>
      prev
        ? {
            ...prev,
            modules: prev.modules.map((m) => ({
              ...m,
              lessons: m.lessons.map((l) => (l.id === lessonId ? { ...l, completed: true } : l)),
            })),
          }
        : prev,
    );
  }

  if (course === null) return <p className="text-muted">Carregando curso…</p>;

  let lessonNumber = 0;

  return (
    <div>
      <Link
        to="/meus-cursos"
        className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-green-700 hover:underline"
      >
        <span aria-hidden>←</span> Voltar aos cursos
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Coluna central */}
        <div className="min-w-0">
          <h1 className="mb-1 font-serif text-2xl font-semibold text-green-800">{course.title}</h1>
          {course.subtitle ? (
            <p className="mb-5 text-muted">{course.subtitle}</p>
          ) : (
            <div className="mb-5" />
          )}

          <div className="mb-5 aspect-video overflow-hidden rounded-lg bg-green-900 shadow-[0_12px_34px_-18px_rgba(10,31,25,.35)]">
            {current?.vimeoVideoId ? (
              <iframe
                title={current.title}
                src={`https://player.vimeo.com/video/${current.vimeoVideoId}`}
                allow="autoplay; fullscreen; picture-in-picture"
                className="h-full w-full"
              />
            ) : (
              <div className="grid h-full place-items-center text-sm text-[#9DB0A5]">
                {current ? 'Vídeo em breve' : 'Selecione uma aula'}
              </div>
            )}
          </div>

          {current ? (
            <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wide text-gold-600">
                  Aula atual
                </span>
                <h2 className="text-lg font-bold text-ink">{current.title}</h2>
              </div>
              <Button
                size="sm"
                variant={current.completed ? 'soft' : 'primary'}
                onClick={() => markComplete(current.id)}
                disabled={current.completed}
              >
                {current.completed ? 'Concluída' : 'Marcar concluída'}
              </Button>
            </div>
          ) : null}

          {/* Módulos como seções recolhíveis */}
          <div className="flex flex-col gap-4">
            {course.modules.map((m) => {
              const open = !collapsed[m.id];
              return (
                <section
                  key={m.id}
                  className="overflow-hidden rounded-lg border border-border bg-white"
                >
                  <button
                    type="button"
                    onClick={() => setCollapsed((prev) => ({ ...prev, [m.id]: !prev[m.id] }))}
                    className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
                  >
                    <h3 className="font-serif text-base font-semibold text-green-800">{m.title}</h3>
                    <span className="text-muted">
                      <ChevronIcon open={open} />
                    </span>
                  </button>

                  {open ? (
                    <ul className="flex flex-col divide-y divide-border border-t border-border">
                      {m.lessons.map((l) => {
                        lessonNumber += 1;
                        const active = l.id === currentId;
                        return (
                          <li key={l.id}>
                            <button
                              type="button"
                              onClick={() => setCurrentId(l.id)}
                              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                                active ? 'bg-green-50' : 'hover:bg-green-50/50'
                              }`}
                            >
                              <span
                                className={`w-6 shrink-0 text-sm font-semibold tabular-nums ${
                                  active ? 'text-green-700' : 'text-muted'
                                }`}
                              >
                                {String(lessonNumber).padStart(2, '0')}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span
                                  className={`block truncate text-sm font-medium ${
                                    active ? 'text-green-800' : 'text-ink'
                                  }`}
                                >
                                  {l.title}
                                </span>
                                <span className="text-xs text-muted">
                                  {formatDuration(l.durationSeconds)}
                                </span>
                              </span>
                              <LessonStatus completed={l.completed} active={active} />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </section>
              );
            })}
          </div>
        </div>

        {/* Painel à direita */}
        <aside className="flex flex-col gap-5">
          <div className="rounded-lg border border-border bg-white p-5">
            <h3 className="mb-3 font-serif text-base font-semibold text-green-800">
              Progresso do curso
            </h3>
            <ProgressBar value={progress.pct} aria-label={`Progresso ${progress.pct}%`} />
            <p className="mt-2 text-sm text-muted">
              {progress.completed}/{progress.total} aulas · {progress.pct}%
            </p>
            {progress.total > 0 && progress.pct === 100 ? (
              <Link to={`/curso/${slug}/certificado`} className="mt-4 block">
                <Button variant="gold" className="w-full">
                  🎓 Emitir certificado
                </Button>
              </Link>
            ) : null}
          </div>

          {otherCourses.length > 0 ? (
            <div className="rounded-lg border border-border bg-white p-5">
              <h3 className="mb-4 font-serif text-base font-semibold text-green-800">
                Meus cursos
              </h3>
              <ul className="flex flex-col gap-4">
                {otherCourses.map((c) => (
                  <li key={c.id}>
                    <Link to={`/curso/${c.slug}`} className="block hover:opacity-90">
                      <span className="mb-1.5 block text-sm font-semibold text-ink">{c.title}</span>
                      <ProgressBar
                        value={c.progress.pct}
                        aria-label={`Progresso ${c.progress.pct}%`}
                      />
                      <span className="mt-1 block text-xs text-muted">
                        {c.progress.completed}/{c.progress.total} aulas · {c.progress.pct}%
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
