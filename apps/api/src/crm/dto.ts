import { z } from 'zod';

/** Atribuição first-touch (UTM + referrer + click ids). Todos opcionais. */
export const attributionInputSchema = z.object({
  utmSource: z.string().max(200).optional(),
  utmMedium: z.string().max(200).optional(),
  utmCampaign: z.string().max(200).optional(),
  utmContent: z.string().max(200).optional(),
  utmTerm: z.string().max(200).optional(),
  referrer: z.string().max(1000).optional(),
  landingPath: z.string().max(1000).optional(),
  gclid: z.string().max(200).optional(),
  fbclid: z.string().max(200).optional(),
});
export type AttributionInput = z.infer<typeof attributionInputSchema>;

/** Captura pública de lead (formulário do site). */
export const createLeadSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional(),
  source: z.string().max(40).optional(),
  attribution: attributionInputSchema.optional(),
});
export type CreateLeadDto = z.infer<typeof createLeadSchema>;

export const leadStageValues = ['new', 'contacted', 'qualified', 'won', 'lost'] as const;

export const leadSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  source: z.string(),
  stage: z.enum(leadStageValues),
  notes: z.string().nullable(),
  utmSource: z.string().nullable(),
  utmMedium: z.string().nullable(),
  utmCampaign: z.string().nullable(),
  createdAt: z.string(),
});
export type LeadDto = z.infer<typeof leadSchema>;

export const updateLeadSchema = z.object({
  stage: z.enum(leadStageValues).optional(),
  notes: z.string().max(4000).optional(),
});
export type UpdateLeadDto = z.infer<typeof updateLeadSchema>;

// ---------------------------------------------------------------------------
// Oportunidades (negócios do funil de vendas)
// ---------------------------------------------------------------------------

export const opportunityStageValues = [
  'prospeccao',
  'qualificacao',
  'proposta',
  'negociacao',
  'ganho',
  'perdido',
] as const;

/** Data no formato ISO `YYYY-MM-DD` (input `<input type="date">`). */
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato AAAA-MM-DD');

export const opportunitySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  stage: z.enum(opportunityStageValues),
  valueCents: z.number().int(),
  probability: z.number().int(),
  expectedCloseDate: isoDate.nullable(),
  leadId: z.string().uuid().nullable(),
  leadName: z.string().nullable(),
  ownerId: z.string().uuid().nullable(),
  ownerName: z.string().nullable(),
  createdAt: z.string(),
});
export type OpportunityDto = z.infer<typeof opportunitySchema>;

export const createOpportunitySchema = z.object({
  title: z.string().min(1).max(160),
  stage: z.enum(opportunityStageValues).default('prospeccao'),
  valueCents: z.number().int().min(0).default(0),
  probability: z.number().int().min(0).max(100).default(0),
  expectedCloseDate: isoDate.nullable().optional(),
  leadId: z.string().uuid().nullable().optional(),
  ownerId: z.string().uuid().nullable().optional(),
});
export type CreateOpportunityDto = z.infer<typeof createOpportunitySchema>;

export const updateOpportunitySchema = z
  .object({
    title: z.string().min(1).max(160).optional(),
    stage: z.enum(opportunityStageValues).optional(),
    valueCents: z.number().int().min(0).optional(),
    probability: z.number().int().min(0).max(100).optional(),
    expectedCloseDate: isoDate.nullable().optional(),
    leadId: z.string().uuid().nullable().optional(),
    ownerId: z.string().uuid().nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nada para atualizar' });
export type UpdateOpportunityDto = z.infer<typeof updateOpportunitySchema>;
