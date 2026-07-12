import { Body, Controller, Inject, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CrmService } from './crm.service';
import { createLeadSchema, type CreateLeadDto, type LeadDto } from './dto';

/** Captura pública de leads (site). Rate-limited; nenhuma outra rota anônima. */
@Controller({ path: 'leads', version: '1' })
export class CrmController {
  constructor(@Inject(CrmService) private readonly crm: CrmService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  create(@Body(new ZodValidationPipe(createLeadSchema)) dto: CreateLeadDto): Promise<LeadDto> {
    return this.crm.create(dto);
  }
}
