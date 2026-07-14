import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, count, desc, eq, gte, isNull, max, sql } from 'drizzle-orm';
import { DB, type Database } from '../db/client';
import { courseModules, courses, instructors, lessons } from '../db/schema/catalog';
import { enrollments } from '../db/schema/enrollment';
import { opportunities } from '../db/schema/crm';
import { users } from '../db/schema/identity';
import { CrmService } from '../crm/crm.service';
import { PasswordService } from '../auth/password.service';
import type {
  AdminCourseDetailDto,
  AdminCourseDto,
  AdminEnrollmentDto,
  AdminUserDto,
  CreateCourseDto,
  CreateInstructorDto,
  CreateLessonDto,
  CreateModuleDto,
  CreateUserDto,
  InstructorDto,
  KpisDto,
  MonthlyKpiDto,
  ResetPasswordDto,
  StudentDto,
  UpdateCourseDto,
  UpdateLessonDto,
  UpdateModuleDto,
  UpdateUserDto,
} from './dto';

/** Slug estável a partir de um texto (sem acentos, minúsculo, hifenizado). */
function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 120);
}

@Injectable()
export class AdminService {
  constructor(
    @Inject(DB) private readonly db: Database,
    @Inject(CrmService) private readonly crm: CrmService,
    @Inject(PasswordService) private readonly passwords: PasswordService,
  ) {}

  /** Garante um slug único na tabela `courses` (acrescenta -2, -3… se preciso). */
  private async uniqueCourseSlug(base: string): Promise<string> {
    const root = slugify(base) || 'curso';
    let candidate = root;
    for (let i = 2; i < 100; i += 1) {
      const [hit] = await this.db
        .select({ id: courses.id })
        .from(courses)
        .where(eq(courses.slug, candidate))
        .limit(1);
      if (!hit) return candidate;
      candidate = `${root}-${i}`;
    }
    return `${root}-${Date.now()}`;
  }

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

