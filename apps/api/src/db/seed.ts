import { hash } from '@node-rs/argon2';
import { eq } from 'drizzle-orm';
import { loadConfig, type AppConfig } from '../config/configuration';
import { createDb } from './client';
import { courseModules, courses, instructors, lessons, specialties } from './schema/catalog';
import { enrollments } from './schema/enrollment';
import { users } from './schema/identity';
import { leads } from './schema/crm';
import type { CourseLevel } from './schema/enums';

/** Especialidades/áreas do catálogo Vethis. */
const SPECIALTIES = [
  { slug: 'medicina-felina', name: 'Medicina Felina' },
  { slug: 'emergencia-uti', name: 'Emergência & UTI' },
  { slug: 'farmacologia', name: 'Farmacologia Clínica' },
  { slug: 'patologia', name: 'Patologia' },
  { slug: 'nefrologia', name: 'Nefrologia' },
  { slug: 'hematologia', name: 'Hematologia' },
  { slug: 'gestao-rt', name: 'Gestão & Responsabilidade Técnica' },
  { slug: 'cardiologia', name: 'Cardiologia' },
  { slug: 'cirurgia', name: 'Cirurgia' },
  { slug: 'diagnostico-por-imagem', name: 'Diagnóstico por Imagem' },
  { slug: 'dermatologia', name: 'Dermatologia' },
  { slug: 'anestesiologia', name: 'Anestesiologia' },
];

/** Corpo docente — mesmos nomes/fotos da seção "Instrutores" do site. */
const INSTRUCTORS = [
  {
    slug: 'dr-ricardo-mendes',
    name: 'Dr. Ricardo Mendes',
    bio: 'Diretor clínico e pesquisador em clínica médica de pequenos animais.',
    photo: 'ricardo-mendes.webp',
  },
  {
    slug: 'dra-ana-faria',
    name: 'Dra. Ana B. Faria',
    bio: 'Especialista em clínica de felinos e gestão da rotina veterinária.',
    photo: 'ana-faria.webp',
  },
  {
    slug: 'dr-carlos-nunes',
    name: 'Dr. Carlos Nunes',
    bio: 'Farmacologista clínico e referência em terapêutica de pequenos animais.',
    photo: 'carlos-nunes.webp',
  },
  {
    slug: 'dra-lucia-prado',
    name: 'Dra. Lúcia Prado',
    bio: 'Intensivista e docente de emergência e medicina transfusional.',
    photo: 'lucia-prado.webp',
  },
];

interface SeedLesson {
  title: string;
  min: number;
  free?: boolean;
}
interface SeedModule {
  title: string;
  lessons: SeedLesson[];
}
interface SeedCourse {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  priceCents: number;
  level: CourseLevel;
  specialty: string;
  instructor: string;
  modules: SeedModule[];
}

