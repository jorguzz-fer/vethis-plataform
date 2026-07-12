import { z } from 'zod';

export const enrolledCourseSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  coverUrl: z.string().nullable(),
  specialty: z.object({ slug: z.string(), name: z.string() }).nullable(),
  progress: z.object({
    completed: z.number().int(),
    total: z.number().int(),
    pct: z.number().int(),
  }),
});
export type EnrolledCourse = z.infer<typeof enrolledCourseSchema>;

/** Aula na área do aluno: inclui `vimeoVideoId` (acesso liberado por matrícula). */
export const playerLessonSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  durationSeconds: z.number().int(),
  vimeoVideoId: z.string().nullable(),
  completed: z.boolean(),
});

export const playerModuleSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  position: z.number().int(),
  lessons: z.array(playerLessonSchema),
});

export const coursePlayerSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  subtitle: z.string().nullable(),
  modules: z.array(playerModuleSchema),
});
export type CoursePlayer = z.infer<typeof coursePlayerSchema>;

export const secretariaRequestSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  subject: z.string(),
  body: z.string().nullable(),
  status: z.enum(['open', 'in_progress', 'resolved']),
  createdAt: z.string(),
});
export type SecretariaRequestDto = z.infer<typeof secretariaRequestSchema>;

export const createSecretariaSchema = z.object({
  type: z.string().min(1).max(60),
  subject: z.string().min(1).max(160),
  body: z.string().max(4000).optional(),
});
export type CreateSecretariaDto = z.infer<typeof createSecretariaSchema>;