  /** Série mensal dos últimos 6 meses: matrículas e receita estimada por mês. */
  async getMonthlyKpis(): Promise<MonthlyKpiDto[]> {
    const MONTHS_PT = [
      'jan',
      'fev',
      'mar',
      'abr',
      'mai',
      'jun',
      'jul',
      'ago',
      'set',
      'out',
      'nov',
      'dez',
    ];
    const now = new Date();
    const buckets = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - i), 1));
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      return { key, label: MONTHS_PT[d.getUTCMonth()]! };
    });
    const cutoff = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));

    const rows = await this.db
      .select({
        ym: sql<string>`to_char(${enrollments.createdAt}, 'YYYY-MM')`,
        enrollments: sql<number>`count(*)::int`,
        revenue: sql<number>`coalesce(sum(${courses.priceCents}), 0)::int`,
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(gte(enrollments.createdAt, cutoff))
      .groupBy(sql`to_char(${enrollments.createdAt}, 'YYYY-MM')`);

    const wonRows = await this.db
      .select({
        ym: sql<string>`to_char(${opportunities.updatedAt}, 'YYYY-MM')`,
        won: sql<number>`coalesce(sum(${opportunities.valueCents}), 0)::int`,
      })
      .from(opportunities)
      .where(and(eq(opportunities.stage, 'ganho'), gte(opportunities.updatedAt, cutoff)))
      .groupBy(sql`to_char(${opportunities.updatedAt}, 'YYYY-MM')`);

    const byKey = new Map(rows.map((r) => [r.ym, r]));
    const wonByKey = new Map(wonRows.map((r) => [r.ym, r]));
    return buckets.map((b) => ({
      month: b.key,
      label: b.label,
      enrollments: byKey.get(b.key)?.enrollments ?? 0,
      revenueCents: byKey.get(b.key)?.revenue ?? 0,
      wonCents: wonByKey.get(b.key)?.won ?? 0,
    }));
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

  /* ---------------- Cursos: autoria (metadados + módulos + aulas) ---------- */

  async getCourseDetail(id: string): Promise<AdminCourseDetailDto> {
    const [c] = await this.db
      .select()
      .from(courses)
      .where(and(eq(courses.id, id), isNull(courses.deletedAt)))
      .limit(1);
    if (!c) throw new NotFoundException('Curso não encontrado');

    const mods = await this.db
      .select({
        id: courseModules.id,
        title: courseModules.title,
        position: courseModules.position,
      })
      .from(courseModules)
      .where(eq(courseModules.courseId, id))
      .orderBy(asc(courseModules.position));

    const modules = await Promise.all(
      mods.map(async (m) => {
        const ls = await this.db
          .select({
            id: lessons.id,
            title: lessons.title,
            durationSeconds: lessons.durationSeconds,
            vimeoVideoId: lessons.vimeoVideoId,
            position: lessons.position,
            isFree: lessons.isFree,
          })
          .from(lessons)
          .where(eq(lessons.moduleId, m.id))
          .orderBy(asc(lessons.position));
        return { ...m, lessons: ls };
      }),
    );

    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      subtitle: c.subtitle,
      description: c.description,
      priceCents: c.priceCents,
      level: c.level,
      status: c.status,
      coverUrl: c.coverUrl,
      specialtyId: c.specialtyId,
      instructorId: c.instructorId,
      modules,
    };
  }

  async createCourse(dto: CreateCourseDto): Promise<AdminCourseDetailDto> {
    const slug = await this.uniqueCourseSlug(dto.slug ?? dto.title);
    const [row] = await this.db
      .insert(courses)
      .values({
        slug,
        title: dto.title,
        subtitle: dto.subtitle ?? null,
        description: dto.description ?? null,
        priceCents: dto.priceCents,
        level: dto.level,
        status: dto.status,
        coverUrl: dto.coverUrl ?? null,
        specialtyId: dto.specialtyId ?? null,
        instructorId: dto.instructorId ?? null,
        publishedAt: dto.status === 'published' ? new Date() : null,
      })
      .returning({ id: courses.id });
    if (!row) throw new ConflictException('Falha ao criar curso');
    return this.getCourseDetail(row.id);
  }

  async deleteCourse(id: string): Promise<{ ok: true }> {
    const [row] = await this.db
      .update(courses)
      .set({ deletedAt: new Date(), status: 'draft', updatedAt: new Date() })
      .where(and(eq(courses.id, id), isNull(courses.deletedAt)))
      .returning({ id: courses.id });
    if (!row) throw new NotFoundException('Curso não encontrado');
    return { ok: true };
  }

  async createModule(courseId: string, dto: CreateModuleDto): Promise<AdminCourseDetailDto> {
    const [c] = await this.db
      .select({ id: courses.id })
      .from(courses)
      .where(and(eq(courses.id, courseId), isNull(courses.deletedAt)))
      .limit(1);
    if (!c) throw new NotFoundException('Curso não encontrado');

    const [{ n } = { n: 0 }] = await this.db
      .select({ n: max(courseModules.position) })
      .from(courseModules)
      .where(eq(courseModules.courseId, courseId));
    await this.db
      .insert(courseModules)
      .values({ courseId, title: dto.title, position: (n ?? 0) + 1 });
    return this.getCourseDetail(courseId);
  }

  async updateModule(id: string, dto: UpdateModuleDto): Promise<AdminCourseDetailDto> {
    const [row] = await this.db
      .update(courseModules)
      .set({ title: dto.title })
      .where(eq(courseModules.id, id))
      .returning({ courseId: courseModules.courseId });
    if (!row) throw new NotFoundException('Módulo não encontrado');
    return this.getCourseDetail(row.courseId);
  }

  async deleteModule(id: string): Promise<AdminCourseDetailDto> {
    const [row] = await this.db
      .delete(courseModules)
      .where(eq(courseModules.id, id))
      .returning({ courseId: courseModules.courseId });
    if (!row) throw new NotFoundException('Módulo não encontrado');
    return this.getCourseDetail(row.courseId);
  }

  private async courseIdOfModule(moduleId: string): Promise<string> {
    const [m] = await this.db
      .select({ courseId: courseModules.courseId })
      .from(courseModules)
      .where(eq(courseModules.id, moduleId))
      .limit(1);
    if (!m) throw new NotFoundException('Módulo não encontrado');
    return m.courseId;
  }

  async createLesson(moduleId: string, dto: CreateLessonDto): Promise<AdminCourseDetailDto> {
    const courseId = await this.courseIdOfModule(moduleId);
    const [{ n } = { n: 0 }] = await this.db
      .select({ n: max(lessons.position) })
      .from(lessons)
      .where(eq(lessons.moduleId, moduleId));
    await this.db.insert(lessons).values({
      moduleId,
      title: dto.title,
      durationSeconds: dto.durationSeconds,
      vimeoVideoId: dto.vimeoVideoId ?? null,
      isFree: dto.isFree,
      position: (n ?? 0) + 1,
    });
    return this.getCourseDetail(courseId);
  }

  async updateLesson(id: string, dto: UpdateLessonDto): Promise<AdminCourseDetailDto> {
    const patch: Record<string, unknown> = {};
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.durationSeconds !== undefined) patch.durationSeconds = dto.durationSeconds;
    if (dto.vimeoVideoId !== undefined) patch.vimeoVideoId = dto.vimeoVideoId;
    if (dto.isFree !== undefined) patch.isFree = dto.isFree;
    const [row] = await this.db
      .update(lessons)
      .set(patch)
      .where(eq(lessons.id, id))
      .returning({ moduleId: lessons.moduleId });
    if (!row) throw new NotFoundException('Aula não encontrada');
    return this.getCourseDetail(await this.courseIdOfModule(row.moduleId));
  }

  async deleteLesson(id: string): Promise<AdminCourseDetailDto> {
    const [row] = await this.db
      .delete(lessons)
      .where(eq(lessons.id, id))
      .returning({ moduleId: lessons.moduleId });
    if (!row) throw new NotFoundException('Aula não encontrada');
    return this.getCourseDetail(await this.courseIdOfModule(row.moduleId));
  }

  /* ---------------- Instrutores (docente) --------------------------------- */

  async listInstructors(): Promise<InstructorDto[]> {
    return this.db
      .select({
        id: instructors.id,
        slug: instructors.slug,
        name: instructors.name,
        bio: instructors.bio,
        avatarUrl: instructors.avatarUrl,
      })
      .from(instructors)
      .orderBy(asc(instructors.name));
  }

  async createInstructor(dto: CreateInstructorDto): Promise<InstructorDto> {
    let slug = slugify(dto.name) || 'instrutor';
    const [hit] = await this.db
      .select({ id: instructors.id })
      .from(instructors)
      .where(eq(instructors.slug, slug))
      .limit(1);
    if (hit) slug = `${slug}-${Date.now()}`;
    const [row] = await this.db
      .insert(instructors)
      .values({ slug, name: dto.name, bio: dto.bio ?? null, avatarUrl: dto.avatarUrl ?? null })
      .returning({
        id: instructors.id,
        slug: instructors.slug,
        name: instructors.name,
        bio: instructors.bio,
        avatarUrl: instructors.avatarUrl,
      });
    return row!;
  }

  /* ---------------- Usuários (CRUD + reset de senha) ---------------------- */

  async listUsers(): Promise<AdminUserDto[]> {
    const rows = await this.db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
        enrollments: count(enrollments.id),
      })
      .from(users)
      .leftJoin(enrollments, eq(enrollments.userId, users.id))
      .where(isNull(users.deletedAt))
      .groupBy(users.id)
      .orderBy(desc(users.createdAt));
    return rows.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }));
  }

  async createUser(dto: CreateUserDto): Promise<AdminUserDto> {
    const email = dto.email.toLowerCase();
    const [existing] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing) throw new ConflictException('E-mail já cadastrado');
    const passwordHash = await this.passwords.hash(dto.password);
    const [row] = await this.db
      .insert(users)
      .values({ email, name: dto.name ?? null, role: dto.role, passwordHash })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
      });
    return { ...row!, enrollments: 0, createdAt: row!.createdAt.toISOString() };
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<AdminUserDto> {
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.role !== undefined) patch.role = dto.role;
    const [row] = await this.db
      .update(users)
      .set(patch)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .returning({ id: users.id });
    if (!row) throw new NotFoundException('Usuário não encontrado');
    return this.getUser(id);
  }

  async resetPassword(id: string, dto: ResetPasswordDto): Promise<{ ok: true }> {
    const passwordHash = await this.passwords.hash(dto.newPassword);
    const [row] = await this.db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .returning({ id: users.id });
    if (!row) throw new NotFoundException('Usuário não encontrado');
    return { ok: true };
  }

  async deactivateUser(id: string): Promise<{ ok: true }> {
    const [row] = await this.db
      .update(users)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .returning({ id: users.id });
    if (!row) throw new NotFoundException('Usuário não encontrado');
    return { ok: true };
  }

  /* ---------------- Matrículas manuais (admin) ---------------------------- */

  async listUserEnrollments(userId: string): Promise<AdminEnrollmentDto[]> {
    const rows = await this.db
      .select({
        courseId: courses.id,
        title: courses.title,
        slug: courses.slug,
        status: enrollments.status,
        createdAt: enrollments.createdAt,
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.userId, userId))
      .orderBy(asc(courses.title));
    return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
  }

  async enrollUser(userId: string, courseId: string): Promise<AdminEnrollmentDto[]> {
    const [u] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1);
    if (!u) throw new NotFoundException('Usuário não encontrado');
    const [c] = await this.db
      .select({ id: courses.id })
      .from(courses)
      .where(and(eq(courses.id, courseId), isNull(courses.deletedAt)))
      .limit(1);
    if (!c) throw new NotFoundException('Curso não encontrado');

    await this.db
      .insert(enrollments)
      .values({ userId, courseId, status: 'active' })
      .onConflictDoNothing({ target: [enrollments.userId, enrollments.courseId] });
    return this.listUserEnrollments(userId);
  }

  async unenrollUser(userId: string, courseId: string): Promise<AdminEnrollmentDto[]> {
    await this.db
      .delete(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)));
    return this.listUserEnrollments(userId);
  }

  private async getUser(id: string): Promise<AdminUserDto> {
    const [row] = await this.db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
        enrollments: count(enrollments.id),
      })
      .from(users)
      .leftJoin(enrollments, eq(enrollments.userId, users.id))
      .where(eq(users.id, id))
      .groupBy(users.id)
      .limit(1);
    if (!row) throw new NotFoundException('Usuário não encontrado');
    return { ...row, createdAt: row.createdAt.toISOString() };
  }
}
