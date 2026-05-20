import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveAdminDirectory } from "@/lib/scope";
import { AdminListingCreateSchema } from "@/lib/validators";
import { slugify, uniqueSlug } from "@/lib/slug";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const scope = await resolveAdminDirectory({
    directory: searchParams.get("directory") ?? undefined,
  });
  if (!scope) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const q = searchParams.get("q")?.trim() || undefined;
  const categoryId = searchParams.get("categoryId") || undefined;
  const ville = searchParams.get("ville")?.trim() || undefined;
  const planId = searchParams.get("planId") || undefined;
  const status = searchParams.get("status") as
    | "TRIAL"
    | "ACTIVE"
    | "SUSPENDED"
    | "CANCELLED"
    | null;
  const published = searchParams.get("published");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const perPage = Math.min(100, Math.max(1, Number(searchParams.get("perPage") ?? 25)));

  const where: Prisma.ListingWhereInput = {
    directoryId: scope.directory.id,
    ...(categoryId ? { categoryId } : {}),
    ...(ville ? { ville: { contains: slugify(ville), mode: "insensitive" } } : {}),
    ...(published === "true" ? { isPublished: true } : {}),
    ...(published === "false" ? { isPublished: false } : {}),
    ...(q
      ? {
          OR: [
            { slug: { contains: q, mode: "insensitive" } },
            { company: { name: { contains: q, mode: "insensitive" } } },
            { company: { email: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  // Filtre par plan/status : il faut joindre via Subscription
  if (planId || status) {
    where.company = {
      ...(where.company as Prisma.CompanyWhereInput),
      subscriptions: {
        some: {
          directoryId: scope.directory.id,
          ...(planId ? { planId } : {}),
          ...(status ? { status } : {}),
        },
      },
    };
  }

  const [items, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        company: { select: { name: true, email: true } },
        category: { select: { label: true, slug: true } },
        _count: { select: { messages: true, reviews: true } },
      },
    }),
    prisma.listing.count({ where }),
  ]);

  // Récupère le plan actif par fiche (pour afficher Pro/Essentiel/Starter)
  const subs = await prisma.subscription.findMany({
    where: {
      directoryId: scope.directory.id,
      companyId: { in: items.map((l) => l.companyId) },
    },
    include: { plan: { select: { key: true, name: true } } },
  });
  const planByCompany = new Map(subs.map((s) => [s.companyId, s]));

  return NextResponse.json({
    items: items.map((l) => ({
      id: l.id,
      slug: l.slug,
      companyName: l.company.name,
      companyEmail: l.company.email,
      categoryLabel: l.category.label,
      categorySlug: l.category.slug,
      ville: l.ville,
      villeLabel: l.villeLabel,
      isPublished: l.isPublished,
      priority: l.priority,
      rating: l.rating,
      reviewCount: l.reviewCount,
      messagesCount: l._count.messages,
      reviewsCount: l._count.reviews,
      planKey: planByCompany.get(l.companyId)?.plan.key ?? null,
      subscriptionStatus: planByCompany.get(l.companyId)?.status ?? null,
      createdAt: l.createdAt.toISOString(),
    })),
    pagination: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    },
  });
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const scope = await resolveAdminDirectory({
    directory: searchParams.get("directory") ?? undefined,
  });
  if (!scope) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = AdminListingCreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const [category, plan] = await Promise.all([
    prisma.category.findUnique({ where: { id: data.categoryId } }),
    prisma.plan.findUnique({ where: { id: data.planId } }),
  ]);
  if (!category || category.directoryId !== scope.directory.id) {
    return NextResponse.json({ error: "category_not_found" }, { status: 404 });
  }
  if (!plan || plan.directoryId !== scope.directory.id) {
    return NextResponse.json({ error: "plan_not_found" }, { status: 404 });
  }

  const email = data.companyEmail.toLowerCase();
  let company = await prisma.company.findUnique({ where: { email } });
  if (!company) {
    const globalSlug = await uniqueSlug(data.companyName, async (s) =>
      Boolean(await prisma.company.findUnique({ where: { slug: s } })),
    );
    company = await prisma.company.create({
      data: {
        name: data.companyName,
        slug: globalSlug,
        email,
        phone: data.companyPhone,
        website: data.companyWebsite,
      },
    });
  }

  const listingSlug = await uniqueSlug(data.companyName, async (s) =>
    Boolean(
      await prisma.listing.findUnique({
        where: { directoryId_slug: { directoryId: scope.directory.id, slug: s } },
      }),
    ),
  );

  const result = await prisma.$transaction(async (tx) => {
    const listing = await tx.listing.upsert({
      where: {
        companyId_directoryId: { companyId: company!.id, directoryId: scope.directory.id },
      },
      update: {
        categoryId: category.id,
        ville: slugify(data.ville),
        villeLabel: data.villeLabel ?? data.ville,
        description: data.description,
        address: data.address,
        isPublished: data.isPublished ?? true,
        priority: plan.priority,
      },
      create: {
        companyId: company!.id,
        directoryId: scope.directory.id,
        categoryId: category.id,
        slug: listingSlug,
        ville: slugify(data.ville),
        villeLabel: data.villeLabel ?? data.ville,
        description: data.description,
        address: data.address,
        isPublished: data.isPublished ?? true,
        priority: plan.priority,
      },
    });

    const subscription = await tx.subscription.upsert({
      where: {
        companyId_directoryId: { companyId: company!.id, directoryId: scope.directory.id },
      },
      update: { planId: plan.id, status: data.status ?? "ACTIVE" },
      create: {
        companyId: company!.id,
        directoryId: scope.directory.id,
        planId: plan.id,
        status: data.status ?? "ACTIVE",
      },
    });

    return { listing, subscription };
  });

  return NextResponse.json(result, { status: 201 });
}
