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

/** Só dígitos, 11 (CPF) ou 14 (CNPJ). */
const cpfCnpjSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ''))
  .refine((v) => v.length === 11 || v.length === 14, 'CPF ou CNPJ inválido');

/**
 * Dados do comprador cobrados pelo gateway (Asaas exige CPF/CNPJ). CEP, número e
 * telefone são exigidos pelo antifraude no cartão — opcionais para Pix/boleto.
 */
export const checkoutCustomerSchema = z.object({
  name: z.string().min(3).max(120),
  cpfCnpj: cpfCnpjSchema,
  phone: z.string().max(20).optional(),
  postalCode: z.string().max(9).optional(),
  addressNumber: z.string().max(20).optional(),
});
export type CheckoutCustomerDto = z.infer<typeof checkoutCustomerSchema>;

/** Início do checkout: curso + comprador + meio de pagamento (cartão exige `card`). */
export const createCheckoutSchema = z
  .object({
    courseSlug: z.string().min(1),
    method: paymentMethodSchema,
    customer: checkoutCustomerSchema,
    card: cardSchema.optional(),
    attribution: attributionInputSchema.optional(),
  })
  .refine((v) => v.method !== 'card' || v.card != null, {
    message: 'Dados do cartão são obrigatórios para pagamento com cartão',
    path: ['card'],
  })
  .refine(
    (v) =>
      v.method !== 'card' ||
      (Boolean(v.customer.phone) &&
        Boolean(v.customer.postalCode) &&
        Boolean(v.customer.addressNumber)),
    {
      message: 'Telefone, CEP e número são obrigatórios para pagamento com cartão',
      path: ['customer'],
    },
  );
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

/** Payload de webhook genérico (dev/testes). */
export const paymentWebhookSchema = z.object({
  event: z.string(),
  providerChargeId: z.string().min(1),
  status: z.enum(['paid', 'failed', 'refunded']),
});
export type PaymentWebhookDto = z.infer<typeof paymentWebhookSchema>;

/** Payload de webhook do Asaas (o provedor envia o pagamento no corpo). */
export const asaasWebhookSchema = z.object({
  event: z.string(),
  payment: z
    .object({
      id: z.string(),
      status: z.string(),
      externalReference: z.string().nullable().optional(),
    })
    .optional(),
});
export type AsaasWebhookDto = z.infer<typeof asaasWebhookSchema>;
