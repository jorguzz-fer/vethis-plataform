import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, count, eq, desc } from 'drizzle-orm';
import { DB, type Database } from '../db/client';
import { courseModules, courses, lessons, specialties } from '../db/schema/catalog';
import { enrollments, lessonProgress, secretariaRequests } from '../db/schema/enrollment';
import type {
  CoursePlayer,
  CreateSecretariaDto,
  EnrolledCourse,
  SecretariaRequestDto,
} from './dto';

@Injectable()
export class MeService {
  constructor(@Inject(DB) private readonly db: Database) {}

  private async countLessons(courseId: string): Promise<number> {
    const [row] = await this.db
      .select({ n: count() })
      .from(lessons)
      .innerJoin(courseModules, eq(lessons.moduleId, courseModules.id))
      .where(eq(courseModules.courseId, courseId));
    return row?.n ?? 0;
  }

  private async countCompleted(userId: string, courseId: string): Promise<number> {
    const [row] = await this.db
      .select({ n: count() })
      .from(lessonProgress)
      .innerJoin(lessons, eq(lessonProgress.lessonId, lessons.id))
      .innerJoin(courseModules, eq(lessons.moduleId, courseModules.id))
      .where(and(eq(courseModules.courseId, courseId), eq(lessonProgress.userId, userId)));
    return row?.n ?? 0;
  }

  async listMyCourses(userId: string): Promise<EnrolledCourse[]> {
    const rows = await this.db
      .select({
        id: courses.id,
        slug: courses.slug,
        title: courses.title,
        coverUrl: courses.coverUrl,
        specialtySlug: specialties.slug,
        specialtyName: specialties.name,
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .leftJoin(specialties, eq(courses.specialtyId, specialties.id))
      .where(eq(enrollments.userId, userId))
      .orderBy(asc(courses.title));

    return Promise.all(
      rows.map(async (c) => {
        const total = await this.countLessons(c.id);
        const completed = await this.countCompleted(userId, c.id);
        const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
        return {
          id: c.id,
          slug: c.slug,
          title: c.title,
          coverUrl: c.coverUrl,
          specialty:
            c.specialtySlug && c.specialtyName
              ? { slug: c.specialtySlug, name: c.specialtyName }
              : null,
          progress: { completed, total, pct },
        };
      }),
    );
  }

  async getCoursePlayer(userId: string, slug: string): Promise<CoursePlayer> {
    const [course] = await this.db
      .select({
        id: courses.id,
        slug: courses.slug,
        title: courses.title,
        subtitle: courses.subtitle,
      })
      .from(courses)
      .where(eq(courses.slug, slug))
      .limit(1);
    if (!course) throw new NotFoundException('Curso não encontrado');

    await this.assertEnrolled(userId, course.id);

    const mods = await this.db
      .select({
        id: courseModules.id,
        title: courseModules.title,
        position: courseModules.position,
      })
      .from(courseModules)
      .where(eq(courseModules.courseId, course.id))
      .orderBy(asc(courseModules.position));

    const completedRows = await this.db
      .select({ lessonId: lessonProgress.lessonId })
      .from(lessonProgress)
      .where(eq(lessonProgress.userId, userId));
    const completedSet = new Set(completedRows.map((r) => r.lessonId));

    const modules = await Promise.all(
      mods.map(async (m) => {
        const ls = await this.db
          .select({
            id: lessons.id,
            title: lessons.title,
            durationSeconds: lessons.durationSeconds,
            vimeoVideoId: lessons.vimeoVideoId,
          })
          .from(lessons)
          .where(eq(lessons.moduleId, m.id))
          .orderBy(asc(lessons.position));
        return {
          id: m.id,
          title: m.title,
          position: m.position,
          lessons: ls.map((l) => ({ ...l, completed: completedSet.has(l.id) })),
        };
      }),
    );

    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      subtitle: course.subtitle,
      modules,
    };
  }

  async completeLesson(userId: string, lessonId: string): Promise<{ ok: true }> {
    const [row] = await this.db
      .select({ courseId: courseModules.courseId })
      .from(lessons)
      .innerJoin(courseModules, eq(lessons.moduleId, courseModules.id))
      .where(eq(lessons.id, lessonId))
      .limit(1);
    if (!row) throw new NotFoundException('Aula não encontrada');

    await this.assertEnrolled(userId, row.courseId);

    await this.db
      .insert(lessonProgress)
      .values({ userId, lessonId })
      .onConflictDoNothing({ target: [lessonProgress.userId, lessonProgress.lessonId] });
    return { ok: true };
  }

  async listSecretaria(userId: string): Promise<SecretariaRequestDto[]> {
    const rows = await this.db
      .select()
      .from(secretariaRequests)
      .where(eq(secretariaRequests.userId, userId))
      .orderBy(desc(secretariaRequests.createdAt));
    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      subject: r.subject,
      body: r.body,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async createSecretaria(userId: string, dto: CreateSecretariaDto): Promise<SecretariaRequestDto> {
    const [r] = await this.db
      .insert(secretariaRequests)
      .values({ userId, type: dto.type, subject: dto.subject, body: dto.body })
      .returning();
    if (!r) throw new NotFoundException('Falha ao criar solicitação');
    return {
      id: r.id,
      type: r.type,
      subject: r.subject,
      body: r.body,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    };
  }

  private async assertEnrolled(userId: string, courseId: string): Promise<void> {
    const [enr] = await this.db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.userId, userId),
          eq(enrollments.courseId, courseId),
          eq(enrollments.status, 'active'),
        ),
      )
      .limit(1);
    if (!enr) throw new ForbiddenException('Você não está matriculado neste curso');
  }
}
