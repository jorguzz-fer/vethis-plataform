import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CatalogService } from './catalog.service';
import {
  listCoursesQuerySchema,
  type CourseDetail,
  type CourseSummary,
  type ListCoursesQuery,
} from './dto';
import type { z } from 'zod';
import type { specialtySchema } from './dto';

/** Catálogo público (site/ecommerce). Somente leitura de cursos publicados. */
@Controller({ path: 'catalog', version: '1' })
export class CatalogController {
  constructor(@Inject(CatalogService) private readonly catalog: CatalogService) {}

  @Get('specialties')
  listSpecialties(): Promise<z.infer<typeof specialtySchema>[]> {
    return this.catalog.listSpecialties();
  }

  @Get('courses')
  listCourses(
    @Query(new ZodValidationPipe(listCoursesQuerySchema)) query: ListCoursesQuery,
  ): Promise<CourseSummary[]> {
    return this.catalog.listCourses(query);
  }

  @Get('courses/:slug')
  getCourse(@Param('slug') slug: string): Promise<CourseDetail> {
    return this.catalog.getCourseBySlug(slug);
  }
}
