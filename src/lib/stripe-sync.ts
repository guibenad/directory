import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

/**
 * Assure qu'un Plan a un Product + Price Stripe actifs.
 * - Crée le Product s'il n'existe pas (stockage de l'ID dans Plan.features n'est pas une option → on utilise metadata Stripe)
 * - Crée une nouvelle Price si le priceCents courant ne correspond pas à celle liée
 * - Archive l'ancienne Price (on ne peut pas la modifier dans Stripe)
 * Retourne le `stripePriceId` à jour.
 */
export async function syncPlanWithStripe(planId: string): Promise<{ stripePriceId: string }> {
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    include: { directory: { select: { name: true, slug: true } } },
  });
  if (!plan) throw new Error("plan_not_found");

  const productName = `${plan.directory.name} — ${plan.name}`;
  const productMetadata = {
    directorySlug: plan.directory.slug,
    planId: plan.id,
    planKey: plan.key,
  };

  // Résoudre/créer le Product via search metadata
  let productId: string | null = null;
  if (plan.stripePriceId) {
    const existing = await stripe.prices.retrieve(plan.stripePriceId).catch(() => null);
    if (existing && typeof existing.product === "string") {
      productId = existing.product;
    }
  }
  if (!productId) {
    const search = await stripe.products.search({
      query: `metadata["planId"]:"${plan.id}"`,
      limit: 1,
    });
    productId = search.data[0]?.id ?? null;
  }
  if (!productId) {
    const product = await stripe.products.create({
      name: productName,
      metadata: productMetadata,
    });
    productId = product.id;
  } else {
    await stripe.products.update(productId, {
      name: productName,
      metadata: productMetadata,
    });
  }

  // Si la Price existante correspond, on réutilise
  if (plan.stripePriceId) {
    const existing = await stripe.prices.retrieve(plan.stripePriceId).catch(() => null);
    if (
      existing?.active &&
      existing.unit_amount === plan.priceCents &&
      existing.currency === "eur" &&
      existing.recurring?.interval === "month" &&
      (typeof existing.product === "string" ? existing.product : existing.product.id) === productId
    ) {
      return { stripePriceId: existing.id };
    }
    if (existing?.active) {
      await stripe.prices.update(existing.id, { active: false });
    }
  }

  const price = await stripe.prices.create({
    currency: "eur",
    unit_amount: plan.priceCents,
    recurring: { interval: "month" },
    product: productId,
    metadata: productMetadata,
  });

  await prisma.plan.update({
    where: { id: plan.id },
    data: { stripePriceId: price.id },
  });

  return { stripePriceId: price.id };
}
