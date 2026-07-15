import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SessionGuard } from '../auth/guards/session.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AiService } from './ai.service';
import {
  aiCourseDraftInputSchema,
  type AiCourseDraftDto,
  type AiCourseDraftInputDto,
  type AiStatusDto,
} from './dto';

/** Recursos de IA para o backoffice (staff/admin). */
@Controller({ path: 'admin/ai', version: '1' })
@UseGuards(SessionGuard, RolesGuard)
@Roles('staff', 'admin')
export class AiController {
  constructor(@Inject(AiService) private readonly ai: AiService) {}

  @Get('status')
  status(): AiStatusDto {
    return { enabled: this.ai.isEnabled() };
  }

  /** Gera um rascunho de curso a partir de material bruto (não persiste). */
  @Post('course-draft')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  courseDraft(
    @Body(new ZodValidationPipe(aiCourseDraftInputSchema)) dto: AiCourseDraftInputDto,
  ): Promise<AiCourseDraftDto> {
    return this.ai.draftCourse(dto);
  }
}
