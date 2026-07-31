/**
 * Resolve a URL pública de um asset (capa de curso, avatar) a partir do
 * `APP_URL` atual, na hora de responder — em vez de depender do valor gravado
 * no banco no momento do seed.
 *
 * Regras:
 * - vazio → `null`;
 * - caminho relativo (`/cursos/x.png`) → prefixa com `APP_URL`;
 * - URL absoluta com host local (localhost/127.0.0.1/0.0.0.0) → troca a origem
 *   por `APP_URL` (corrige dados semeados antes do `APP_URL` estar definido);
 * - URL absoluta com host externo (ex.: CDN) → mantém como está.
 */
export function resolveAssetUrl(appUrl: string, stored: string | null | undefined): string | null {
  if (!stored) return null;
  const base = appUrl.replace(/\/+$/, '');

  if (stored.startsWith('/')) return `${base}${stored}`;

  try {
    const url = new URL(stored);
    const local =
      url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '0.0.0.0';
    return local ? `${base}${url.pathname}${url.search}` : stored;
  } catch {
    // Não é URL absoluta nem caminho com barra — trata como caminho relativo.
    return `${base}/${stored}`;
  }
}
