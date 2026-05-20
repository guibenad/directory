import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

const BodySchema = z.object({ subscriptionId: z.string().cuid() });

export async function POST(req: Request) {
  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const sub = await prisma.subscription.findUnique({
    where: { id: parsed.data.subscriptionId },
    include: { company: true, plan: true, directory: true },
  });
  if (!sub) return NextResponse.json({ error: "subscription_not_found" }, { status: 404 });
  if (!sub.plan.stripePriceId) {
    return NextResponse.json({ error: "plan_not_priced_in_stripe" }, { status: 500 });
  }

  // 1) Customer Stripe
  let customerId = sub.company.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: sub.company.email,
      name: sub.company.name,
      metadata: { companyId: sub.companyId },
    });
    customerId = customer.id;
    await prisma.company.update({
      where: { id: sub.companyId },
      data: { stripeCustomerId: customerId },
    });
  }

  // 2) Si déjà lié à une sub Stripe, on renvoie l'état — sinon on crée
  if (sub.stripeSubId) {
    const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubId, {
      expand: ["latest_invoice.payment_intent", "pending_setup_intent"],
    });
    return NextResponse.json(buildClientSecretResponse(stripeSub));
  }

  const stripeSub = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: sub.plan.stripePriceId }],
    trial_period_days: sub.plan.trialDays,
    payment_behavior: "default_incomplete",
    payment_settings: {
      save_default_payment_method: "on_subscription",
      payment_method_types: ["card"],
    },
    expand: ["latest_invoice.payment_intent", "pending_setup_intent"],
    metadata: {
      subscriptionId: sub.id,
      companyId: sub.companyId,
      directoryId: sub.directoryId,
      planId: sub.planId,
    },
  });

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { stripeSubId: stripeSub.id },
  });

  return NextResponse.json(buildClientSecretResponse(stripeSub));
}

function buildClientSecretResponse(stripeSub: import("stripe").default.Subscription) {
  const setup = stripeSub.pending_setup_intent;
  if (setup && typeof setup !== "string") {
    return {
      mode: "setup" as const,
      subscriptionId: stripeSub.id,
      clientSecret: setup.client_secret,
    };
  }
  const invoice = stripeSub.latest_invoice;
  if (invoice && typeof invoice !== "string") {
    const intent = invoice.payment_intent;
    if (intent && typeof intent !== "string") {
      return {
        mode: "payment" as const,
        subscriptionId: stripeSub.id,
        clientSecret: intent.client_secret,
      };
    }
  }
  return { mode: "none" as const, subscriptionId: stripeSub.id, clientSecret: null };
}
