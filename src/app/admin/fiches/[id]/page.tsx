import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveAdminDirectory } from "@/lib/scope";
import { ListingEditor } from "./ListingEditor";

export const dynamic = "force-dynamic";

export default async function EditListingPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { directory?: string };
}) {
  const scope = await resolveAdminDirectory(searchParams);
  if (!scope) notFound();

  const [listing, categories, plans] = await Promise.all([
    prisma.listing.findUnique({
      where: { id: params.id },
      include: {
        company: true,
        category: true,
        services: { orderBy: { sortOrder: "asc" } },
      },
    }),
    prisma.category.findMany({
      where: { directoryId: scope.directory.id },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    }),
    prisma.plan.findMany({
      where: { directoryId: scope.directory.id },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  if (!listing || listing.directoryId !== scope.directory.id) notFound();

  const subscription = await prisma.subscription.findUnique({
    where: {
      companyId_directoryId: {
        companyId: listing.companyId,
        directoryId: scope.directory.id,
      },
    },
  });

  const qs = searchParams?.directory ? `?directory=${searchParams.directory}` : "";

  return (
    <div>
      <Link
        href={`/admin/fiches${qs}` as never}
        className="mb-4 inline-flex items-center gap-1 text-[13px] text-text3 hover:text-amber"
      >
        ← Retour aux fiches
      </Link>

      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text3">
            Fiche · {scope.directory.name}
          </div>
          <h1 className="mt-1 font-syne text-[22px] font-bold">{listing.company.name}</h1>
          <p className="mt-1 text-[13.5px] text-text3">
            {listing.category.label} · {listing.villeLabel ?? listing.ville} ·{" "}
            <Link
              href={`/entreprise/${listing.slug}` as never}
              target="_blank"
              className="text-amber hover:underline"
            >
              Voir la fiche publique ↗
            </Link>
          </p>
        </div>
      </div>

      <ListingEditor
        directorySlug={searchParams?.directory}
        listing={{
          id: listing.id,
          slug: listing.slug,
          categoryId: listing.categoryId,
          ville: listing.ville,
          villeLabel: listing.villeLabel,
          description: listing.description,
          address: listing.address,
          photos: listing.photos,
          priority: listing.priority,
          isPublished: listing.isPublished,
          whatsapp: listing.whatsapp,
          facebook: listing.facebook,
          instagram: listing.instagram,
          services: listing.services.map((s) => ({
            id: s.id,
            title: s.title,
            items: s.items,
            priceLabel: s.priceLabel,
          })),
          google: {
            placeId: listing.googlePlaceId,
            rating: listing.googleRating,
            reviewCount: listing.googleReviewCount,
            syncedAt: listing.googleSyncedAt ? listing.googleSyncedAt.toISOString() : null,
            mapsUrl: listing.googleMapsUrl,
          },
          rating: listing.rating,
          reviewCount: listing.reviewCount,
          createdAt: listing.createdAt.toISOString(),
        }}
        company={{
          name: listing.company.name,
          email: listing.company.email,
          phone: listing.company.phone,
          website: listing.company.website,
        }}
        subscription={
          subscription
            ? {
                planId: subscription.planId,
                status: subscription.status,
              }
            : null
        }
        categories={categories.map((c) => ({
          id: c.id,
          slug: c.slug,
          label: c.label,
          icon: c.icon,
          color: c.color,
        }))}
        plans={plans.map((p) => ({
          id: p.id,
          name: p.name,
          key: p.key,
          priceCents: p.priceCents,
        }))}
      />
    </div>
  );
}
