import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth-server";
import { slugify, uniqueSlug } from "@/lib/slug";

export const runtime = "nodejs";

const BodySchema = z.object({
  directoryId: z.string().cuid(),
  categoryId: z.string().cuid(),
  planId: z.string().cuid(),
  ville: z.string().min(2).max(60),
  villeLabel: z.string().max(80).optional(),
  description: z.string().max(2000).optional(),
  address: z.string().max(200).optional(),
  status: z.enum(["TRIAL", "ACTIVE", "SUSPENDED", "CANCELLED"]).optional(),
  isPublished: z.boolean().optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const d = parsed.data;

  const company = await prisma.company.findUnique({ where: { id: params.id } });
  if (!company) return NextResponse.json({ error: "company_not_found" }, { status: 404 });

  const [directory, category, plan] = await Promise.all([
    prisma.directory.findUnique({ where: { id: d.directoryId } }),
    prisma.category.findUnique({ where: { id: d.categoryId } }),
    prisma.plan.findUnique({ where: { id: d.planId } }),
  ]);
  if (!directory) return NextResponse.json({ error: "directory_not_found" }, { status: 404 });
  if (!category || category.directoryId !== directory.id) {
    return NextResponse.json({ error: "category_invalid" }, { status: 400 });
  }
  if (!plan || plan.directoryId !== directory.id) {
    return NextResponse.json({ error: "plan_invalid" }, { status: 400 });
  }

  // Check if already subscribed
  const existing = await prisma.subscription.findUnique({
    where: {
      companyId_directoryId: { companyId: company.id, directoryId: directory.id },
    },
  });
  if (existing && existing.status !== "CANCELLED") {
    return NextResponse.json({ error: "already_subscribed" }, { status: 409 });
  }

  const listingSlug = await uniqueSlug(company.name, async (s) =>
    Boolean(
      await prisma.listing.findUnique({
        where: { directoryId_slug: { directoryId: directory.id, slug: s } },
      }),
    ),
  );

  const result = await prisma.$transaction(async (tx) => {
    const listing = await tx.listing.upsert({
      where: {
        companyId_directoryId: { companyId: company.id, directoryId: directory.id },
      },
      update: {
        categoryId: category.id,
        ville: slugify(d.ville),
        villeLabel: d.villeLabel ?? d.ville,
        description: d.description,
        address: d.address,
        isPublished: d.isPublished ?? true,
        priority: plan.priority,
      },
      create: {
        companyId: company.id,
        directoryId: directory.id,
        categoryId: category.id,
        slug: listingSlug,
        ville: slugify(d.ville),
        villeLabel: d.villeLabel ?? d.ville,
        description: d.description,
        address: d.address,
        isPublished: d.isPublished ?? true,
        priority: plan.priority,
      },
    });

    const subscription = await tx.subscription.upsert({
      where: {
        companyId_directoryId: { companyId: company.id, directoryId: directory.id },
      },
      update: { planId: plan.id, status: d.status ?? "TRIAL" },
      create: {
        companyId: company.id,
        directoryId: directory.id,
        planId: plan.id,
        status: d.status ?? "TRIAL",
      },
    });

    return { listing, subscription };
  });

  return NextResponse.json(result, { status: 201 });
}
