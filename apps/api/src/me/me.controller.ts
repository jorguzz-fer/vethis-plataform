import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, type AuthUser } from '../common/auth-user';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { SessionGuard } from '../auth/guards/session.guard';
import { MeService } from './me.service';
import {
  changePasswordSchema,
  createSecretariaSchema,
  updateProfileSchema,
  type CertificateDto,
  type ChangePasswordDto,
  type CoursePlayer,
  type CreateSecretariaDto,
  type EnrolledCourse,
  type ProfileDto,
  type SecretariaRequestDto,
  type UpdateProfileDto,
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

  @Get('profile')
  profile(@CurrentUser() user: AuthUser): Promise<ProfileDto> {
    return this.me.getProfile(user.id);
  }

  @Patch('profile')
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(updateProfileSchema)) dto: UpdateProfileDto,
  ): Promise<ProfileDto> {
    return this.me.updateProfile(user.id, dto);
  }

  @Post('password')
  @HttpCode(200)
  changePassword(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(changePasswordSchema)) dto: ChangePasswordDto,
  ): Promise<{ ok: true }> {
    return this.me.changePassword(user.id, dto);
  }

  @Get('courses/:slug/certificate')
  certificate(@CurrentUser() user: AuthUser, @Param('slug') slug: string): Promise<CertificateDto> {
    return this.me.getCertificate(user.id, slug);
  }
}
