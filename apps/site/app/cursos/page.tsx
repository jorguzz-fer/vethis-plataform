import type { Metadata } from 'next';
import { CourseGrid } from '@/components/course-grid';
import { getCourses } from '@/lib/api';
import { JsonLd } from '@/components/site/json-ld';
import { absoluteUrl, courseListLd } from '@/lib/seo';

export const dynamic = 'force-dynamic';

const DESCRIPTION =
  'Catálogo de pós-graduações e cursos de medicina veterinária da Vethis: medicina felina, clínica médica de cães e gatos, nefrologia, emergência, hematologia e mais.';

export const metadata: Metadata = {
  title: 'Cursos',
  description: DESCRIPTION,
  alternates: { canonical: '/cursos' },
  openGraph: {
    type: 'website',
    url: absoluteUrl('/cursos'),
    title: 'Cursos · Vethis',
    description: DESCRIPTION,
  },
};

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
      {courses.length > 0 ? <JsonLd data={courseListLd(courses)} /> : null}
      <p className="text-xs font-semibold uppercase tracking-[2px] text-gold-600">Catálogo</p>
      <h1 className="mb-8 font-serif text-4xl font-semibold text-green-800">Cursos</h1>
      <CourseGrid courses={courses} />
    </div>
  );
}