/** Catálogo Vethis — cursos publicados com módulos e aulas. */
const COURSES: SeedCourse[] = [
  {
    slug: 'pos-medicina-felina',
    title: 'Pós-graduação em Medicina Felina',
    subtitle: 'O gato como paciente único, do ambulatório à internação.',
    description:
      'Formação completa em medicina felina: comportamento, particularidades fisiológicas, principais afecções e manejo hospitalar do paciente gato.',
    priceCents: 249700,
    level: 'avancado',
    specialty: 'medicina-felina',
    instructor: 'dra-ana-faria',
    modules: [
      {
        title: 'O paciente felino',
        lessons: [
          { title: 'Comportamento e manejo de baixo estresse', min: 16, free: true },
          { title: 'Particularidades fisiológicas do gato', min: 20 },
        ],
      },
      {
        title: 'Afecções prevalentes',
        lessons: [
          { title: 'Doença renal crônica felina', min: 24 },
          { title: 'Trato urinário inferior (FLUTD)', min: 18 },
        ],
      },
    ],
  },
  {
    slug: 'pos-emergencia-pequenos-animais',
    title: 'Pós-graduação em Emergência Médica de Pequenos Animais',
    subtitle: 'Do atendimento inicial à terapia intensiva.',
    description:
      'Programa de emergência e cuidados intensivos: triagem, ressuscitação, monitoração e condutas no paciente crítico.',
    priceCents: 259700,
    level: 'avancado',
    specialty: 'emergencia-uti',
    instructor: 'dra-lucia-prado',
    modules: [
      {
        title: 'Atendimento inicial',
        lessons: [
          { title: 'Triagem e ABCs da emergência', min: 15, free: true },
          { title: 'Ressuscitação e fluidoterapia', min: 22 },
        ],
      },
      {
        title: 'Terapia intensiva',
        lessons: [
          { title: 'Choque: reconhecimento e manejo', min: 20 },
          { title: 'Monitoração do paciente crítico', min: 21 },
        ],
      },
    ],
  },
  {
    slug: 'farmacologia-clinica',
    title: 'Curso de Farmacologia Clínica de Pequenos Animais',
    subtitle: 'Prescrição segura e racional na rotina.',
    description:
      'Bases da farmacologia aplicada à clínica: farmacocinética, principais classes, interações e prescrição racional.',
    priceCents: 119700,
    level: 'intermediario',
    specialty: 'farmacologia',
    instructor: 'dr-carlos-nunes',
    modules: [
      {
        title: 'Fundamentos',
        lessons: [
          { title: 'Farmacocinética e farmacodinâmica', min: 14, free: true },
          { title: 'Cálculo de doses e vias de administração', min: 16 },
        ],
      },
      {
        title: 'Terapêutica aplicada',
        lessons: [
          { title: 'Antimicrobianos: uso racional', min: 20 },
          { title: 'Analgesia e anti-inflamatórios', min: 18 },
        ],
      },
    ],
  },
  {
    slug: 'patologia-geral-forense',
    title: 'Curso de Patologia Geral e Forense',
    subtitle: 'Do processo patológico à perícia veterinária.',
    description:
      'Mecanismos gerais de lesão e adaptação celular e introdução à patologia forense e à necropsia pericial.',
    priceCents: 109700,
    level: 'intermediario',
    specialty: 'patologia',
    instructor: 'dr-ricardo-mendes',
    modules: [
      {
        title: 'Patologia geral',
        lessons: [
          { title: 'Lesão e morte celular', min: 15, free: true },
          { title: 'Inflamação e reparo', min: 18 },
        ],
      },
      {
        title: 'Patologia forense',
        lessons: [
          { title: 'Necropsia pericial e coleta de amostras', min: 22 },
          { title: 'Estimativa de causa e cronotanatognose', min: 19 },
        ],
      },
    ],
  },
  {
    slug: 'pos-nefrologia',
    title: 'Pós-graduação em Nefrologia de Pequenos Animais',
    subtitle: 'Do diagnóstico precoce à terapia renal substitutiva.',
    description:
      'Formação em nefrologia e urologia: injúria renal aguda e crônica, proteinúria, distúrbios hidroeletrolíticos e diálise.',
    priceCents: 239700,
    level: 'avancado',
    specialty: 'nefrologia',
    instructor: 'dr-ricardo-mendes',
    modules: [
      {
        title: 'Avaliação renal',
        lessons: [
          { title: 'Marcadores e estadiamento IRIS', min: 16, free: true },
          { title: 'Proteinúria e hipertensão', min: 20 },
        ],
      },
      {
        title: 'Manejo',
        lessons: [
          { title: 'Injúria renal aguda', min: 22 },
          { title: 'Terapia renal substitutiva', min: 24 },
        ],
      },
    ],
  },
  {
    slug: 'hematologia-transfusional',
    title: 'Curso de Hematologia e Medicina Transfusional',
    subtitle: 'Do hemograma à bolsa de sangue.',
    description:
      'Interpretação do hemograma, principais anemias e coagulopatias, e prática segura de medicina transfusional.',
    priceCents: 99700,
    level: 'intermediario',
    specialty: 'hematologia',
    instructor: 'dra-lucia-prado',
    modules: [
      {
        title: 'Hematologia clínica',
        lessons: [
          { title: 'Interpretação do hemograma', min: 15, free: true },
          { title: 'Anemias: abordagem diagnóstica', min: 19 },
        ],
      },
      {
        title: 'Medicina transfusional',
        lessons: [
          { title: 'Tipagem, provas de compatibilidade e doadores', min: 21 },
          { title: 'Transfusão: indicações e reações', min: 18 },
        ],
      },
    ],
  },
  {
    slug: 'responsabilidade-tecnica',
    title: 'Curso de Responsabilidade Técnica Veterinária',
    subtitle: 'A RT na prática, sem insegurança.',
    description:
      'O papel do responsável técnico: legislação, documentação, boas práticas e gestão da conformidade em estabelecimentos veterinários.',
    priceCents: 79700,
    level: 'iniciante',
    specialty: 'gestao-rt',
    instructor: 'dra-ana-faria',
    modules: [
      {
        title: 'Fundamentos da RT',
        lessons: [
          { title: 'Legislação e atribuições do RT', min: 13, free: true },
          { title: 'Documentação e escrituração', min: 15 },
        ],
      },
      {
        title: 'Conformidade na prática',
        lessons: [
          { title: 'Boas práticas e biossegurança', min: 17 },
          { title: 'Fiscalização e gestão de não conformidades', min: 16 },
        ],
      },
    ],
  },
];

