/**
 * @vethis/api-client — cliente HTTP tipado da API Vethis.
 *
 * Os tipos em `schema.ts` são GERADOS do contrato OpenAPI 3.1 da API
 * (`apps/api/openapi.json`) — fonte de verdade. Regerar com `pnpm generate`
 * sempre que o contrato mudar. Não editar `schema.ts` à mão.
 */
import createClient, { type Client } from 'openapi-fetch';
import type { paths } from './schema';

export interface VethisClientConfig {
  /** Base URL da API, ex.: https://api.vethis.com.br */
  baseUrl: string;
  /** fetch customizado (SSR/testes). Padrão: fetch global. */
  fetch?: typeof globalThis.fetch;
}

/**
 * Cria um client tipado. `credentials: 'include'` envia o cookie de sessão
 * httpOnly (first-party) nas requisições autenticadas.
 */
export function createVethisClient(config: VethisClientConfig): Client<paths> {
  return createClient<paths>({
    baseUrl: config.baseUrl,
    credentials: 'include',
    ...(config.fetch ? { fetch: config.fetch } : {}),
  });
}

export type VethisClient = Client<paths>;
export type { paths, components } from './schema';
