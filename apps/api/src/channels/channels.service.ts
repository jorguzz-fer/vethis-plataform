import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, count, eq, gte, lte } from 'drizzle-orm';
import { DB, type Database } from '../db/client';
import { channelRules, channels, type ChannelRule } from '../db/schema/channels';
import { leads } from '../db/schema/crm';
import type { LeadStage } from '../db/schema/enums';
import type {
  ChannelDto,
  ChannelRuleDto,
  CreateChannelDto,
  CreateChannelRuleDto,
  FlowQueryDto,
  LeadsFlowDto,
  UnmappedOriginDto,
  UpdateChannelDto,
  UpdateChannelRuleDto,
} from './dto';

type StageAcc = Record<LeadStage | 'total', number>;
const emptyStage = (): StageAcc => ({
  new: 0,
  contacted: 0,
  qualified: 0,
  won: 0,
  lost: 0,
  total: 0,
});

function ruleToDto(r: ChannelRule): ChannelRuleDto {
  return {
    id: r.id,
    channelId: r.channelId,
    utmSource: r.utmSource,
    utmMedium: r.utmMedium,
    priority: r.priority,
  };
}

@Injectable()
export class ChannelsService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async listChannels(): Promise<ChannelDto[]> {
    const rows = await this.db
      .select()
      .from(channels)
      .orderBy(asc(channels.sortOrder), asc(channels.name));
    const rules = await this.db.select().from(channelRules);
    const byChannel = new Map<string, ChannelRuleDto[]>();
    for (const r of rules) {
      const list = byChannel.get(r.channelId) ?? [];
      list.push(ruleToDto(r));
      byChannel.set(r.channelId, list);
    }
    return rows.map((c) => ({
      id: c.id,
      name: c.name,
      group: c.group,
      color: c.color,
      active: c.active,
      sortOrder: c.sortOrder,
      rules: byChannel.get(c.id) ?? [],
    }));
  }

  private async getChannel(id: string): Promise<ChannelDto> {
    const list = await this.listChannels();
    const found = list.find((c) => c.id === id);
    if (!found) throw new NotFoundException('Canal não encontrado');
    return found;
  }

  async createChannel(dto: CreateChannelDto): Promise<ChannelDto> {
    const [row] = await this.db
      .insert(channels)
      .values({
        name: dto.name,
        group: dto.group,
        color: dto.color,
        active: dto.active ?? true,
        sortOrder: dto.sortOrder ?? 0,
      })
      .returning({ id: channels.id });
    const id = row!.id;
    if (dto.rules?.length) {
      await this.db.insert(channelRules).values(
        dto.rules.map((r) => ({
          channelId: id,
          utmSource: r.utmSource,
          utmMedium: r.utmMedium ?? null,
          priority: r.priority ?? 0,
        })),
      );
    }
    return this.getChannel(id);
  }

  async updateChannel(id: string, dto: UpdateChannelDto): Promise<ChannelDto> {
    const [row] = await this.db
      .update(channels)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(channels.id, id))
      .returning({ id: channels.id });
    if (!row) throw new NotFoundException('Canal não encontrado');
    return this.getChannel(id);
  }

  async deleteChannel(id: string): Promise<{ ok: true }> {
    const [row] = await this.db
      .delete(channels)
      .where(eq(channels.id, id))
      .returning({ id: channels.id });
    if (!row) throw new NotFoundException('Canal não encontrado');
    return { ok: true };
  }

  async addRule(channelId: string, dto: CreateChannelRuleDto): Promise<ChannelDto> {
    await this.getChannel(channelId); // 404 se não existir
    await this.db.insert(channelRules).values({
      channelId,
      utmSource: dto.utmSource,
      utmMedium: dto.utmMedium ?? null,
      priority: dto.priority ?? 0,
    });
    return this.getChannel(channelId);
  }

  async updateRule(ruleId: string, dto: UpdateChannelRuleDto): Promise<ChannelDto> {
    const [row] = await this.db
      .update(channelRules)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(channelRules.id, ruleId))
      .returning({ channelId: channelRules.channelId });
    if (!row) throw new NotFoundException('Regra não encontrada');
    return this.getChannel(row.channelId);
  }

  async deleteRule(ruleId: string): Promise<ChannelDto> {
    const [row] = await this.db
      .delete(channelRules)
      .where(eq(channelRules.id, ruleId))
      .returning({ channelId: channelRules.channelId });
    if (!row) throw new NotFoundException('Regra não encontrada');
    return this.getChannel(row.channelId);
  }

  /** Resolve (utm_source[, utm_medium]) → id do canal; null = não mapeado. */
  private resolveChannelId(
    source: string | null,
    medium: string | null,
    rules: ChannelRuleDto[],
  ): string | null {
    if (!source) return null;
    const s = source.toLowerCase();
    const m = medium?.toLowerCase() ?? null;
    let best: ChannelRuleDto | null = null;
    for (const r of rules) {
      if (r.utmSource.toLowerCase() !== s) continue;
      if (r.utmMedium != null && r.utmMedium.toLowerCase() !== m) continue;
      if (
        !best ||
        r.priority > best.priority ||
        (r.priority === best.priority && r.utmMedium != null && best.utmMedium == null)
      ) {
        best = r;
      }
    }
    return best?.channelId ?? null;
  }

  private dateConds(q: FlowQueryDto) {
    const conds = [];
    if (q.from) conds.push(gte(leads.createdAt, new Date(q.from)));
    if (q.to) conds.push(lte(leads.createdAt, new Date(q.to)));
    return conds.length ? and(...conds) : undefined;
  }

  async getLeadsFlow(q: FlowQueryDto): Promise<LeadsFlowDto> {
    const chans = await this.listChannels();
    const rules = chans.flatMap((c) => c.rules);
    const rows = await this.db
      .select({
        source: leads.utmSource,
        medium: leads.utmMedium,
        stage: leads.stage,
        n: count(),
      })
      .from(leads)
      .where(this.dateConds(q))
      .groupBy(leads.utmSource, leads.utmMedium, leads.stage);

    const perChannel = new Map<string, StageAcc>();
    for (const c of chans) perChannel.set(c.id, emptyStage());
    const unmapped = emptyStage();
    const totals = emptyStage();

    for (const r of rows) {
      const chId = this.resolveChannelId(r.source, r.medium, rules);
      const bucket = chId ? perChannel.get(chId)! : unmapped;
      bucket[r.stage] += r.n;
      bucket.total += r.n;
      totals[r.stage] += r.n;
      totals.total += r.n;
    }

    return {
      channels: chans.map((c) => ({
        id: c.id,
        name: c.name,
        group: c.group,
        color: c.color,
        byStage: perChannel.get(c.id)!,
      })),
      unmapped,
      totals,
    };
  }

  async getUnmappedOrigins(q: FlowQueryDto): Promise<UnmappedOriginDto[]> {
    const chans = await this.listChannels();
    const rules = chans.flatMap((c) => c.rules);
    const rows = await this.db
      .select({ source: leads.utmSource, medium: leads.utmMedium, n: count() })
      .from(leads)
      .where(this.dateConds(q))
      .groupBy(leads.utmSource, leads.utmMedium);

    return rows
      .filter((r) => r.source && this.resolveChannelId(r.source, r.medium, rules) === null)
      .map((r) => ({ utmSource: r.source, utmMedium: r.medium, count: r.n }))
      .sort((a, b) => b.count - a.count);
  }
}
