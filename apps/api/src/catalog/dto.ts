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
const instructorRefSchema = z.object({ slug: z.string(), name: z.string() }).nullable();

export const courseSummarySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  subtitle: z.string().nullable(),
  priceCents: z.number().int(),
  level: z.enum(['iniciante', 'intermediario', 'avancado']),
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
  modules: z.array(moduleSchema),
});
export type CourseDetail = z.infer<typeof courseDetailSchema>;
