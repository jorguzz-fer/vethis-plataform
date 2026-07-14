import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SessionGuard } from '../auth/guards/session.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/roles.decorator';
import { CurrentUser, type AuthUser } from '../common/auth-user';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CrmService } from '../crm/crm.service';
import {
  createOpportunitySchema,
  updateLeadSchema,
  updateOpportunitySchema,
  leadStageValues,
  type CreateOpportunityDto,
  type LeadDto,
  type OpportunityDto,
  type UpdateLeadDto,
  type UpdateOpportunityDto,
} from '../crm/dto';
import type { LeadStage } from '../db/schema/enums';
import { AdminService } from './admin.service';
import {
  createCourseSchema,
  createInstructorSchema,
  createLessonSchema,
  createModuleSchema,
  createUserSchema,
  enrollUserSchema,
  resetPasswordSchema,
  updateCourseSchema,
  updateLessonSchema,
  updateModuleSchema,
  updateUserSchema,
  type AdminCourseDetailDto,
  type AdminCourseDto,
  type AdminEnrollmentDto,
  type AdminUserDto,
  type CreateCourseDto,
  type EnrollUserDto,
  type CreateInstructorDto,
  type CreateLessonDto,
  type CreateModuleDto,
  type CreateUserDto,
  type InstructorDto,
  type KpisDto,
  type ResetPasswordDto,
  type StudentDto,
  type UpdateCourseDto,
  type UpdateLessonDto,
  type UpdateModuleDto,
  type UpdateUserDto,
} from './dto';

/** Backoffice. Exige sessão + papel staff/admin (menor privilégio, ADR 0006). */
@Controller({ path: 'admin', version: '1' })
@UseGuards(SessionGuard, RolesGuard)
@Roles('staff', 'admin')
export class AdminController {
  constructor(
    @Inject(AdminService) private readonly admin: AdminService,
    @Inject(CrmService) private readonly crm: CrmService,
  ) {}

  @Get('kpis')
  kpis(): Promise<KpisDto> {
    return this.admin.getKpis();
  }

  @Get('courses')
  courses(): Promise<AdminCourseDto[]> {
    return this.admin.listCourses();
  }

  @Post('courses')
  createCourse(
    @Body(new ZodValidationPipe(createCourseSchema)) dto: CreateCourseDto,
  ): Promise<AdminCourseDetailDto> {
    return this.admin.createCourse(dto);
  }

  @Get('courses/:id')
  courseDetail(@Param('id') id: string): Promise<AdminCourseDetailDto> {
    return this.admin.getCourseDetail(id);
  }

