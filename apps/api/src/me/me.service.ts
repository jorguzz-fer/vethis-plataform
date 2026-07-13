import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { and, asc, count, eq, desc, ne } from 'drizzle-orm';
import { DB, type Database } from '../db/client';
import { courseModules, courses, instructors, lessons, specialties } from '../db/schema/catalog';
import { enrollments, lessonProgress, secretariaRequests } from '../db/schema/enrollment';
import { users } from '../db/schema/identity';
import { PasswordService } from '../auth/password.service';
import type {
  CertificateDto,
  ChangePasswordDto,
  CoursePlayer,
  CreateSecretariaDto,
  EnrolledCourse,
  ProfileDto,
  SecretariaRequestDto,
  UpdateProfileDto,
} from './dto';

@Injectable()
export class MeService {
  constructor(
    @Inject(DB) private readonly db: Database,
    @Inject(PasswordService) private readonly passwords: PasswordService,
  ) {}

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
        instructorName: instructors.name,
        instructorAvatar: instructors.avatarUrl,
      })
      .from(courses)
      .leftJoin(instructors, eq(courses.instructorId, instructors.id))
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
      instructor: course.instructorName
        ? { name: course.instructorName, avatarUrl: course.instructorAvatar }
        : null,
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

    // Se concluiu a última aula, marca a matrícula como concluída (libera certificado).
    const total = await this.countLessons(row.courseId);
    const done = await this.countCompleted(userId, row.courseId);
    if (total > 0 && done >= total) {
      await this.db
        .update(enrollments)
        .set({ status: 'completed', completedAt: new Date() })
        .where(
          and(
            eq(enrollments.userId, userId),
            eq(enrollments.courseId, row.courseId),
            eq(enrollments.status, 'active'),
          ),
        );
    }
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

  async getProfile(userId: string): Promise<ProfileDto> {
    const [u] = await this.db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!u) throw new NotFoundException('Usuário não encontrado');
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<ProfileDto> {
    await this.db
      .update(users)
      .set({ name: dto.name, updatedAt: new Date() })
      .where(eq(users.id, userId));
    return this.getProfile(userId);
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ ok: true }> {
    const [u] = await this.db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!u?.passwordHash) throw new NotFoundException('Usuário não encontrado');

    const ok = await this.passwords.verify(u.passwordHash, dto.currentPassword);
    if (!ok) throw new UnauthorizedException('Senha atual incorreta');
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('A nova senha deve ser diferente da atual');
    }

    const passwordHash = await this.passwords.hash(dto.newPassword);
    await this.db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));
    return { ok: true };
  }

  /** Certificado de conclusão — só quando todas as aulas foram concluídas. */
  async getCertificate(userId: string, slug: string): Promise<CertificateDto> {
    const [course] = await this.db
      .select({
        id: courses.id,
        title: courses.title,
        slug: courses.slug,
        instructorName: instructors.name,
      })
      .from(courses)
      .leftJoin(instructors, eq(courses.instructorId, instructors.id))
      .where(eq(courses.slug, slug))
      .limit(1);
    if (!course) throw new NotFoundException('Curso não encontrado');

    await this.assertEnrolled(userId, course.id);

    const total = await this.countLessons(course.id);
    const done = await this.countCompleted(userId, course.id);
    if (total === 0 || done < total) {
      throw new ForbiddenException('Conclua todas as aulas para emitir o certificado');
    }

    const [u] = await this.db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Data de conclusão: da matrícula, ou a última aula concluída.
    const [enr] = await this.db
      .select({ completedAt: enrollments.completedAt })
      .from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, course.id)))
      .limit(1);
    let completedAt = enr?.completedAt ?? null;
    if (!completedAt) {
      const [last] = await this.db
        .select({ at: lessonProgress.completedAt })
        .from(lessonProgress)
        .innerJoin(lessons, eq(lessonProgress.lessonId, lessons.id))
        .innerJoin(courseModules, eq(lessons.moduleId, courseModules.id))
        .where(and(eq(courseModules.courseId, course.id), eq(lessonProgress.userId, userId)))
        .orderBy(desc(lessonProgress.completedAt))
        .limit(1);
      completedAt = last?.at ?? new Date();
    }

    return {
      studentName: u?.name ?? u?.email.split('@')[0] ?? 'Aluno',
      courseTitle: course.title,
      courseSlug: course.slug,
      instructorName: course.instructorName,
      lessonsTotal: total,
      completedAt: completedAt.toISOString(),
    };
  }

  private async assertEnrolled(userId: string, courseId: string): Promise<void> {
    // Aceita matrícula ativa OU concluída — só nega as canceladas. Um aluno que
    // terminou o curso continua com acesso ao player e ao certificado.
    const [enr] = await this.db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.userId, userId),
          eq(enrollments.courseId, courseId),
          ne(enrollments.status, 'cancelled'),
        ),
      )
      .limit(1);
    if (!enr) throw new ForbiddenException('Você não está matriculado neste curso');
  }
}
