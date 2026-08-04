import { Hero } from '@/components/site/hero';
import { Especialidades } from '@/components/site/especialidades';
import { Cursos } from '@/components/site/cursos';
import { AppBand } from '@/components/site/app-band';
import { ClinicasDash } from '@/components/site/clinicas-dash';
import { Instrutores } from '@/components/site/instrutores';
import { Depoimento } from '@/components/site/depoimento';
import { Cta } from '@/components/site/cta';
import { getCourses } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const courses = await getCourses();
  const featured = courses.slice(0, 6);

  return (
    <>
      <Hero />
      <Especialidades />
      <Cursos courses={featured} />
      <AppBand />
      <ClinicasDash />
      <Instrutores />
      <Depoimento />
      <Cta />
    </>
  );
}
