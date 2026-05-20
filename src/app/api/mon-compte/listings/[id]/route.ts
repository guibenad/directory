import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-server";

export const runtime = "nodejs";

const ServiceInput = z.object({
  id: z.string().cuid().optional(),
  title: z.string().min(2).max(120),
  items: z.array(z.string().max(200)).max(20).default([]),
  priceLabel: z.string().max(60).optional().nullable(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

const UpdateSchema = z.object({
  description: z.string().max(4000).optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  photos: z.array(z.string().url()).max(30).optional(),
  isPublished: z.boolean().optional(),
  whatsapp: z
    .string()
    .regex(/^\+?[0-9\s]{6,20}$/, "Numéro invalide")
    .optional()
    .nullable(),
  facebook: z.string().url().optional().nullable(),
  instagram: z.string().url().optional().nullable(),
  services: z.array(ServiceInput).max(30).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session?.user.companyId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing || listing.companyId !== session.user.companyId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const parsed = UpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const d = parsed.data;

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.listing.update({
      where: { id: listing.id },
      data: {
        ...(d.description !== undefined ? { description: d.description } : {}),
        ...(d.address !== undefined ? { address: d.address } : {}),
        ...(d.photos !== undefined ? { photos: d.photos } : {}),
        ...(d.isPublished !== undefined ? { isPublished: d.isPublished } : {}),
        ...(d.whatsapp !== undefined ? { whatsapp: d.whatsapp } : {}),
        ...(d.facebook !== undefined ? { facebook: d.facebook } : {}),
        ...(d.instagram !== undefined ? { instagram: d.instagram } : {}),
      },
    });

    if (d.services) {
      // Stratégie simple : on remplace l'ensemble des services à chaque save
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

    return next;
  });

  return NextResponse.json(updated);
}
