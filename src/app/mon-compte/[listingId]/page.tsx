import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-server";
import { ListingEditForm } from "./ListingEditForm";

export const dynamic = "force-dynamic";

export default async function ListingEditPage({ params }: { params: { listingId: string } }) {
  const session = await requireSession();
  if (!session?.user.companyId) notFound();

  const listing = await prisma.listing.findUnique({
    where: { id: params.listingId },
    include: {
      directory: { select: { name: true, primaryColor: true } },
      category: { select: { label: true } },
      services: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!listing || listing.companyId !== session.user.companyId) notFound();

  return (
    <div className="space-y-4">
      <Link href="/mon-compte" className="text-[13px] text-text3 hover:text-amber">
        ← Retour
      </Link>
      <div>
        <h1 className="font-syne text-[22px] font-bold">
          {listing.directory.name} · {listing.category.label} à {listing.villeLabel ?? listing.ville}
        </h1>
        <p className="mt-1 text-[13.5px] text-text3">
          Enrichissez votre fiche : description, galerie, services, tarifs, réseaux sociaux.{" "}
          <Link
            href={`/entreprise/${listing.slug}` as never}
            target="_blank"
            className="text-amber hover:underline"
          >
            Voir la fiche publique ↗
          </Link>
        </p>
      </div>

      <ListingEditForm
        listing={{
          id: listing.id,
          description: listing.description,
          address: listing.address,
          photos: listing.photos,
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
        }}
      />
    </div>
  );
}
