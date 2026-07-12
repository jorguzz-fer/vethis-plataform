import { Body, Controller, Get, Inject, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../auth/guards/session.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CrmService } from '../crm/crm.service';
import { updateLeadSchema, type LeadDto, type UpdateLeadDto, leadStageValues } from '../crm/dto';
import type { LeadStage } from '../db/schema/enums';
import { AdminService } from './admin.service';
import {
  updateCourseSchema,
  type AdminCourseDto,
  type KpisDto,
  type StudentDto,
  type UpdateCourseDto,
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

  @Patch('courses/:id')
  updateCourse(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCourseSchema)) dto: UpdateCourseDto,
  ): Promise<AdminCourseDto> {
    return this.admin.updateCourse(id, dto);
  }

  @Get('students')
  students(): Promise<StudentDto[]> {
    return this.admin.listStudents();
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
}
