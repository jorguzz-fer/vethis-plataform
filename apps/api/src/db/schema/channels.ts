import { boolean, integer, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { channelGroupEnum } from './enums';

/**
 * Canais de aquisição do CRM. Cada canal casa com leads via `channel_rules`
 * (utm_source [+ utm_medium]). Alimenta o mapa de fluxo (`/fluxo`) com dados reais.
 */
export const channels = pgTable('channels', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  group: channelGroupEnum('group').notNull().default('organico'),
  color: text('color').notNull().default('#3E7D5F'),
  active: boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Regra de mapeamento origem→canal. Um lead casa se `lower(utm_source)` bate e,
 * se `utm_medium` estiver preenchido, também `lower(utm_medium)`. Maior `priority`
 * (e regra com medium) vence.
 */
export const channelRules = pgTable(
  'channel_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    channelId: uuid('channel_id')
      .notNull()
      .references(() => channels.id, { onDelete: 'cascade' }),
    utmSource: text('utm_source').notNull(),
    utmMedium: text('utm_medium'),
    priority: integer('priority').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('channel_rules_uq').on(t.channelId, t.utmSource, t.utmMedium)],
);

export type Channel = typeof channels.$inferSelect;
export type ChannelRule = typeof channelRules.$inferSelect;
