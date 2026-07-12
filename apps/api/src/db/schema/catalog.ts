import { boolean, integer, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { courseLevelEnum, courseStatusEnum } from './enums';

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
};

/** Especialidades clínicas (trilhas). Ex.: Cardiologia, Cirurgia, Dermatologia. */
export const specialties = pgTable('specialties', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon'),
  ...timestamps,
});

/** Instrutores / corpo docente. */
export const instructors = pgTable('instructors', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  ...timestamps,
});

/** Cursos. Preço em centavos (inteiro). Soft-delete em entidade comercial. */
export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  description: text('description'),
  priceCents: integer('price_cents').notNull().default(0),
  level: courseLevelEnum('level').notNull().default('iniciante'),
  status: courseStatusEnum('status').notNull().default('draft'),
  coverUrl: text('cover_url'),
  specialtyId: uuid('specialty_id').references(() => specialties.id, { onDelete: 'set null' }),
  instructorId: uuid('instructor_id').references(() => instructors.id, { onDelete: 'set null' }),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  ...timestamps,
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

/** Módulos do curso (agrupam aulas), ordenados por `position`. */
export const courseModules = pgTable(
  'course_modules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    position: integer('position').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('course_modules_course_position_uq').on(t.courseId, t.position)],
);

/** Aulas. Guardam apenas o `vimeo_video_id` (ADR 0005); `isFree` = preview. */
export const lessons = pgTable(
  'lessons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    moduleId: uuid('module_id')
      .notNull()
      .references(() => courseModules.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    vimeoVideoId: text('vimeo_video_id'),
    durationSeconds: integer('duration_seconds').notNull().default(0),
    position: integer('position').notNull().default(0),
    isFree: boolean('is_free').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('lessons_module_position_uq').on(t.moduleId, t.position)],
);

export type Specialty = typeof specialties.$inferSelect;
export type Instructor = typeof instructors.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type CourseModule = typeof courseModules.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
