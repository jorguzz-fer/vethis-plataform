import { CourseGrid } from '@/components/course-grid';
import { getCourses } from '@/lib/api';

export const dynamic = 'force-dynamic';

type Level = 'iniciante' | 'intermediario' | 'avancado';
const LEVELS: Level[] = ['iniciante', 'intermediario', 'avancado'];

function parseLevel(value: string | undefined): Level | undefined {
  return LEVELS.find((l) => l === value);
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ specialty?: string; level?: string }>;
}) {
  const params = await searchParams;
  const courses = await getCourses({
    specialty: params.specialty,
    level: parseLevel(params.level),
  });

  return (
    <div className="mx-auto max-w-[1140px] px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-[2px] text-gold-600">Catálogo</p>
      <h1 className="mb-8 font-serif text-4xl font-semibold text-green-800">Cursos</h1>
      <CourseGrid courses={courses} />
    </div>
  );
}
