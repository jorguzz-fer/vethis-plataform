import { z } from 'zod';

/** Código do cupom: 3–30 letras/números/_/-, normalizado para MAIÚSCULAS. */
export const couponCodeSchema = z
  .string()
  .trim()
  .transform((v) => v.toUpperCase())
  .pipe(
    z.string().regex(/^[A-Z0-9_-]{3,30}$/, 'Use de 3 a 30 letras, números, hífen ou sublinhado'),
  );

export const couponDiscountTypeSchema = z.enum(['percent', 'fixed']);

/** Cupom no backoffice (com os cursos em que vale e o uso). */
export const adminCouponSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  discountType: couponDiscountTypeSchema,
  /** Percentual (1–100) ou centavos, conforme `discountType`. */
  discountValue: z.number().int(),
  appliesToAllCourses: z.boolean(),
  courseIds: z.array(z.string().uuid()),
  maxUses: z.number().int().nullable(),
  usedCount: z.number().int(),
  expiresAt: z.string().nullable(),
  active: z.boolean(),
  createdAt: z.string(),
});
export type AdminCouponDto = z.infer<typeof adminCouponSchema>;

const couponFields = {
  code: couponCodeSchema,
  discountType: couponDiscountTypeSchema,
  discountValue: z.number().int().min(1),
  appliesToAllCourses: z.boolean(),
  courseIds: z.array(z.string().uuid()).max(200),
  maxUses: z.number().int().min(1).nullable(),
  /** Data (AAAA-MM-DD) ou instante ISO; o cupom vale até o fim desse dia. */
  expiresAt: z.string().nullable(),
  active: z.boolean(),
};

/** Regras comuns: percentual até 100; "cursos específicos" exige ao menos um curso. */
function checkCoupon(
  v: {
    discountType?: 'percent' | 'fixed';
    discountValue?: number;
    appliesToAllCourses?: boolean;
    courseIds?: string[];
  },
  ctx: z.RefinementCtx,
): void {
  if (v.discountType === 'percent' && (v.discountValue ?? 0) > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Percentual máximo é 100%',
      path: ['discountValue'],
    });
  }
  if (v.appliesToAllCourses === false && v.courseIds !== undefined && v.courseIds.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Escolha ao menos um curso ou marque "Todos os cursos"',
      path: ['courseIds'],
    });
  }
}

export const createCouponSchema = z
  .object({
    ...couponFields,
    appliesToAllCourses: couponFields.appliesToAllCourses.default(true),
    courseIds: couponFields.courseIds.default([]),
    maxUses: couponFields.maxUses.default(null),
    expiresAt: couponFields.expiresAt.default(null),
    active: couponFields.active.default(true),
  })
  .superRefine(checkCoupon);
export type CreateCouponDto = z.infer<typeof createCouponSchema>;

export const updateCouponSchema = z.object(couponFields).partial().superRefine(checkCoupon);
export type UpdateCouponDto = z.infer<typeof updateCouponSchema>;

/** Prévia do cupom no checkout (o servidor recalcula tudo no pagamento). */
export const couponPreviewInputSchema = z.object({
  code: z.string().trim().min(1).max(40),
  courseSlug: z.string().min(1),
  method: z.enum(['pix', 'card', 'boleto']).default('pix'),
  installments: z.coerce.number().int().min(1).max(24).default(1),
});
export type CouponPreviewInputDto = z.infer<typeof couponPreviewInputSchema>;

export const couponPreviewSchema = z.object({
  code: z.string(),
  discountType: couponDiscountTypeSchema,
  discountValue: z.number().int(),
  /** Valor do meio escolhido antes do cupom, o desconto e o valor final. */
  originalCents: z.number().int(),
  discountCents: z.number().int(),
  finalCents: z.number().int(),
});
export type CouponPreviewDto = z.infer<typeof couponPreviewSchema>;
