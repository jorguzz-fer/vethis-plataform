import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, desc, eq, isNull, sql } from 'drizzle-orm';
import { DB, type Database } from '../db/client';
import { courses } from '../db/schema/catalog';
import { enrollments } from '../db/schema/enrollment';
import { users } from '../db/schema/identity';
import { CrmService } from '../crm/crm.service';
import type { AdminCourseDto, KpisDto, StudentDto, UpdateCourseDto } from './dto';

@Injectable()
export class AdminService {
  constructor(
    @Inject(DB) private readonly db: Database,
    @Inject(CrmService) private readonly crm: CrmService,
  ) {}

  private async scalar(query: Promise<Array<{ n: number }>>): Promise<number> {
    const [row] = await query;
    return row?.n ?? 0;
  }

  async getKpis(): Promise<KpisDto> {
    const students = await this.scalar(
      this.db
        .select({ n: count() })
        .from(users)
        .where(and(eq(users.role, 'aluno'), isNull(users.deletedAt))),
    );
    const activeEnrollments = await this.scalar(
      this.db.select({ n: count() }).from(enrollments).where(eq(enrollments.status, 'active')),
    );
    const publishedCourses = await this.scalar(
      this.db
        .select({ n: count() })
        .from(courses)
        .where(and(eq(courses.status, 'published'), isNull(courses.deletedAt))),
    );
    const totalEnrollments = await this.scalar(this.db.select({ n: count() }).from(enrollments));
    const completedEnrollments = await this.scalar(
      this.db.select({ n: count() }).from(enrollments).where(eq(enrollments.status, 'completed')),
    );
    const [rev] = await this.db
      .select({ n: sql<number>`coalesce(sum(${courses.priceCents}), 0)::int` })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.status, 'active'));

    return {
      students,
      activeEnrollments,
      publishedCourses,
      completionRate:
        totalEnrollments === 0 ? 0 : Number((completedEnrollments / totalEnrollments).toFixed(2)),
      estimatedRevenueCents: rev?.n ?? 0,
      leadsByStage: await this.crm.countByStage(),
    };
  }

  async listCourses(): Promise<AdminCourseDto[]> {
    const rows = await this.db
      .select({
        id: courses.id,
        slug: courses.slug,
        title: courses.title,
        status: courses.status,
        level: courses.level,
        priceCents: courses.priceCents,
        createdAt: courses.createdAt,
      })
      .from(courses)
      .where(isNull(courses.deletedAt))
      .orderBy(desc(courses.createdAt));
    return rows.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() }));
  }

  async updateCourse(id: string, dto: UpdateCourseDto): Promise<AdminCourseDto> {
    const patch: Record<string, unknown> = { ...dto, updatedAt: new Date() };
    if (dto.status === 'published') patch.publishedAt = new Date();
    const [row] = await this.db.update(courses).set(patch).where(eq(courses.id, id)).returning({
      id: courses.id,
      slug: courses.slug,
      title: courses.title,
      status: courses.status,
      level: courses.level,
      priceCents: courses.priceCents,
      createdAt: courses.createdAt,
    });
    if (!row) throw new NotFoundException('Curso não encontrado');
    return { ...row, createdAt: row.createdAt.toISOString() };
  }

  async listStudents(): Promise<StudentDto[]> {
    const rows = await this.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
        enrollments: count(enrollments.id),
      })
      .from(users)
      .leftJoin(enrollments, eq(enrollments.userId, users.id))
      .where(and(eq(users.role, 'aluno'), isNull(users.deletedAt)))
      .groupBy(users.id)
      .orderBy(desc(users.createdAt));
    return rows.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() }));
  }
}
