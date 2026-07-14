import { z } from 'zod';

const levelValues = ['iniciante', 'intermediario', 'avancado'] as const;
const statusValues = ['draft', 'published'] as const;

export const kpisSchema = z.object({
  students: z.number().int(),
  activeEnrollments: z.number().int(),
  publishedCourses: z.number().int(),
  completionRate: z.number(),
  estimatedRevenueCents: z.number().int(),
  leadsByStage: z.object({
    new: z.number().int(),
    contacted: z.number().int(),
    qualified: z.number().int(),
    won: z.number().int(),
    lost: z.number().int(),
  }),
});
export type KpisDto = z.infer<typeof kpisSchema>;

export const adminCourseSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  status: z.enum(statusValues),
  level: z.enum(levelValues),
  priceCents: z.number().int(),
  createdAt: z.string(),
});
export type AdminCourseDto = z.infer<typeof adminCourseSchema>;

const roleValues = ['aluno', 'staff', 'admin'] as const;

/** Campos comuns de curso (criação/edição). Slug opcional: gerado do título. */
const courseFieldsSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hífens')
    .optional(),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(300).nullable().optional(),
  description: z.string().max(8000).nullable().optional(),
  priceCents: z.number().int().nonnegative().default(0),
  level: z.enum(levelValues).default('iniciante'),
  status: z.enum(statusValues).default('draft'),
  coverUrl: z.string().url().max(1000).nullable().optional(),
  specialtyId: z.string().uuid().nullable().optional(),
  instructorId: z.string().uuid().nullable().optional(),
});
export const createCourseSchema = courseFieldsSchema;
export type CreateCourseDto = z.infer<typeof createCourseSchema>;

/** Edição: todos os campos opcionais e sem defaults (para o contrato refletir isso). */
export const updateCourseSchema = z
  .object({
    slug: z
      .string()
      .min(1)
      .max(120)
      .regex(/^[a-z0-9-]+$/)
      .optional(),
    title: z.string().min(1).max(200).optional(),
    subtitle: z.string().max(300).nullable().optional(),
    description: z.string().max(8000).nullable().optional(),
    priceCents: z.number().int().nonnegative().optional(),
    level: z.enum(levelValues).optional(),
    status: z.enum(statusValues).optional(),
    coverUrl: z.string().url().max(1000).nullable().optional(),
    specialtyId: z.string().uuid().nullable().optional(),
    instructorId: z.string().uuid().nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nada para atualizar' });
export type UpdateCourseDto = z.infer<typeof updateCourseSchema>;

/** Aula na visão do admin (inclui vimeo_video_id). */
export const adminLessonSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  durationSeconds: z.number().int(),
  vimeoVideoId: z.string().nullable(),
  position: z.number().int(),
  isFree: z.boolean(),
});
export type AdminLessonDto = z.infer<typeof adminLessonSchema>;

export const adminModuleSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  position: z.number().int(),
  lessons: z.array(adminLessonSchema),
});
export type AdminModuleDto = z.infer<typeof adminModuleSchema>;

/** Detalhe do curso para o editor: metadados completos + módulos + aulas. */
export const adminCourseDetailSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  subtitle: z.string().nullable(),
  description: z.string().nullable(),
  priceCents: z.number().int(),
  level: z.enum(levelValues),
  status: z.enum(statusValues),
  coverUrl: z.string().nullable(),
  specialtyId: z.string().uuid().nullable(),
  instructorId: z.string().uuid().nullable(),
  modules: z.array(adminModuleSchema),
});
export type AdminCourseDetailDto = z.infer<typeof adminCourseDetailSchema>;

export const createModuleSchema = z.object({
  title: z.string().min(1).max(200),
});
export type CreateModuleDto = z.infer<typeof createModuleSchema>;

export const updateModuleSchema = z.object({ title: z.string().min(1).max(200) });
export type UpdateModuleDto = z.infer<typeof updateModuleSchema>;

export const createLessonSchema = z.object({
  title: z.string().min(1).max(200),
  durationSeconds: z.number().int().nonnegative().default(0),
  vimeoVideoId: z.string().max(60).nullable().optional(),
  isFree: z.boolean().default(false),
});
export type CreateLessonDto = z.infer<typeof createLessonSchema>;

export const updateLessonSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    durationSeconds: z.number().int().nonnegative().optional(),
    vimeoVideoId: z.string().max(60).nullable().optional(),
    isFree: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nada para atualizar' });
export type UpdateLessonDto = z.infer<typeof updateLessonSchema>;

/** Instrutores (docente) — para o seletor do curso e gestão. */
export const instructorSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  bio: z.string().nullable(),
  avatarUrl: z.string().nullable(),
});
export type InstructorDto = z.infer<typeof instructorSchema>;

export const createInstructorSchema = z.object({
  name: z.string().min(2).max(160),
  bio: z.string().max(2000).nullable().optional(),
  avatarUrl: z.string().url().max(1000).nullable().optional(),
});
export type CreateInstructorDto = z.infer<typeof createInstructorSchema>;

export const studentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().nullable(),
  email: z.string(),
  enrollments: z.number().int(),
  createdAt: z.string(),
});
export type StudentDto = z.infer<typeof studentSchema>;

/** Usuário na visão do admin (todos os papéis). */
export const adminUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string(),
  name: z.string().nullable(),
  role: z.enum(roleValues),
  enrollments: z.number().int(),
  createdAt: z.string(),
});
export type AdminUserDto = z.infer<typeof adminUserSchema>;

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(120).nullable().optional(),
  role: z.enum(roleValues).default('aluno'),
  password: z.string().min(8).max(200),
});
export type CreateUserDto = z.infer<typeof createUserSchema>;

export const updateUserSchema = z
  .object({
    name: z.string().min(2).max(120).nullable().optional(),
    role: z.enum(roleValues).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nada para atualizar' });
export type UpdateUserDto = z.infer<typeof updateUserSchema>;

export const resetPasswordSchema = z.object({ newPassword: z.string().min(8).max(200) });
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;

/** Matrícula de um usuário na visão do admin. */
export const adminEnrollmentSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string(),
  slug: z.string(),
  status: z.enum(['active', 'completed', 'cancelled']),
  createdAt: z.string(),
});
export type AdminEnrollmentDto = z.infer<typeof adminEnrollmentSchema>;

export const enrollUserSchema = z.object({ courseId: z.string().uuid() });
export type EnrollUserDto = z.infer<typeof enrollUserSchema>;
