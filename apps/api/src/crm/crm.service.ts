import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { count, desc, eq } from 'drizzle-orm';
import { DB, type Database } from '../db/client';
import { leads } from '../db/schema/crm';
import type { LeadStage } from '../db/schema/enums';
import type { CreateLeadDto, LeadDto, UpdateLeadDto } from './dto';

function toDto(l: typeof leads.$inferSelect): LeadDto {
  return {
    id: l.id,
    name: l.name,
    email: l.email,
    phone: l.phone,
    source: l.source,
    stage: l.stage,
    notes: l.notes,
    createdAt: l.createdAt.toISOString(),
  };
}

@Injectable()
export class CrmService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async create(dto: CreateLeadDto): Promise<LeadDto> {
    const [row] = await this.db
      .insert(leads)
      .values({ name: dto.name, email: dto.email, phone: dto.phone, source: dto.source ?? 'site' })
      .returning();
    return toDto(row!);
  }

  async list(stage?: LeadStage): Promise<LeadDto[]> {
    const rows = stage
      ? await this.db
          .select()
          .from(leads)
          .where(eq(leads.stage, stage))
          .orderBy(desc(leads.createdAt))
      : await this.db.select().from(leads).orderBy(desc(leads.createdAt));
    return rows.map(toDto);
  }

  async update(id: string, dto: UpdateLeadDto): Promise<LeadDto> {
    const [row] = await this.db
      .update(leads)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    if (!row) throw new NotFoundException('Lead não encontrado');
    return toDto(row);
  }

  async countByStage(): Promise<Record<LeadStage, number>> {
    const rows = await this.db
      .select({ stage: leads.stage, n: count() })
      .from(leads)
      .groupBy(leads.stage);
    const base: Record<LeadStage, number> = {
      new: 0,
      contacted: 0,
      qualified: 0,
      won: 0,
      lost: 0,
    };
    for (const r of rows) base[r.stage] = r.n;
    return base;
  }
}
