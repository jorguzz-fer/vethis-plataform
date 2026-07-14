import { text } from 'drizzle-orm/pg-core';

/**
 * Colunas de atribuição first-touch (UTM + referrer + click ids do anúncio).
 * Fábrica: retorna builders novos a cada chamada (para reuso em `leads` e `orders`).
 * Nuláveis — nem todo lead/pedido chega com atribuição.
 */
export const attributionColumns = () => ({
  utmSource: text('utm_source'),
  utmMedium: text('utm_medium'),
  utmCampaign: text('utm_campaign'),
  utmContent: text('utm_content'),
  utmTerm: text('utm_term'),
  referrer: text('referrer'),
  landingPath: text('landing_path'),
  gclid: text('gclid'),
  fbclid: text('fbclid'),
});
