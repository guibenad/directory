import { prisma } from "@/lib/prisma";
import type { ListingCardData } from "@/components/public/ListingCard";

type FetchOpts = {
  directoryId: string;
  villeSlugs?: string[]; // filtre par villes (region/département/ville)
  categorySlug?: string;
  limit?: number;
};

/**
 * Charge des listings publiés pour un annuaire + filtres géo/catégorie,
 * trie par priorité puis note puis date, et attache le planKey de
 * l'abonnement actif (pour afficher badges Pro/Certifié).
 */
export async function fetchListingsForCard(opts: FetchOpts): Promise<ListingCardData[]> {
  const listings = await prisma.listing.findMany({
    where: {
      directoryId: opts.directoryId,
      isPublished: true,
      ...(opts.villeSlugs && opts.villeSlugs.length > 0
        ? { ville: { in: opts.villeSlugs } }
        : {}),
      ...(opts.categorySlug ? { category: { slug: opts.categorySlug } } : {}),
    },
    orderBy: [{ priority: "desc" }, { rating: "desc" }, { createdAt: "asc" }],
    take: opts.limit ?? 24,
    include: {
      company: { select: { name: true, phone: true } },
      category: { select: { slug: true, label: true, icon: true, color: true } },
    },
  });

  if (listings.length === 0) return [];

  const subs = await prisma.subscription.findMany({
    where: {
      directoryId: opts.directoryId,
      companyId: { in: listings.map((l) => l.companyId) },
      status: { in: ["ACTIVE", "TRIAL"] },
    },
    include: { plan: { select: { key: true } } },
  });
  const planByCompany = new Map(subs.map((s) => [s.companyId, s.plan.key]));

  return listings.map((l) => ({
    id: l.id,
    slug: l.slug,
    companyName: l.company.name,
    companyPhone: l.company.phone,
    category: l.category,
    ville: l.ville,
    villeLabel: l.villeLabel,
    address: l.address,
    rating: l.rating,
    reviewCount: l.reviewCount,
    planKey: planByCompany.get(l.companyId) ?? null,
  }));
}
