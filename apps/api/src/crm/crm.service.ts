import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { count, desc, eq } from 'drizzle-orm';
import { DB, type Database } from '../db/client';
import { leads, opportunities } from '../db/schema/crm';
import { users } from '../db/schema/identity';
import type { LeadStage } from '../db/schema/enums';
import type {
  CreateLeadDto,
  CreateOpportunityDto,
  LeadDto,
  OpportunityDto,
  UpdateLeadDto,
  UpdateOpportunityDto,
} from './dto';

function toDto(l: typeof leads.$inferSelect): LeadDto {
  return {
    id: l.id,
    name: l.name,
    email: l.email,
    phone: l.phone,
    source: l.source,
    stage: l.stage,
    notes: l.notes,
    utmSource: l.utmSource,
    utmMedium: l.utmMedium,
    utmCampaign: l.utmCampaign,
    createdAt: l.createdAt.toISOString(),
  };
}

@Injectable()
export class CrmService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async create(dto: CreateLeadDto): Promise<LeadDto> {
    const [row] = await this.db
      .insert(leads)
      .values({
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        source: dto.source ?? 'site',
        ...(dto.attribution ?? {}),
      })
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

  // --- Oportunidades -------------------------------------------------------

  async listOpportunities(): Promise<OpportunityDto[]> {
    const rows = await this.db
      .select({
        o: opportunities,
        leadName: leads.name,
        ownerName: users.name,
      })
      .from(opportunities)
      .leftJoin(leads, eq(opportunities.leadId, leads.id))
      .leftJoin(users, eq(opportunities.ownerId, users.id))
      .orderBy(desc(opportunities.createdAt));
    return rows.map((r) => oppToDto(r.o, r.leadName, r.ownerName));
  }

  private async getOpportunity(id: string): Promise<OpportunityDto> {
    const [row] = await this.db
      .select({ o: opportunities, leadName: leads.name, ownerName: users.name })
      .from(opportunities)
      .leftJoin(leads, eq(opportunities.leadId, leads.id))
      .leftJoin(users, eq(opportunities.ownerId, users.id))
      .where(eq(opportunities.id, id));
    if (!row) throw new NotFoundException('Oportunidade não encontrada');
    return oppToDto(row.o, row.leadName, row.ownerName);
  }

  async createOpportunity(dto: CreateOpportunityDto): Promise<OpportunityDto> {
    const [row] = await this.db
      .insert(opportunities)
      .values({
        title: dto.title,
        stage: dto.stage,
        valueCents: dto.valueCents,
        probability: dto.probability,
        expectedCloseDate: dto.expectedCloseDate ?? null,
        leadId: dto.leadId ?? null,
        ownerId: dto.ownerId ?? null,
      })
      .returning({ id: opportunities.id });
    return this.getOpportunity(row!.id);
  }

  async updateOpportunity(id: string, dto: UpdateOpportunityDto): Promise<OpportunityDto> {
    const [row] = await this.db
      .update(opportunities)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(opportunities.id, id))
      .returning({ id: opportunities.id });
    if (!row) throw new NotFoundException('Oportunidade não encontrada');
    return this.getOpportunity(row.id);
  }

  async deleteOpportunity(id: string): Promise<{ ok: true }> {
    const [row] = await this.db
      .delete(opportunities)
      .where(eq(opportunities.id, id))
      .returning({ id: opportunities.id });
    if (!row) throw new NotFoundException('Oportunidade não encontrada');
    return { ok: true };
  }
}

function oppToDto(
  o: typeof opportunities.$inferSelect,
  leadName: string | null,
  ownerName: string | null,
): OpportunityDto {
  return {
    id: o.id,
    title: o.title,
    stage: o.stage,
    valueCents: o.valueCents,
    probability: o.probability,
    expectedCloseDate: o.expectedCloseDate,
    leadId: o.leadId,
    leadName,
    ownerId: o.ownerId,
    ownerName,
    createdAt: o.createdAt.toISOString(),
  };
}
