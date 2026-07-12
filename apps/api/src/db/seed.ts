import { eq } from 'drizzle-orm';
import { loadConfig } from '../config/configuration';
import { createDb } from './client';
import { courseModules, courses, instructors, lessons, specialties } from './schema/catalog';

/** Especialidades da marca (VethisDesignSystem §6). */
const SPECIALTIES = [
  { slug: 'cardiologia', name: 'Cardiologia' },
  { slug: 'cirurgia', name: 'Cirurgia' },
  { slug: 'diagnostico-por-imagem', name: 'Diagnóstico por Imagem' },
  { slug: 'dermatologia', name: 'Dermatologia' },
  { slug: 'anestesiologia', name: 'Anestesiologia' },
  { slug: 'odontologia', name: 'Odontologia' },
  { slug: 'emergencia-uti', name: 'Emergência & UTI' },
  { slug: 'animais-exoticos', name: 'Animais Exóticos' },
];

/**
 * Seed de desenvolvimento idempotente (ON CONFLICT DO NOTHING por slug).
 * Cria especialidades, um instrutor e um curso publicado de exemplo.
 */
async function main(): Promise<void> {
  const config = loadConfig();
  const { db, sql } = createDb(config.DATABASE_URL);

  await db
    .insert(specialties)
    .values(SPECIALTIES)
    .onConflictDoNothing({ target: specialties.slug });

  const [instructor] = await db
    .insert(instructors)
    .values({
      slug: 'dra-marina-alves',
      name: 'Dra. Marina Alves',
      bio: 'Especialista em cardiologia veterinária, 15 anos de prática clínica.',
    })
    .onConflictDoNothing({ target: instructors.slug })
    .returning();

  const cardioRows = await db
    .select({ id: specialties.id })
    .from(specialties)
    .where(eq(specialties.slug, 'cardiologia'))
    .limit(1);
  const cardio = cardioRows[0];

  if (instructor && cardio) {
    const [course] = await db
      .insert(courses)
      .values({
        slug: 'ecocardiografia-na-pratica',
        title: 'Ecocardiografia na Prática',
        subtitle: 'Do básico ao laudo, com casos reais.',
        description: 'Curso prático de ecocardiografia para o clínico de pequenos animais.',
        priceCents: 149700,
        level: 'intermediario',
        status: 'published',
        specialtyId: cardio.id,
        instructorId: instructor.id,
        publishedAt: new Date(),
      })
      .onConflictDoNothing({ target: courses.slug })
      .returning();

    if (course) {
      const [mod] = await db
        .insert(courseModules)
        .values({ courseId: course.id, title: 'Fundamentos', position: 1 })
        .returning();
      if (mod) {
        await db.insert(lessons).values([
          {
            moduleId: mod.id,
            title: 'Introdução e janelas acústicas',
            durationSeconds: 720,
            position: 1,
            isFree: true,
          },
          { moduleId: mod.id, title: 'Modo B e modo M', durationSeconds: 1080, position: 2 },
        ]);
      }
    }
  }

  console.log('Seed concluído.');
  await sql.end();
}

main().catch((err) => {
  console.error('Falha no seed:', err);
  process.exit(1);
});
