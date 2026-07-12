import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge, Button } from '@vethis/ui';
import { api, type CoursePlayer } from '../api';

type Lesson = CoursePlayer['modules'][number]['lessons'][number];

export function CoursePlayerPage() {
  const { slug = '' } = useParams();
  const [course, setCourse] = useState<CoursePlayer | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);

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

  const current: Lesson | undefined = useMemo(
    () => course?.modules.flatMap((m) => m.lessons).find((l) => l.id === currentId),
    [course, currentId],
  );

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

  return (
    <div>
      <h1 className="mb-4 font-serif text-2xl font-semibold text-green-800">{course.title}</h1>

      <div className="mb-4 aspect-video overflow-hidden rounded-lg bg-green-900">
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
        <div className="mb-6 flex items-center justify-between">
          <span className="font-medium text-ink">{current.title}</span>
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

      <div className="flex flex-col gap-5">
        {course.modules.map((m) => (
          <section key={m.id}>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">{m.title}</h2>
            <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-white">
              {m.lessons.map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => setCurrentId(l.id)}
                    className={`flex w-full items-center justify-between gap-2 px-4 py-3 text-left ${
                      l.id === currentId ? 'bg-green-50' : ''
                    }`}
                  >
                    <span className="text-ink">{l.title}</span>
                    {l.completed ? <Badge variant="category">✓</Badge> : null}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
