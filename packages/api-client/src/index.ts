/**
 * @vethis/api-client — cliente HTTP tipado da API Vethis.
 *
 * No M1 este pacote passa a ser GERADO a partir do contrato OpenAPI 3.1 da API
 * (fonte de verdade). Por ora, apenas o tipo base da configuração.
 */

export interface ApiClientConfig {
  /** Base URL da API, ex.: https://api.vethis.com.br/v1 */
  baseUrl: string;
  /** Envia cookies de sessão (httpOnly) nas requisições do first-party. */
  credentials?: RequestCredentials;
}
