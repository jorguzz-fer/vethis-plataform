import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * Avaliação dos criativos de anúncio (vethis.com.br/Criativos). As peças e seus
 * nomes vivem na própria página; aqui só o status, o comentário e o nome que a
 * pessoa digitou, por chave de peça. Sem login, como no plano de marketing: o
 * nome é informativo, não identidade.
 */
export const creativeReviews = pgTable('creative_reviews', {
  /** Chave estável da peça na página (ex.: `clinica-01`, `mielo-10`, `cintia-a`). */
  key: text('key').primaryKey(),
  /** `aprovado` ou `ajustes`. Sem linha = pendente. */
  status: text('status').notNull(),
  comment: text('comment').notNull().default(''),
  reviewer: text('reviewer'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type CreativeReview = typeof creativeReviews.$inferSelect;
