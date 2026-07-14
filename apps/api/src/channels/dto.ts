import { z } from 'zod';

export const channelGroupValues = ['pago', 'organico', 'base_propria'] as const;

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor deve ser hex #rrggbb');

/** Regra de mapeamento origem→canal. */
export const channelRuleSchema = z.object({
  id: z.string().uuid(),
  channelId: z.string().uuid(),
  utmSource: z.string(),
  utmMedium: z.string().nullable(),
  priority: z.number().int(),
});
export type ChannelRuleDto = z.infer<typeof channelRuleSchema>;

/** Canal de aquisição com suas regras. */
export const channelSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  group: z.enum(channelGroupValues),
  color: z.string(),
  active: z.boolean(),
  sortOrder: z.number().int(),
  rules: z.array(channelRuleSchema),
});
export type ChannelDto = z.infer<typeof channelSchema>;

const ruleInput = z.object({
  utmSource: z.string().min(1).max(200),
  utmMedium: z.string().max(200).nullable().optional(),
  priority: z.number().int().min(0).max(1000).optional(),
});

export const createChannelSchema = z.object({
  name: z.string().min(1).max(80),
  group: z.enum(channelGroupValues).default('organico'),
  color: hexColor.default('#3E7D5F'),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  rules: z.array(ruleInput).optional(),
});
export type CreateChannelDto = z.infer<typeof createChannelSchema>;

export const updateChannelSchema = z
  .object({
    name: z.string().min(1).max(80).optional(),
    group: z.enum(channelGroupValues).optional(),
    color: hexColor.optional(),
    active: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nada para atualizar' });
export type UpdateChannelDto = z.infer<typeof updateChannelSchema>;

export const createChannelRuleSchema = ruleInput;
export type CreateChannelRuleDto = z.infer<typeof createChannelRuleSchema>;

export const updateChannelRuleSchema = z
  .object({
    utmSource: z.string().min(1).max(200).optional(),
    utmMedium: z.string().max(200).nullable().optional(),
    priority: z.number().int().min(0).max(1000).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nada para atualizar' });
export type UpdateChannelRuleDto = z.infer<typeof updateChannelRuleSchema>;

/** Contagem por estágio do funil de leads. */
export const stageCountSchema = z.object({
  new: z.number().int(),
  contacted: z.number().int(),
  qualified: z.number().int(),
  won: z.number().int(),
  lost: z.number().int(),
  total: z.number().int(),
});

/** Fluxo de leads por canal (para o mapa e o dashboard). */
export const leadsFlowSchema = z.object({
  channels: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      group: z.enum(channelGroupValues),
      color: z.string(),
      byStage: stageCountSchema,
    }),
  ),
  unmapped: stageCountSchema,
  totals: stageCountSchema,
});
export type LeadsFlowDto = z.infer<typeof leadsFlowSchema>;

/** Origem (utm) que não casou com nenhuma regra. */
export const unmappedOriginSchema = z.object({
  utmSource: z.string().nullable(),
  utmMedium: z.string().nullable(),
  count: z.number().int(),
});
export type UnmappedOriginDto = z.infer<typeof unmappedOriginSchema>;

/** Janela opcional de datas (ISO) para as agregações. */
export const flowQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});
export type FlowQueryDto = z.infer<typeof flowQuerySchema>;
