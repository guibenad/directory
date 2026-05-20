import Stripe from "stripe";

let cached: Stripe | null = null;

/**
 * Accès paresseux au SDK Stripe — ne throw qu'au premier appel réel,
 * pas à l'import, pour ne pas casser le build quand STRIPE_SECRET_KEY n'est pas défini.
 */
function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY manquant");
  cached = new Stripe(key, {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
  });
  return cached;
}

/**
 * Proxy qui forwarde tous les accès au vrai client Stripe,
 * tout en différant l'init au premier accès.
 */
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_t, prop) {
    const client = getStripe() as unknown as Record<string | symbol, unknown>;
    const value = client[prop];
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(client) : value;
  },
});

export const MAX_PAYMENT_FAILURES = 3;
