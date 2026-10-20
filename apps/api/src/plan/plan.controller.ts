import { Body, Controller, Get, Inject, Param, Put } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { PlanService } from './plan.service';
import {
  planTaskKeySchema,
  setPlanTaskSchema,
  type PlanTaskDto,
  type PlanTasksDto,
  type SetPlanTaskDto,
} from './dto';

/**
 * Tarefas do plano de marketing (página pública vethis.com.br/plano-mkt).
 * Rotas públicas por decisão do time: qualquer pessoa com o link marca e
 * desmarca. Só o booleano por chave é persistido; abuso no pior caso desfaz
 * marcações. Escrita com limite próprio além do rate limit global.
 */
@Controller({ path: 'plan/tasks', version: '1' })
export class PlanController {
  constructor(@Inject(PlanService) private readonly plan: PlanService) {}

  @Get()
  list(): Promise<PlanTasksDto> {
    return this.plan.listTasks();
  }

  @Put(':key')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  set(
    @Param('key', new ZodValidationPipe(planTaskKeySchema)) key: string,
    @Body(new ZodValidationPipe(setPlanTaskSchema)) dto: SetPlanTaskDto,
  ): Promise<PlanTaskDto> {
    return this.plan.setTask(key, dto.done);
  }
}
