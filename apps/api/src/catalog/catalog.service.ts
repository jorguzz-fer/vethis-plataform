import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { DB, type Database } from '../db/client';
import { courseModules, courses, instructors, lessons, specialties } from '../db/schema/catalog';
import type { CourseDetail, CourseSummary, ListCoursesQuery, specialtySchema } from './dto';
import type { z } from 'zod';

type SpecialtyDto = z.infer<typeof specialtySchema>;

@Injectable()
export class CatalogService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async listSpecialties(): Promise<SpecialtyDto[]> {
    return this.db
      .select({
        id: specialties.id,
        slug: specialties.slug,
        name: specialties.name,
        description: specialties.description,
        icon: specialties.icon,
      })
      .from(specialties)
      .orderBy(asc(specialties.name));
  }

  async listCourses(query: ListCoursesQuery): Promise<CourseSummary[]> {
    const filters = [eq(courses.status, 'published'), isNull(courses.deletedAt)];
    if (query.level) filters.push(eq(courses.level, query.level));
    if (query.specialty) filters.push(eq(specialties.slug, query.specialty));

    const rows = await this.db
      .select({
        id: courses.id,
        slug: courses.slug,
        title: courses.title,
        subtitle: courses.subtitle,
        priceCents: courses.priceCents,
        level: courses.level,
        coverUrl: courses.coverUrl,
        specialtySlug: specialties.slug,
        specialtyName: specialties.name,
        instructorSlug: instructors.slug,
        instructorName: instructors.name,
        instructorBio: instructors.bio,
        instructorAvatarUrl: instructors.avatarUrl,
      })
      .from(courses)
      .leftJoin(specialties, eq(courses.specialtyId, specialties.id))
      .leftJoin(instructors, eq(courses.instructorId, instructors.id))
      .where(and(...filters))
      .orderBy(asc(courses.title));

    return rows.map(toSummary);
  }

  async getCourseBySlug(slug: string): Promise<CourseDetail> {
    const rows = await this.db
      .select({
        id: courses.id,
        slug: courses.slug,
        title: courses.title,
        subtitle: courses.subtitle,
        description: courses.description,
        priceCents: courses.priceCents,
        level: courses.level,
        coverUrl: courses.coverUrl,
        workloadHours: courses.workloadHours,
        learningObjectives: courses.learningObjectives,
        faq: courses.faq,
        specialtySlug: specialties.slug,
        specialtyName: specialties.name,
        instructorSlug: instructors.slug,
        instructorName: instructors.name,
        instructorBio: instructors.bio,
        instructorAvatarUrl: instructors.avatarUrl,
      })
      .from(courses)
      .leftJoin(specialties, eq(courses.specialtyId, specialties.id))
      .leftJoin(instructors, eq(courses.instructorId, instructors.id))
      .where(
        and(eq(courses.slug, slug), eq(courses.status, 'published'), isNull(courses.deletedAt)),
      )
      .limit(1);

    const course = rows[0];
    if (!course) {
      throw new NotFoundException('Curso não encontrado');
    }

    const mods = await this.db
      .select({
        id: courseModules.id,
        title: courseModules.title,
        position: courseModules.position,
      })
      .from(courseModules)
      .where(eq(courseModules.courseId, course.id))
      .orderBy(asc(courseModules.position));

    const modules = await Promise.all(
      mods.map(async (m) => {
        const ls = await this.db
          .select({
            id: lessons.id,
            title: lessons.title,
            durationSeconds: lessons.durationSeconds,
            isFree: lessons.isFree,
          })
          .from(lessons)
          .where(eq(lessons.moduleId, m.id))
          .orderBy(asc(lessons.position));
        return { id: m.id, title: m.title, position: m.position, lessons: ls };
      }),
    );

    return {
      ...toSummary(course),
      description: course.description,
      workloadHours: course.workloadHours,
      learningObjectives: course.learningObjectives ?? [],
      faq: course.faq ?? [],
      modules,
    };
  }
}

interface JoinedCourse {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  priceCents: number;
  level: CourseSummary['level'];
  coverUrl: string | null;
  specialtySlug: string | null;
  specialtyName: string | null;
  instructorSlug: string | null;
  instructorName: string | null;
  instructorBio: string | null;
  instructorAvatarUrl: string | null;
}

function toSummary(c: JoinedCourse): CourseSummary {
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    subtitle: c.subtitle,
    priceCents: c.priceCents,
    level: c.level,
    coverUrl: c.coverUrl,
    specialty:
      c.specialtySlug && c.specialtyName ? { slug: c.specialtySlug, name: c.specialtyName } : null,
    instructor:
      c.instructorSlug && c.instructorName
        ? {
            slug: c.instructorSlug,
            name: c.instructorName,
            bio: c.instructorBio,
            avatarUrl: c.instructorAvatarUrl,
          }
        : null,
  };
}
