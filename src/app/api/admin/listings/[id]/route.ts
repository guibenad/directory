import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveAdminDirectory } from "@/lib/scope";
import { AdminListingUpdateSchema } from "@/lib/validators";
import { slugify } from "@/lib/slug";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const scope = await resolveAdminDirectory({
    directory: searchParams.get("directory") ?? undefined,
  });
  if (!scope) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing || listing.directoryId !== scope.directory.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const parsed = AdminListingUpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const d = parsed.data;

  // Verify linked entities when provided
  if (d.categoryId) {
    const cat = await prisma.category.findUnique({ where: { id: d.categoryId } });
    if (!cat || cat.directoryId !== scope.directory.id) {
      return NextResponse.json({ error: "category_invalid" }, { status: 400 });
    }
  }
  if (d.planId) {
    const plan = await prisma.plan.findUnique({ where: { id: d.planId } });
    if (!plan || plan.directoryId !== scope.directory.id) {
      return NextResponse.json({ error: "plan_invalid" }, { status: 400 });
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedListing = await tx.listing.update({
      where: { id: listing.id },
      data: {
        ...(d.categoryId ? { categoryId: d.categoryId } : {}),
        ...(d.ville ? { ville: slugify(d.ville) } : {}),
        ...(d.villeLabel !== undefined ? { villeLabel: d.villeLabel } : {}),
        ...(d.description !== undefined ? { description: d.description } : {}),
        ...(d.address !== undefined ? { address: d.address } : {}),
        ...(d.photos !== undefined ? { photos: d.photos } : {}),
        ...(d.priority !== undefined ? { priority: d.priority } : {}),
        ...(d.isPublished !== undefined ? { isPublished: d.isPublished } : {}),
        ...(d.whatsapp !== undefined ? { whatsapp: d.whatsapp } : {}),
        ...(d.facebook !== undefined ? { facebook: d.facebook } : {}),
        ...(d.instagram !== undefined ? { instagram: d.instagram } : {}),
      },
    });

    if (d.services) {
      await tx.service.deleteMany({ where: { listingId: listing.id } });
      if (d.services.length > 0) {
        await tx.service.createMany({
          data: d.services.map((s, i) => ({
            listingId: listing.id,
            title: s.title,
            items: s.items.filter((x) => x.trim().length > 0),
            priceLabel: s.priceLabel || null,
            sortOrder: s.sortOrder ?? i,
          })),
        });
      }
    }

    if (
      d.companyName !== undefined ||
      d.companyEmail !== undefined ||
      d.companyPhone !== undefined ||
      d.companyWebsite !== undefined
    ) {
      await tx.company.update({
        where: { id: listing.companyId },
        data: {
          ...(d.companyName !== undefined ? { name: d.companyName } : {}),
          ...(d.companyEmail !== undefined ? { email: d.companyEmail.toLowerCase() } : {}),
          ...(d.companyPhone !== undefined ? { phone: d.companyPhone } : {}),
          ...(d.companyWebsite !== undefined ? { website: d.companyWebsite } : {}),
        },
      });
    }

    if (d.planId || d.subscriptionStatus) {
      await tx.subscription.updateMany({
        where: { companyId: listing.companyId, directoryId: scope.directory.id },
        data: {
          ...(d.planId ? { planId: d.planId } : {}),
          ...(d.subscriptionStatus ? { status: d.subscriptionStatus } : {}),
        },
      });
    }

    return updatedListing;
  });

  return NextResponse.json(result);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const scope = await resolveAdminDirectory({
    directory: searchParams.get("directory") ?? undefined,
  });
  if (!scope) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing || listing.directoryId !== scope.directory.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.listing.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