/** Seed de desenvolvimento idempotente (ON CONFLICT DO NOTHING por slug). */
async function main(): Promise<void> {
  const config: AppConfig = loadConfig();
  const { db, sql } = createDb(config.DATABASE_URL);

  await db
    .insert(specialties)
    .values(SPECIALTIES)
    .onConflictDoNothing({ target: specialties.slug });

  // Instrutores (upsert): cria e garante bio + foto (idempotente em re-seed).
  for (const i of INSTRUCTORS) {
    await db
      .insert(instructors)
      .values({ slug: i.slug, name: i.name, bio: i.bio })
      .onConflictDoNothing({ target: instructors.slug });
    await db
      .update(instructors)
      .set({ bio: i.bio, avatarUrl: `${config.APP_URL}/instrutores/${i.photo}` })
      .where(eq(instructors.slug, i.slug));
  }

  // Mapas slug → id para especialidades e instrutores.
  const specialtyId = new Map<string, string>();
  for (const s of await db
    .select({ id: specialties.id, slug: specialties.slug })
    .from(specialties)) {
    specialtyId.set(s.slug, s.id);
  }
  const instructorId = new Map<string, string>();
  for (const i of await db
    .select({ id: instructors.id, slug: instructors.slug })
    .from(instructors)) {
    instructorId.set(i.slug, i.id);
  }

  // Cursos + módulos + aulas.
  for (const c of COURSES) {
    const [course] = await db
      .insert(courses)
      .values({
        slug: c.slug,
        title: c.title,
        subtitle: c.subtitle,
        description: c.description,
        priceCents: c.priceCents,
        level: c.level,
        status: 'published',
        specialtyId: specialtyId.get(c.specialty) ?? null,
        instructorId: instructorId.get(c.instructor) ?? null,
        publishedAt: new Date(),
      })
      .onConflictDoNothing({ target: courses.slug })
      .returning({ id: courses.id });

    // Só popula módulos/aulas quando o curso foi criado agora (evita duplicar).
    if (!course) continue;
    let mPos = 0;
    for (const m of c.modules) {
      mPos += 1;
      const [mod] = await db
        .insert(courseModules)
        .values({ courseId: course.id, title: m.title, position: mPos })
        .returning({ id: courseModules.id });
      if (!mod) continue;
      let lPos = 0;
      for (const l of m.lessons) {
        lPos += 1;
        await db.insert(lessons).values({
          moduleId: mod.id,
          title: l.title,
          durationSeconds: l.min * 60,
          position: lPos,
          isFree: l.free ?? false,
        });
      }
    }
  }
  console.log(`Cursos: ${COURSES.length} definidos (idempotente).`);

  // Aluno demo + matrícula no primeiro curso (para testar a área do aluno).
  const [firstCourse] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.slug, COURSES[0]!.slug))
    .limit(1);

  const passwordHash = await hash('aluno12345');
  const [student] = await db
    .insert(users)
    .values({ email: 'aluno@vethis.dev', passwordHash, name: 'Aluno Demo', role: 'aluno' })
    .onConflictDoNothing({ target: users.email })
    .returning();

  const studentRow =
    student ??
    (await db.select().from(users).where(eq(users.email, 'aluno@vethis.dev')).limit(1))[0];
  if (studentRow && firstCourse) {
    await db
      .insert(enrollments)
      .values({ userId: studentRow.id, courseId: firstCourse.id, status: 'active' })
      .onConflictDoNothing({ target: [enrollments.userId, enrollments.courseId] });
    console.log('Aluno demo: aluno@vethis.dev / aluno12345 (matriculado).');
  }

  // Usuário staff para o backoffice.
  const staffHash = await hash('staff12345');
  await db
    .insert(users)
    .values({
      email: 'staff@vethis.dev',
      passwordHash: staffHash,
      name: 'Equipe Vethis',
      role: 'staff',
    })
    .onConflictDoNothing({ target: users.email });
  console.log('Staff demo: staff@vethis.dev / staff12345.');

  // Leads de exemplo para o CRM.
  await db
    .insert(leads)
    .values([
      { name: 'Clínica PetVida', email: 'contato@petvida.example', stage: 'new' },
      { name: 'Dr. Rafael Costa', email: 'rafael@example.com', stage: 'contacted' },
      { name: 'Hospital Veterinário Sul', email: 'adm@hvsul.example', stage: 'qualified' },
    ])
    .onConflictDoNothing();

  console.log('Seed concluído.');
  await sql.end();
}

main().catch((err) => {
  console.error('Falha no seed:', err);
  process.exit(1);
});
