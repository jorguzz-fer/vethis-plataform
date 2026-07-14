/**
 * Atribuição first-touch no site. Na primeira visita com sinal de origem
 * (UTM / gclid / fbclid / referrer), guarda um cookie first-party `vethis_attr`
 * e NUNCA sobrescreve — assim o lead carrega a origem do primeiro contato.
 */

export interface AttributionInput {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referrer?: string;
  landingPath?: string;
  gclid?: string;
  fbclid?: string;
}

const COOKIE = 'vethis_attr';
const MAX_AGE = 60 * 60 * 24 * 180; // ~180 dias

function hasCookie(name: string): boolean {
  return document.cookie.split('; ').some((c) => c.startsWith(`${name}=`));
}

/** Captura a origem na primeira visita (idempotente: só grava se ainda não existe). */
export function captureFirstTouch(): void {
  if (typeof window === 'undefined' || hasCookie(COOKIE)) return;

  const p = new URLSearchParams(window.location.search);
  const val = (k: string) => p.get(k) || undefined;
  const raw: AttributionInput = {
    utmSource: val('utm_source'),
    utmMedium: val('utm_medium'),
    utmCampaign: val('utm_campaign'),
    utmContent: val('utm_content'),
    utmTerm: val('utm_term'),
    gclid: val('gclid'),
    fbclid: val('fbclid'),
    referrer: document.referrer || undefined,
    landingPath: window.location.pathname || undefined,
  };

  // Sem sinal de origem (visita direta sem UTM/referrer) → não cria cookie vazio.
  if (!raw.utmSource && !raw.gclid && !raw.fbclid && !raw.referrer) return;

  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) if (v) clean[k] = v.slice(0, 1000);

  document.cookie = `${COOKIE}=${encodeURIComponent(
    JSON.stringify(clean),
  )}; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
}

/** Lê a atribuição guardada para enviar junto do lead/checkout. */
export function readAttribution(): AttributionInput | undefined {
  if (typeof document === 'undefined') return undefined;
  const entry = document.cookie.split('; ').find((c) => c.startsWith(`${COOKIE}=`));
  if (!entry) return undefined;
  try {
    return JSON.parse(decodeURIComponent(entry.split('=').slice(1).join('='))) as AttributionInput;
  } catch {
    return undefined;
  }
}
