import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { InscriptionSchema } from "@/lib/validators";
import { slugify, uniqueSlug } from "@/lib/slug";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const parsed = InscriptionSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const directory = await prisma.directory.findUnique({
    where: { slug: data.directorySlug },
    include: {
      plans: { where: { key: data.planKey } },
      categories: { where: { slug: data.categorySlug } },
    },
  });
  if (!directory || !directory.isActive) {
    return NextResponse.json({ error: "directory_not_found" }, { status: 404 });
  }
  const plan = directory.plans[0];
  const category = directory.categories[0];
  if (!plan) return NextResponse.json({ error: "plan_not_found" }, { status: 404 });
  if (!category) return NextResponse.json({ error: "category_not_found" }, { status: 404 });

  // Trouve ou crée la Company
  const email = data.email.toLowerCase();
  let company = await prisma.company.findUnique({ where: { email } });
  if (!company) {
    const slug = await uniqueSlug(data.name, async (s) =>
      Boolean(await prisma.company.findUnique({ where: { slug: s } })),
    );
    company = await prisma.company.create({
      data: { name: data.name, slug, email, phone: data.phone },
    });
  }

  // Vérifie qu'il n'y a pas déjà une subscription active pour ce couple
  const existing = await prisma.subscription.findUnique({
    where: { companyId_directoryId: { companyId: company.id, directoryId: directory.id } },
  });
  if (existing && existing.status !== "CANCELLED") {
    return NextResponse.json({ error: "already_subscribed" }, { status: 409 });
  }

  // Crée le Listing + la Subscription en transaction
  const listingSlug = await uniqueSlug(data.name, async (s) =>
    Boolean(
      await prisma.listing.findUnique({
        where: { directoryId_slug: { directoryId: directory.id, slug: s } },
      }),
    ),
  );

  const result = await prisma.$transaction(async (tx) => {
    const listing = await tx.listing.upsert({
      where: {
        companyId_directoryId: { companyId: company!.id, directoryId: directory.id },
      },
      update: {},
      create: {
        companyId: company!.id,
        directoryId: directory.id,
        categoryId: category.id,
        slug: listingSlug,
        ville: slugify(data.ville),
        villeLabel: data.villeLabel ?? data.ville,
        priority: plan.priority,
      },
    });

    const subscription = await tx.subscription.upsert({
      where: {
        companyId_directoryId: { companyId: company!.id, directoryId: directory.id },
      },
      update: { planId: plan.id, status: "TRIAL" },
      create: {
        companyId: company!.id,
        directoryId: directory.id,
        planId: plan.id,
        status: "TRIAL",
      },
    });

    return { listing, subscription };
  });

  return NextResponse.json({
    companyId: company.id,
    subscriptionId: result.subscription.id,
    planId: plan.id,
    directoryId: directory.id,
  });
}
