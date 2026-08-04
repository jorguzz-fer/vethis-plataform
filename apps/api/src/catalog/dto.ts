import { z } from 'zod';

/** Filtros de listagem de cursos (query string). */
export const listCoursesQuerySchema = z.object({
  specialty: z.string().min(1).optional(),
  level: z.enum(['iniciante', 'intermediario', 'avancado']).optional(),
});
export type ListCoursesQuery = z.infer<typeof listCoursesQuerySchema>;

export const specialtySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  icon: z.string().nullable(),
});

const specialtyRefSchema = z.object({ slug: z.string(), name: z.string() }).nullable();
const instructorRefSchema = z
  .object({
    slug: z.string(),
    name: z.string(),
    bio: z.string().nullable(),
    avatarUrl: z.string().nullable(),
  })
  .nullable();

/** Item de FAQ do curso (compartilhado por validação + contrato). */
export const courseFaqItemSchema = z.object({
  question: z.string().min(1).max(300),
  answer: z.string().min(1).max(2000),
});
export type CourseFaqItem = z.infer<typeof courseFaqItemSchema>;

export const courseSummarySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  subtitle: z.string().nullable(),
  priceCents: z.number().int(),
  level: z.enum(['iniciante', 'intermediario', 'avancado']),
  comingSoon: z.boolean(),
  coverUrl: z.string().nullable(),
  specialty: specialtyRefSchema,
  instructor: instructorRefSchema,
});
export type CourseSummary = z.infer<typeof courseSummarySchema>;

/** Aula na visão pública: sem `vimeoVideoId` (só liberado na área do aluno). */
export const lessonPublicSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  durationSeconds: z.number().int(),
  isFree: z.boolean(),
});

export const moduleSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  position: z.number().int(),
  lessons: z.array(lessonPublicSchema),
});

export const courseDetailSchema = courseSummarySchema.extend({
  description: z.string().nullable(),
  workloadHours: z.number().int().nullable(),
  learningObjectives: z.array(z.string()),
  faq: z.array(courseFaqItemSchema),
  modules: z.array(moduleSchema),
});
export type CourseDetail = z.infer<typeof courseDetailSchema>;

/** Botão clicável sobreposto a um slide do Hero (posição/tamanho em % da imagem). */
export const heroHotspotSchema = z.object({
  label: z.string(),
  href: z.string(),
  left: z.string(),
  top: z.string(),
  width: z.string(),
  height: z.string(),
});
export type HeroHotspot = z.infer<typeof heroHotspotSchema>;

/** Slide do carrossel do Hero na visão pública (site). */
export const heroSlideSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  imageUrl: z.string(),
  alt: z.string(),
  hotspots: z.array(heroHotspotSchema),
  sortOrder: z.number().int(),
});
export type HeroSlide = z.infer<typeof heroSlideSchema>;
