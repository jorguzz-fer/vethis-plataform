import { createVethisClient, type components } from '@vethis/api-client';

export type OrderDto = components['schemas']['Order'];
export type AuthUser = components['schemas']['AuthUser'];
export type PaymentMethod = 'pix' | 'card' | 'boleto';

/**
 * Cliente da API para o navegador (checkout). Usa a URL pública da API e envia
 * o cookie de sessão (credentials:'include'). O cookie é first-party no domínio
 * `.vethis.com.br`, compartilhado entre site, área do aluno e API.
 */
const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

/** URL da área do aluno — destino após a matrícula ser liberada. */
export const alunoUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:5173';

export const browserApi = createVethisClient({ baseUrl });
