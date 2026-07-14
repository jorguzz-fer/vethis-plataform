import { date, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { leadStageEnum, opportunityStageEnum } from './enums';
import { attributionColumns } from './attribution';
import { users } from './identity';

/** Leads capturados no site (newsletter/contato) e geridos no CRM do backoffice. */
export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  source: text('source').notNull().default('site'),
  stage: leadStageEnum('stage').notNull().default('new'),
  notes: text('notes'),
  // Atribuição first-touch (de onde o lead veio).
  ...attributionColumns(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Timeline de interações do lead (alimentada por eventos de domínio no futuro). */
export const crmInteractions = pgTable('crm_interactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadId: uuid('lead_id')
    .notNull()
    .references(() => leads.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id').references(() => users.id, { onDelete: 'set null' }),
  note: text('note').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Oportunidades (negócios) do funil de vendas do CRM. Dinheiro em centavos. */
export const opportunities = pgTable('opportunities', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  stage: opportunityStageEnum('stage').notNull().default('prospeccao'),
  valueCents: integer('value_cents').notNull().default(0),
  probability: integer('probability').notNull().default(0),
  expectedCloseDate: date('expected_close_date', { mode: 'string' }),
  leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'set null' }),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Lead = typeof leads.$inferSelect;
export type CrmInteraction = typeof crmInteractions.$inferSelect;
export type Opportunity = typeof opportunities.$inferSelect;
