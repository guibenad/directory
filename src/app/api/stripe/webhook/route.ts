import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe, MAX_PAYMENT_FAILURES } from "@/lib/stripe";
import {
  sendCancellationEmail,
  sendPaymentFailedEmail,
  sendWelcomeEmail,
} from "@/lib/resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "invalid_signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await onSubscriptionChanged(event.data.object);
        break;
      case "customer.subscription.deleted":
        await onSubscriptionDeleted(event.data.object);
        break;
      case "invoice.payment_succeeded":
        await onInvoiceSucceeded(event.data.object);
        break;
      case "invoice.payment_failed":
        await onInvoiceFailed(event.data.object);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error(`Webhook ${event.type} failed`, err);
    return NextResponse.json({ error: "handler_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function onSubscriptionChanged(stripeSub: Stripe.Subscription) {
  const sub = await prisma.subscription.findUnique({
    where: { stripeSubId: stripeSub.id },
    include: { company: true, directory: true, plan: true },
  });
  if (!sub) return;

  const wasTrial = sub.status === "TRIAL";
  const nowActive = stripeSub.status === "active" || stripeSub.status === "trialing";

  await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      status: nowActive ? "ACTIVE" : sub.status,
      paymentFailures: 0,
    },
  });

  if (nowActive && wasTrial) {
    sendWelcomeEmail(sub.company.email, sub.company.name).catch((err) =>
      console.error("sendWelcomeEmail", err),
    );
  }
}

async function onSubscriptionDeleted(stripeSub: Stripe.Subscription) {
  const sub = await prisma.subscription.findUnique({
    where: { stripeSubId: stripeSub.id },
    include: { company: true },
  });
  if (!sub) return;

  const end = new Date();
  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: "CANCELLED", subscriptionEnd: end },
  });

  sendCancellationEmail(sub.company.email, sub.company.name, end).catch((err) =>
    console.error("sendCancellationEmail", err),
  );
}

async function onInvoiceSucceeded(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  const company = await prisma.company.findUnique({
    where: { stripeCustomerId: customerId },
  });
  if (!company) return;

  // Retrouve la Subscription concernée
  const subStripeId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
  const sub = subStripeId
    ? await prisma.subscription.findUnique({ where: { stripeSubId: subStripeId } })
    : null;

  await prisma.payment.create({
    data: {
      companyId: company.id,
      directoryId: sub?.directoryId ?? null,
      subscriptionId: sub?.id ?? null,
      stripeInvoiceId: invoice.id,
      amountCents: invoice.amount_paid,
      currency: invoice.currency,
      status: "succeeded",
    },
  });

  if (sub) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { paymentFailures: 0 },
    });
  }
}

async function onInvoiceFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  const company = await prisma.company.findUnique({
    where: { stripeCustomerId: customerId },
  });
  if (!company) return;

  const subStripeId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
  const sub = subStripeId
    ? await prisma.subscription.findUnique({ where: { stripeSubId: subStripeId } })
    : null;

  await prisma.payment.create({
    data: {
      companyId: company.id,
      directoryId: sub?.directoryId ?? null,
      subscriptionId: sub?.id ?? null,
      stripeInvoiceId: invoice.id,
      amountCents: invoice.amount_due,
      currency: invoice.currency,
      status: "failed",
    },
  });

  if (sub) {
    const failures = sub.paymentFailures + 1;
    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        paymentFailures: failures,
        ...(failures >= MAX_PAYMENT_FAILURES ? { status: "SUSPENDED" } : {}),
      },
    });

    if (failures >= MAX_PAYMENT_FAILURES) {
      sendPaymentFailedEmail(company.email, company.name).catch((err) =>
        console.error("sendPaymentFailedEmail", err),
      );
    }
  }
}
