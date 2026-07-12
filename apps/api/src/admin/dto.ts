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

export const updateCourseSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    subtitle: z.string().max(300).optional(),
    description: z.string().max(8000).optional(),
    priceCents: z.number().int().nonnegative().optional(),
    level: z.enum(levelValues).optional(),
    status: z.enum(statusValues).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nada para atualizar' });
export type UpdateCourseDto = z.infer<typeof updateCourseSchema>;

export const studentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().nullable(),
  email: z.string(),
  enrollments: z.number().int(),
  createdAt: z.string(),
});
export type StudentDto = z.infer<typeof studentSchema>;
