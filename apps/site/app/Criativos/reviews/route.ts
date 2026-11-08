import { proxyReviews, reviewsUrl } from '../reviews-proxy';

/**
 * Avaliações dos criativos (/Criativos). O HTML estático chama esta rota no
 * próprio domínio e o site repassa para a API (API_URL é server-side), sem CORS
 * nem URL da API embutida na página.
 */
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  return proxyReviews(reviewsUrl(), { method: 'GET' });
}
