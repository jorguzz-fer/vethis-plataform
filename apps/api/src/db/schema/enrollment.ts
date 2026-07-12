import { pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { enrollmentStatusEnum, secretariaStatusEnum } from './enums';
import { users } from './identity';
import { courses, lessons } from './catalog';

/** Matrícula do aluno em um curso (criada pelo pagamento confirmado — ADR 0004). */
export const enrollments = pgTable(
  'enrollments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    status: enrollmentStatusEnum('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => [unique('enrollments_user_course_uq').on(t.userId, t.courseId)],
);

/** Progresso por aula (conclusão). Um registro por aluno×aula. */
export const lessonProgress = pgTable(
  'lesson_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    completedAt: timestamp('completed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('lesson_progress_user_lesson_uq').on(t.userId, t.lessonId)],
);

/** Solicitações da secretaria online (documentos, suporte). */
export const secretariaRequests = pgTable('secretaria_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  subject: text('subject').notNull(),
  body: text('body'),
  status: secretariaStatusEnum('status').notNull().default('open'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Enrollment = typeof enrollments.$inferSelect;
export type LessonProgress = typeof lessonProgress.$inferSelect;
export type SecretariaRequest = typeof secretariaRequests.$inferSelect;
