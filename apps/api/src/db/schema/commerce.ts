import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { orderStatusEnum, paymentMethodEnum, paymentStatusEnum } from './enums';
import { users } from './identity';
import { courses } from './catalog';

/**
 * Pedido de compra de um curso (ADR 0004). Dinheiro em centavos (inteiro).
 * O pagamento confirmado (webhook do gateway) promove o pedido a `paid` e
 * dispara a matrícula. Um pedido = um curso na fase 1 (order-bump depois).
 */
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  courseId: uuid('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'restrict' }),
  status: orderStatusEnum('status').notNull().default('pending'),
  amountCents: integer('amount_cents').notNull(),
  currency: text('currency').notNull().default('BRL'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  paidAt: timestamp('paid_at', { withTimezone: true }),
});

/**
 * Cobrança no gateway (port `PaymentGateway`; adapter `fake` em dev, `asaas`
 * depois). Guarda o id da cobrança no provedor e os artefatos do meio de
 * pagamento (Pix copia-e-cola / QR, URL do boleto). Nunca guarda dados de cartão.
 */
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  method: paymentMethodEnum('method').notNull(),
  status: paymentStatusEnum('status').notNull().default('pending'),
  amountCents: integer('amount_cents').notNull(),
  installments: integer('installments').notNull().default(1),
  providerChargeId: text('provider_charge_id'),
  pixQrCode: text('pix_qr_code'),
  pixCopyPaste: text('pix_copy_paste'),
  boletoUrl: text('boleto_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  paidAt: timestamp('paid_at', { withTimezone: true }),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
