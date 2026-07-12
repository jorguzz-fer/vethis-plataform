import Link from 'next/link';
import { Badge, Button } from '@vethis/ui';
import { Hero } from '@/components/hero';
import { CourseGrid } from '@/components/course-grid';
import { getCourses, getSpecialties } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [specialties, courses] = await Promise.all([getSpecialties(), getCourses()]);
  const featured = courses.slice(0, 6);

  return (
    <>
      <Hero />

      <section id="especialidades" className="mx-auto max-w-[1140px] px-6 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[2px] text-gold-600">Trilhas</p>
            <h2 className="font-serif text-3xl font-semibold text-green-800">Especialidades</h2>
          </div>
        </div>
        {specialties.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {specialties.map((s) => (
              <Link
                key={s.id}
                href={`/cursos?specialty=${s.slug}`}
                className="rounded-lg border border-border bg-white p-4 transition-colors hover:border-green-500"
              >
                <span className="font-medium text-ink">{s.name}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted">Especialidades em breve.</p>
        )}
      </section>

      <section className="mx-auto max-w-[1140px] px-6 pb-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[2px] text-gold-600">Catálogo</p>
            <h2 className="font-serif text-3xl font-semibold text-green-800">Cursos em destaque</h2>
          </div>
          <Link href="/cursos" className="hidden md:block">
            <Button variant="text">Ver todos</Button>
          </Link>
        </div>
        <CourseGrid courses={featured} />
      </section>

      <section id="clinicas" className="mx-auto max-w-[1140px] px-6 py-16">
        <div className="flex flex-col items-start gap-4 rounded-lg bg-green-900 p-10 text-[#EAF0EC] md:flex-row md:items-center md:justify-between">
          <div>
            <Badge variant="highlight" className="mb-3">
              Para clínicas
            </Badge>
            <h3 className="max-w-xl font-serif text-2xl font-semibold">
              Capacite sua equipe com trilhas por especialidade.
            </h3>
          </div>
          <Link href="/cursos">
            <Button variant="gold">Falar com a Vethis</Button>
          </Link>
        </div>
      </section>
    </>
  );
}
