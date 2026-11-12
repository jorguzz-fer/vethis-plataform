import { sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { couponDiscountTypeEnum } from './enums';
import { courses } from './catalog';

/**
 * Cupom de desconto aplicado no checkout. O código é guardado em MAIÚSCULAS
 * (comparação sem diferença de caixa). `discountValue` é o percentual (1–100)
 * ou o valor fixo em centavos, conforme `discountType`. Vale para todos os
 * cursos (`appliesToAllCourses`) ou só para os de `coupon_courses`.
 */
export const coupons = pgTable(
  'coupons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull(),
    discountType: couponDiscountTypeEnum('discount_type').notNull(),
    discountValue: integer('discount_value').notNull(),
    appliesToAllCourses: boolean('applies_to_all_courses').notNull().default(true),
    /** Limite de usos (pedidos pagos). Nulo = ilimitado. */
    maxUses: integer('max_uses'),
    /** Pedidos pagos com o cupom (incrementado na confirmação do pagamento). */
    usedCount: integer('used_count').notNull().default(0),
    /** Válido até este instante (inclusive). Nulo = sem expiração. */
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    // Um código vivo por vez; excluídos (soft-delete) liberam o código.
    uniqueIndex('coupons_code_live_uq')
      .on(t.code)
      .where(sql`${t.deletedAt} is null`),
  ],
);

/** Cursos em que um cupom vale (quando não vale para todos). */
export const couponCourses = pgTable(
  'coupon_courses',
  {
    couponId: uuid('coupon_id')
      .notNull()
      .references(() => coupons.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.couponId, t.courseId] })],
);

export type Coupon = typeof coupons.$inferSelect;
