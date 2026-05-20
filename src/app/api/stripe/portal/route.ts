import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { requireSession } from "@/lib/auth-server";

export const runtime = "nodejs";

export async function POST() {
  const session = await requireSession();
  if (!session?.user.companyId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const company = await prisma.company.findUnique({ where: { id: session.user.companyId } });
  if (!company?.stripeCustomerId) {
    return NextResponse.json({ error: "no_customer" }, { status: 400 });
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: company.stripeCustomerId,
    return_url: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/mon-compte/abonnement`,
  });
  return NextResponse.json({ url: portal.url });
}
