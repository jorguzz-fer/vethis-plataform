import { z } from 'zod';

/** Chave da peça: minúsculas, dígitos e hífen (ex.: `clinica-01`, `cintia-a`). */
export const creativeReviewKeySchema = z
  .string()
  .regex(/^[a-z0-9-]{2,40}$/, 'Chave de peça inválida');

export const creativeReviewStatusSchema = z.enum(['aprovado', 'ajustes']);

export const creativeReviewSchema = z.object({
  key: creativeReviewKeySchema,
  status: creativeReviewStatusSchema,
  comment: z.string(),
  reviewer: z.string().nullable(),
  updatedAt: z.string().datetime(),
});
export type CreativeReviewDto = z.infer<typeof creativeReviewSchema>;

export const creativeReviewsSchema = z.object({
  reviews: z.array(creativeReviewSchema),
});
export type CreativeReviewsDto = z.infer<typeof creativeReviewsSchema>;

export const setCreativeReviewSchema = z
  .object({
    status: creativeReviewStatusSchema,
    comment: z.string().trim().max(2000).default(''),
    reviewer: z.string().trim().max(60).optional(),
  })
  .refine((v) => v.status !== 'ajustes' || v.comment.length > 0, {
    message: 'Descreva o ajuste no comentário',
    path: ['comment'],
  });
export type SetCreativeReviewDto = z.infer<typeof setCreativeReviewSchema>;
