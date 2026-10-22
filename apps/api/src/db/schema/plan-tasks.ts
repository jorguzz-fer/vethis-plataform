import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * Estado das tarefas do plano de marketing (vethis.com.br/plano-mkt). A lista de
 * tarefas, textos e prazos vive na própria página; aqui só o "feito" por chave,
 * compartilhado entre quem abre a página. Sem identidade: ninguém faz login para
 * marcar (decisão do time de marketing).
 */
export const planTasks = pgTable('plan_tasks', {
  /** Chave estável da tarefa na página (ex.: `f1-01`, `pauta-3`, `semana-rafa`). */
  key: text('key').primaryKey(),
  done: boolean('done').notNull().default(false),
  doneAt: timestamp('done_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type PlanTask = typeof planTasks.$inferSelect;
