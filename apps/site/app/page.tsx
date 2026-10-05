import type { Metadata } from 'next';
import { HeroCarousel } from '@/components/site/hero-carousel';
import { Especialidades } from '@/components/site/especialidades';
import { Cursos } from '@/components/site/cursos';
import { AppBand } from '@/components/site/app-band';
import { ClinicasDash } from '@/components/site/clinicas-dash';
import { Instrutores } from '@/components/site/instrutores';
import { Depoimento } from '@/components/site/depoimento';
import { Cta } from '@/components/site/cta';
import { JsonLd } from '@/components/site/json-ld';
import { organizationLd, websiteLd } from '@/lib/seo';
import { getCourses } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { alternates: { canonical: '/' } };

export default async function HomePage() {
  const courses = await getCourses();
  const featured = courses.slice(0, 6);

  return (
    <>
      <JsonLd data={organizationLd()} />
      <JsonLd data={websiteLd()} />
      <HeroCarousel />
      <Especialidades />
      <Cursos courses={featured} />
      <AppBand />
      <ClinicasDash />
      <Instrutores courses={courses} />
      <Depoimento />
      <Cta />
    </>
  );
}
