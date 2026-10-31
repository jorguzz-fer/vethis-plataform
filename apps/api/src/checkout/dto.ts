import { z } from 'zod';
import { attributionInputSchema } from '../crm/dto';

/** Meio de pagamento escolhido no checkout (Pix como padrão de conversão). */
export const paymentMethodSchema = z.enum(['pix', 'card', 'boleto']);
export type PaymentMethodDto = z.infer<typeof paymentMethodSchema>;

/**
 * Cartão em claro — só para gateways que tokenizam no servidor (Asaas/fake).
 * Trafega só para o gateway, nunca é persistido.
 */
export const rawCardSchema = z.object({
  number: z.string().min(12).max(19),
  holderName: z.string().min(2).max(120),
  expMonth: z.coerce.number().int().min(1).max(12),
  expYear: z.coerce.number().int().min(2024).max(2100),
  cvv: z.string().min(3).max(4),
});

/** Cartão tokenizado no navegador pelo Stripe.js: só o id `pm_...` chega à API. */
export const tokenizedCardSchema = z.object({
  paymentMethodId: z.string().regex(/^pm_[A-Za-z0-9_]+$/, 'Cartão inválido'),
});

/** Cartão do checkout: tokenizado (Stripe) ou em claro (Asaas), conforme o gateway. */
export const cardSchema = z.union([tokenizedCardSchema, rawCardSchema]);
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
    // Parcelas para cartão e boleto/carnê (Pix é sempre à vista). Teto 24x.
    installments: z.coerce.number().int().min(1).max(24).default(1),
    attribution: attributionInputSchema.optional(),
  })
  .refine((v) => v.method !== 'card' || v.card != null, {
    message: 'Dados do cartão são obrigatórios para pagamento com cartão',
    path: ['card'],
  })
  // Antifraude do Asaas: cartão em claro exige telefone, CEP e número. Com a
  // Stripe (cartão tokenizado), o antifraude dela dispensa esses campos.
  .refine(
    (v) =>
      v.method !== 'card' ||
      (v.card != null && 'paymentMethodId' in v.card) ||
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
  /**
   * Cartão aguardando 3D Secure: o navegador conclui com o Stripe.js usando este
   * segredo. Só vem na resposta do checkout; `null` nas consultas do pedido.
   */
  cardClientSecret: z.string().nullable(),
});
export type OrderDto = z.infer<typeof orderSchema>;

/** Provedor que atende cada meio + teto do carnê (o site adapta o formulário). */
export const checkoutConfigSchema = z.object({
  providers: z.object({
    pix: z.string(),
    card: z.string(),
    boleto: z.string(),
  }),
  boletoMaxInstallments: z.number().int(),
});
export type CheckoutConfigDto = z.infer<typeof checkoutConfigSchema>;

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
