import { notFound } from 'next/navigation';
import { formatBRL } from '@vethis/shared';
import { Badge, Button } from '@vethis/ui';
import { getCourse } from '@/lib/api';

export const dynamic = 'force-dynamic';

function formatDuration(seconds: number): string {
  const min = Math.round(seconds / 60);
  return `${min} min`;
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();

  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);

  return (
    <article>
      <header className="bg-green-900 text-[#EAF0EC]">
        <div className="mx-auto max-w-[1140px] px-6 py-14">
          <div className="mb-4 flex flex-wrap gap-2">
            {course.specialty ? <Badge variant="highlight">{course.specialty.name}</Badge> : null}
          </div>
          <h1 className="max-w-3xl font-serif text-4xl font-semibold leading-tight md:text-5xl">
            {course.title}
          </h1>
          {course.subtitle ? (
            <p className="mt-4 max-w-2xl text-lg text-[#C6D3CA]">{course.subtitle}</p>
          ) : null}
          <div className="mt-6 flex items-center gap-4">
            <span className="font-serif text-2xl font-semibold text-gold-400">
              {formatBRL(course.priceCents)}
            </span>
            <Button variant="gold">Comprar curso</Button>
          </div>
          {course.instructor ? (
            <p className="mt-4 text-sm text-[#9DB0A5]">Com {course.instructor.name}</p>
          ) : null}
        </div>
      </header>

      <div className="mx-auto max-w-[1140px] px-6 py-12">
        {course.description ? (
          <p className="mb-10 max-w-3xl text-lg text-ink">{course.description}</p>
        ) : null}

        <h2 className="mb-1 font-serif text-2xl font-semibold text-green-800">Conteúdo</h2>
        <p className="mb-6 text-sm text-muted">
          {course.modules.length} módulo(s) · {totalLessons} aula(s)
        </p>

        <div className="flex flex-col gap-6">
          {course.modules.map((m) => (
            <section key={m.id} className="rounded-lg border border-border bg-white p-5">
              <h3 className="mb-3 text-lg font-bold text-ink">{m.title}</h3>
              <ul className="flex flex-col divide-y divide-border">
                {m.lessons.map((l) => (
                  <li key={l.id} className="flex items-center justify-between py-2.5">
                    <span className="flex items-center gap-2 text-ink">
                      {l.title}
                      {l.isFree ? <Badge variant="new">Prévia</Badge> : null}
                    </span>
                    <span className="text-sm text-muted">{formatDuration(l.durationSeconds)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}
