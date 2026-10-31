import { loadStripe, type Stripe } from '@stripe/stripe-js';

/** Chave publicável (pública, assada no build). Vazia = Stripe indisponível no site. */
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';

let stripePromise: Promise<Stripe | null> | null = null;

/** Stripe.js carregado uma única vez, sob demanda (só quando o cartão é Stripe). */
export function getStripe(): Promise<Stripe | null> {
  if (!publishableKey) return Promise.resolve(null);
  stripePromise ??= loadStripe(publishableKey, { locale: 'pt-BR' });
  return stripePromise;
}

export const stripeConfigured = publishableKey.length > 0;
