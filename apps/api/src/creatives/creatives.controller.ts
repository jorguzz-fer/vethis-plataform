import { Body, Controller, Get, Inject, Param, Put } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreativesService } from './creatives.service';
import {
  creativeReviewKeySchema,
  setCreativeReviewSchema,
  type CreativeReviewDto,
  type CreativeReviewsDto,
  type SetCreativeReviewDto,
} from './dto';

/**
 * Avaliação dos criativos de anúncio (página vethis.com.br/Criativos). Rotas
 * públicas, como as do plano de marketing: quem tem o link aprova ou pede
 * ajustes. Só status, comentário e nome digitado são guardados; no pior caso um
 * abuso sobrescreve avaliações. Escrita com limite próprio além do global.
 */
@Controller({ path: 'creatives/reviews', version: '1' })
export class CreativesController {
  constructor(@Inject(CreativesService) private readonly creatives: CreativesService) {}

  @Get()
  list(): Promise<CreativeReviewsDto> {
    return this.creatives.listReviews();
  }

  @Put(':key')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  set(
    @Param('key', new ZodValidationPipe(creativeReviewKeySchema)) key: string,
    @Body(new ZodValidationPipe(setCreativeReviewSchema)) dto: SetCreativeReviewDto,
  ): Promise<CreativeReviewDto> {
    return this.creatives.setReview(key, dto);
  }
}
