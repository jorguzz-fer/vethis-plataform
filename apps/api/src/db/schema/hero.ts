import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Botão clicável sobreposto a um slide do Hero. A posição/tamanho são strings
 * CSS em % da imagem — como a imagem mantém proporção, alinha em qualquer largura.
 */
export interface HeroHotspot {
  label: string;
  href: string;
  left: string;
  top: string;
  width: string;
  height: string;
}

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
};

/** Slides do carrossel do Hero (home). Gerenciados pelo backoffice. */
export const heroSlides = pgTable('hero_slides', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** Nome interno para o admin identificar o slide. */
  title: text('title').notNull(),
  imageUrl: text('image_url').notNull(),
  alt: text('alt').notNull().default(''),
  hotspots: jsonb('hotspots').$type<HeroHotspot[]>().notNull().default([]),
  /** Menor aparece antes no carrossel. */
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
  ...timestamps,
});
