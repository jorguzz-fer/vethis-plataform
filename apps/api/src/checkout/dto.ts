import { z } from 'zod';
import { attributionInputSchema } from '../crm/dto';

/** Meio de pagamento escolhido no checkout (Pix como padrão de conversão). */
export const paymentMethodSchema = z.enum(['pix', 'card', 'boleto']);
export type PaymentMethodDto = z.infer<typeof paymentMethodSchema>;

/**
 * Dados do cartão — trafegam só para o gateway, nunca são persistidos (PCI).
 * Na fase 1 (adapter fake) servem apenas para simular a autorização.
 */
export const cardSchema = z.object({
  number: z.string().min(12).max(19),
  holderName: z.string().min(2).max(120),
  expMonth: z.coerce.number().int().min(1).max(12),
  expYear: z.coerce.number().int().min(2024).max(2100),
  cvv: z.string().min(3).max(4),
  installments: z.coerce.number().int().min(1).max(12).default(1),
});
export type CardDto = z.infer<typeof cardSchema>;

/** Início do checkout: curso + meio de pagamento (cartão exige `card`). */
export const createCheckoutSchema = z
  .object({
    courseSlug: z.string().min(1),
    method: paymentMethodSchema,
    card: cardSchema.optional(),
    attribution: attributionInputSchema.optional(),
  })
  .refine((v) => v.method !== 'card' || v.card != null, {
    message: 'Dados do cartão são obrigatórios para pagamento com cartão',
    path: ['card'],
  });
export type CreateCheckoutDto = z.infer<typeof createCheckoutSchema>;

/** Curso resumido no contexto do pedido. */
export const orderCourseSchema = z.object({
  slug: z.string(),
  title: z.string(),
  coverUrl: z.string().nullable(),
});

/**
 * Pedido retornado ao cliente. `simulatable` indica que o gateway é o adapter
 * fake — o front pode oferecer "simular pagamento" enquanto Asaas não está ligado.
 */
export const orderSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['pending', 'paid', 'cancelled', 'refunded']),
  method: paymentMethodSchema,
  amountCents: z.number().int(),
  currency: z.string(),
  installments: z.number().int(),
  course: orderCourseSchema,
  pixQrCode: z.string().nullable(),
  pixCopyPaste: z.string().nullable(),
  boletoUrl: z.string().nullable(),
  simulatable: z.boolean(),
  createdAt: z.string(),
});
export type OrderDto = z.infer<typeof orderSchema>;

/** Payload de webhook do gateway (Asaas envia algo compatível com isto). */
export const paymentWebhookSchema = z.object({
  event: z.string(),
  providerChargeId: z.string().min(1),
  status: z.enum(['paid', 'failed', 'refunded']),
});
export type PaymentWebhookDto = z.infer<typeof paymentWebhookSchema>;
