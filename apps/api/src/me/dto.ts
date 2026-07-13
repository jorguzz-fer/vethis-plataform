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
  instructor: z.object({ name: z.string(), avatarUrl: z.string().nullable() }).nullable(),
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

/** Perfil do aluno (dados da conta). */
export const profileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: z.enum(['aluno', 'staff', 'admin']),
  createdAt: z.string(),
});
export type ProfileDto = z.infer<typeof profileSchema>;

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(120),
});
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'A nova senha deve ter ao menos 8 caracteres').max(200),
});
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;

/** Dados do certificado de conclusão (emitido só quando o curso é 100% concluído). */
export const certificateSchema = z.object({
  studentName: z.string(),
  courseTitle: z.string(),
  courseSlug: z.string(),
  instructorName: z.string().nullable(),
  lessonsTotal: z.number().int(),
  completedAt: z.string(),
});
export type CertificateDto = z.infer<typeof certificateSchema>;
