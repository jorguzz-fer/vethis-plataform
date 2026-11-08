import { Inject, Injectable } from '@nestjs/common';
import { asc } from 'drizzle-orm';
import { DB, type Database } from '../db/client';
import { creativeReviews, type CreativeReview } from '../db/schema/creative-reviews';
import type { CreativeReviewDto, CreativeReviewsDto, SetCreativeReviewDto } from './dto';

function toDto(row: CreativeReview): CreativeReviewDto {
  return {
    key: row.key,
    status: row.status as CreativeReviewDto['status'],
    comment: row.comment,
    reviewer: row.reviewer,
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Avaliações compartilhadas dos criativos (sem autenticação). */
@Injectable()
export class CreativesService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async listReviews(): Promise<CreativeReviewsDto> {
    const rows = await this.db.select().from(creativeReviews).orderBy(asc(creativeReviews.key));
    return { reviews: rows.map(toDto) };
  }

  /** Upsert da avaliação da peça. A última avaliação vence. */
  async setReview(key: string, dto: SetCreativeReviewDto): Promise<CreativeReviewDto> {
    const values = {
      key,
      status: dto.status,
      comment: dto.comment,
      reviewer: dto.reviewer || null,
      updatedAt: new Date(),
    };
    const [row] = await this.db
      .insert(creativeReviews)
      .values(values)
      .onConflictDoUpdate({
        target: creativeReviews.key,
        set: {
          status: values.status,
          comment: values.comment,
          reviewer: values.reviewer,
          updatedAt: values.updatedAt,
        },
      })
      .returning();
    return toDto(row!);
  }
}
