import { z } from 'zod';

/** Captura pública de lead (formulário do site). */
export const createLeadSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional(),
  source: z.string().max(40).optional(),
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
  createdAt: z.string(),
});
export type LeadDto = z.infer<typeof leadSchema>;

export const updateLeadSchema = z.object({
  stage: z.enum(leadStageValues).optional(),
  notes: z.string().max(4000).optional(),
});
export type UpdateLeadDto = z.infer<typeof updateLeadSchema>;
