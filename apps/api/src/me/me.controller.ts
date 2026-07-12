import { Body, Controller, Get, Inject, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, type AuthUser } from '../common/auth-user';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { SessionGuard } from '../auth/guards/session.guard';
import { MeService } from './me.service';
import {
  createSecretariaSchema,
  type CoursePlayer,
  type CreateSecretariaDto,
  type EnrolledCourse,
  type SecretariaRequestDto,
} from './dto';

/** Área do aluno. Todas as rotas exigem sessão (SessionGuard). */
@Controller({ path: 'me', version: '1' })
@UseGuards(SessionGuard)
export class MeController {
  constructor(@Inject(MeService) private readonly me: MeService) {}

  @Get('courses')
  myCourses(@CurrentUser() user: AuthUser): Promise<EnrolledCourse[]> {
    return this.me.listMyCourses(user.id);
  }

  @Get('courses/:slug')
  coursePlayer(@CurrentUser() user: AuthUser, @Param('slug') slug: string): Promise<CoursePlayer> {
    return this.me.getCoursePlayer(user.id, slug);
  }

  @Post('lessons/:lessonId/complete')
  completeLesson(
    @CurrentUser() user: AuthUser,
    @Param('lessonId') lessonId: string,
  ): Promise<{ ok: true }> {
    return this.me.completeLesson(user.id, lessonId);
  }

  @Get('secretaria')
  secretaria(@CurrentUser() user: AuthUser): Promise<SecretariaRequestDto[]> {
    return this.me.listSecretaria(user.id);
  }

  @Post('secretaria')
  createSecretaria(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createSecretariaSchema)) dto: CreateSecretariaDto,
  ): Promise<SecretariaRequestDto> {
    return this.me.createSecretaria(user.id, dto);
  }
}
