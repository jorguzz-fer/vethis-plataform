import Link from 'next/link';
import { formatBRL } from '@vethis/shared';
import { Button, CourseCard } from '@vethis/ui';
import type { CourseSummary } from '@/lib/api';

export function CourseGrid({ courses }: { courses: CourseSummary[] }) {
  if (courses.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-white/60 p-8 text-center text-muted">
        Nenhum curso disponível no momento.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((c) => (
        <CourseCard
          key={c.id}
          title={c.title}
          priceLabel={formatBRL(c.priceCents)}
          specialty={c.specialty?.name}
          level={c.level}
          coverUrl={c.coverUrl ?? undefined}
          cta={
            <Link href={`/cursos/${c.slug}`}>
              <Button size="sm">Ver curso</Button>
            </Link>
          }
        />
      ))}
    </div>
  );
}
