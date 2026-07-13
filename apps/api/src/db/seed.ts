import { hash } from '@node-rs/argon2';
import { eq } from 'drizzle-orm';
import { loadConfig, type AppConfig } from '../config/configuration';
import { createDb } from './client';
import { courseModules, courses, instructors, lessons, specialties } from './schema/catalog';
import { enrollments } from './schema/enrollment';
import { users } from './schema/identity';
import { leads } from './schema/crm';
import type { CourseLevel } from './schema/enums';

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

/** Corpo docente — mesmos nomes/fotos da seção "Instrutores" do site. */
const INSTRUCTORS = [
  {
    slug: 'dr-ricardo-mendes',
    name: 'Dr. Ricardo Mendes',
    bio: 'Diretor clínico e pesquisador em cardiologia de pequenos animais.',
    photo: 'ricardo-mendes.webp',
  },
  {
    slug: 'dra-ana-faria',
    name: 'Dra. Ana B. Faria',
    bio: 'Cirurgiã de tecidos moles com mais de 15 anos de centro cirúrgico.',
    photo: 'ana-faria.webp',
  },
  {
    slug: 'dr-carlos-nunes',
    name: 'Dr. Carlos Nunes',
    bio: 'Especialista em dermatoses e alergias, referência em citologia.',
    photo: 'carlos-nunes.webp',
  },
  {
    slug: 'dra-lucia-prado',
    name: 'Dra. Lúcia Prado',
    bio: 'Anestesiologista de pacientes críticos e docente de pós-graduação.',
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

/** 6 cursos veterinários de exemplo, publicados, com módulos e aulas. */
const COURSES: SeedCourse[] = [
  {
    slug: 'ecocardiografia-na-pratica',
    title: 'Ecocardiografia na Prática',
    subtitle: 'Do básico ao laudo, com casos reais.',
    description:
      'Curso prático de ecocardiografia para o clínico de pequenos animais: janelas, medidas, Doppler e construção do laudo.',
    priceCents: 149700,
    level: 'intermediario',
    specialty: 'cardiologia',
    instructor: 'dr-ricardo-mendes',
    modules: [
      {
        title: 'Fundamentos',
        lessons: [
          { title: 'Introdução e janelas acústicas', min: 12, free: true },
          { title: 'Modo B e modo M', min: 18 },
        ],
      },
      {
        title: 'Avaliação funcional',
        lessons: [
          { title: 'Doppler e avaliação de fluxos', min: 20 },
          { title: 'Medidas, índices e o laudo', min: 16 },
        ],
      },
    ],
  },
  {
    slug: 'cirurgia-tecidos-moles',
    title: 'Cirurgia de Tecidos Moles',
    subtitle: 'Técnica passo a passo em procedimentos do dia a dia.',
    description:
      'Do preparo do centro cirúrgico aos principais procedimentos de tecidos moles, com foco em técnica e segurança.',
    priceCents: 169700,
    level: 'avancado',
    specialty: 'cirurgia',
    instructor: 'dra-ana-faria',
    modules: [
      {
        title: 'Princípios',
        lessons: [
          { title: 'Instrumental e paramentação', min: 10, free: true },
          { title: 'Padrões de sutura e síntese', min: 15 },
        ],
      },
      {
        title: 'Procedimentos',
        lessons: [
          { title: 'Enterectomia e enteroanastomose', min: 24 },
          { title: 'Esplenectomia passo a passo', min: 19 },
        ],
      },
    ],
  },
  {
    slug: 'radiologia-toracica',
    title: 'Radiologia Torácica de Pequenos Animais',
    subtitle: 'Interpretação sistemática do tórax.',
    description:
      'Método de leitura do tórax: padrões pulmonares, silhueta cardíaca, mediastino e pleura, com muitos casos.',
    priceCents: 119700,
    level: 'intermediario',
    specialty: 'diagnostico-por-imagem',
    instructor: 'dr-ricardo-mendes',
    modules: [
      {
        title: 'Bases',
        lessons: [
          { title: 'Técnica radiográfica e posicionamento', min: 11, free: true },
          { title: 'Leitura sistemática do tórax', min: 17 },
        ],
      },
      {
        title: 'Padrões',
        lessons: [
          { title: 'Padrões pulmonares', min: 21 },
          { title: 'Silhueta cardíaca e vasos', min: 16 },
        ],
      },
    ],
  },
  {
    slug: 'dermatologia-clinica',
    title: 'Dermatologia Clínica: Alergias e Dermatoses',
    subtitle: 'Do prurido ao diagnóstico, sem mistério.',
    description:
      'Abordagem clínica das dermatoses mais comuns: dermatite alérgica, piodermites e o raciocínio diagnóstico.',
    priceCents: 99700,
    level: 'iniciante',
    specialty: 'dermatologia',
    instructor: 'dr-carlos-nunes',
    modules: [
      {
        title: 'Abordagem do prurido',
        lessons: [
          { title: 'Anamnese e exame dermatológico', min: 13, free: true },
          { title: 'Citologia cutânea na prática', min: 15 },
        ],
      },
      {
        title: 'Principais dermatoses',
        lessons: [
          { title: 'Dermatite alérgica e atopia', min: 20 },
          { title: 'Piodermites: diagnóstico e manejo', min: 18 },
        ],
      },
    ],
  },
  {
    slug: 'anestesia-pacientes-criticos',
    title: 'Anestesia em Pacientes Críticos',
    subtitle: 'Protocolos seguros para o paciente instável.',
    description:
      'Planejamento anestésico, monitoração e condutas para pacientes críticos e de alto risco.',
    priceCents: 139700,
    level: 'avancado',
    specialty: 'anestesiologia',
    instructor: 'dra-lucia-prado',
    modules: [
      {
        title: 'Planejamento',
        lessons: [
          { title: 'Avaliação de risco e ASA', min: 12, free: true },
          { title: 'Protocolos e fármacos', min: 19 },
        ],
      },
      {
        title: 'Monitoração',
        lessons: [
          { title: 'Monitoração multiparamétrica', min: 22 },
          { title: 'Manejo de intercorrências', min: 17 },
        ],
      },
    ],
  },
  {
    slug: 'emergencias-uti',
    title: 'Emergências e Terapia Intensiva',
    subtitle: 'Estabilização e cuidados na UTI veterinária.',
    description:
      'Triagem, ressuscitação e terapia intensiva: do atendimento inicial ao paciente na UTI.',
    priceCents: 159700,
    level: 'intermediario',
    specialty: 'emergencia-uti',
    instructor: 'dra-ana-faria',
    modules: [
      {
        title: 'Atendimento inicial',
        lessons: [
          { title: 'Triagem e ABCs da emergência', min: 14, free: true },
          { title: 'Ressuscitação e fluidoterapia', min: 20 },
        ],
      },
      {
        title: 'Terapia intensiva',
        lessons: [
          { title: 'Monitoração do paciente crítico', min: 21 },
          { title: 'Choque: reconhecimento e manejo', min: 18 },
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