  @Patch('courses/:id')
  updateCourse(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCourseSchema)) dto: UpdateCourseDto,
  ): Promise<AdminCourseDto> {
    return this.admin.updateCourse(id, dto);
  }

  @Delete('courses/:id')
  @HttpCode(200)
  deleteCourse(@Param('id') id: string): Promise<{ ok: true }> {
    return this.admin.deleteCourse(id);
  }

  @Post('courses/:id/modules')
  createModule(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createModuleSchema)) dto: CreateModuleDto,
  ): Promise<AdminCourseDetailDto> {
    return this.admin.createModule(id, dto);
  }

  @Patch('modules/:id')
  updateModule(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateModuleSchema)) dto: UpdateModuleDto,
  ): Promise<AdminCourseDetailDto> {
    return this.admin.updateModule(id, dto);
  }

  @Delete('modules/:id')
  @HttpCode(200)
  deleteModule(@Param('id') id: string): Promise<AdminCourseDetailDto> {
    return this.admin.deleteModule(id);
  }

  @Post('modules/:id/lessons')
  createLesson(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createLessonSchema)) dto: CreateLessonDto,
  ): Promise<AdminCourseDetailDto> {
    return this.admin.createLesson(id, dto);
  }

  @Patch('lessons/:id')
  updateLesson(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateLessonSchema)) dto: UpdateLessonDto,
  ): Promise<AdminCourseDetailDto> {
    return this.admin.updateLesson(id, dto);
  }

  @Delete('lessons/:id')
  @HttpCode(200)
  deleteLesson(@Param('id') id: string): Promise<AdminCourseDetailDto> {
    return this.admin.deleteLesson(id);
  }

  @Get('instructors')
  instructors(): Promise<InstructorDto[]> {
    return this.admin.listInstructors();
  }

  @Post('instructors')
  createInstructor(
    @Body(new ZodValidationPipe(createInstructorSchema)) dto: CreateInstructorDto,
  ): Promise<InstructorDto> {
    return this.admin.createInstructor(dto);
  }

  @Get('students')
  students(): Promise<StudentDto[]> {
    return this.admin.listStudents();
  }

  @Get('users')
  users(): Promise<AdminUserDto[]> {
    return this.admin.listUsers();
  }

  @Post('users')
  createUser(
    @Body(new ZodValidationPipe(createUserSchema)) dto: CreateUserDto,
  ): Promise<AdminUserDto> {
    return this.admin.createUser(dto);
  }

  @Get('users/:id/enrollments')
  userEnrollments(@Param('id') id: string): Promise<AdminEnrollmentDto[]> {
    return this.admin.listUserEnrollments(id);
  }

  @Post('users/:id/enrollments')
  enrollUser(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(enrollUserSchema)) dto: EnrollUserDto,
  ): Promise<AdminEnrollmentDto[]> {
    return this.admin.enrollUser(id, dto.courseId);
  }

  @Delete('users/:id/enrollments/:courseId')
  @HttpCode(200)
  unenrollUser(
    @Param('id') id: string,
    @Param('courseId') courseId: string,
  ): Promise<AdminEnrollmentDto[]> {
    return this.admin.unenrollUser(id, courseId);
  }

  @Patch('users/:id')
  updateUser(
    @CurrentUser() me: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateUserSchema)) dto: UpdateUserDto,
  ): Promise<AdminUserDto> {
    if (id === me.id && dto.role && dto.role !== me.role) {
      throw new BadRequestException('Você não pode alterar o próprio papel');
    }
    return this.admin.updateUser(id, dto);
  }

  @Post('users/:id/password')
  @HttpCode(200)
  resetPassword(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(resetPasswordSchema)) dto: ResetPasswordDto,
  ): Promise<{ ok: true }> {
    return this.admin.resetPassword(id, dto);
  }

  @Delete('users/:id')
  @HttpCode(200)
  deactivateUser(@CurrentUser() me: AuthUser, @Param('id') id: string): Promise<{ ok: true }> {
    if (id === me.id) throw new BadRequestException('Você não pode desativar a própria conta');
    return this.admin.deactivateUser(id);
  }

  @Get('leads')
  leads(@Query('stage') stage?: string): Promise<LeadDto[]> {
    const valid = leadStageValues.find((s) => s === stage) as LeadStage | undefined;
    return this.crm.list(valid);
  }

  @Patch('leads/:id')
  updateLead(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateLeadSchema)) dto: UpdateLeadDto,
  ): Promise<LeadDto> {
    return this.crm.update(id, dto);
  }

  @Get('opportunities')
  opportunities(): Promise<OpportunityDto[]> {
    return this.crm.listOpportunities();
  }

  @Post('opportunities')
  createOpportunity(
    @Body(new ZodValidationPipe(createOpportunitySchema)) dto: CreateOpportunityDto,
  ): Promise<OpportunityDto> {
    return this.crm.createOpportunity(dto);
  }

  @Patch('opportunities/:id')
  updateOpportunity(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateOpportunitySchema)) dto: UpdateOpportunityDto,
  ): Promise<OpportunityDto> {
    return this.crm.updateOpportunity(id, dto);
  }

  @Delete('opportunities/:id')
  @HttpCode(200)
  deleteOpportunity(@Param('id') id: string): Promise<{ ok: true }> {
    return this.crm.deleteOpportunity(id);
  }
}
