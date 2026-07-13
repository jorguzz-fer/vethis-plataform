import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProgressBar } from '@vethis/ui';
import { api, type EnrolledCourse } from '../api';
import { EmptyCourses } from '../components/empty-courses';

export function MyCoursesPage() {
  const [courses, setCourses] = useState<EnrolledCourse[] | null>(null);

  useEffect(() => {
    api
      .GET('/v1/me/courses')
      .then(({ data }) => setCourses(data ?? []))
      .catch(() => setCourses([]));
  }, []);

  if (courses === null) return <p className="text-muted">Carregando…</p>;

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl font-semibold text-green-800">Meus cursos</h1>
      {courses.length === 0 ? (
        <EmptyCourses />
      ) : (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => (
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
                  <h2 className="mb-3 text-base font-bold text-ink">{c.title}</h2>
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
      )}
    </div>
  );
}
