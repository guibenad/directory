import { prisma } from "@/lib/prisma";
import {
  extractPlaceIdFromInput,
  fetchPlaceDetails,
  type GoogleReview,
} from "@/lib/google-places";

export type GoogleSyncResult =
  | { ok: true; placeId: string; rating: number | null; reviewCount: number | null }
  | { ok: false; error: string };

/**
 * Synchronise les données Google Places d'une fiche à partir d'un input (placeId ou URL).
 * Stocke en cache : rating, reviewCount, les 5 derniers reviews, syncedAt.
 */
export async function syncGooglePlace(opts: {
  listingId: string;
  input: string;
}): Promise<GoogleSyncResult> {
  const placeId = extractPlaceIdFromInput(opts.input);
  if (!placeId) return { ok: false, error: "place_id_invalid" };

  let details;
  try {
    details = await fetchPlaceDetails(placeId);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "fetch_failed" };
  }
  if (!details) return { ok: false, error: "not_found" };

  await prisma.listing.update({
    where: { id: opts.listingId },
    data: {
      googlePlaceId: details.placeId,
      googleRating: details.rating,
      googleReviewCount: details.userRatingsTotal,
      googleMapsUrl: details.url,
      googleReviewsJson: details.reviews as unknown as never,
      googleSyncedAt: new Date(),
    },
  });

  return {
    ok: true,
    placeId: details.placeId,
    rating: details.rating,
    reviewCount: details.userRatingsTotal,
  };
}

/**
 * Nettoie/clear l'association Google Place d'une fiche.
 */
export async function clearGooglePlace(listingId: string): Promise<void> {
  await prisma.listing.update({
    where: { id: listingId },
    data: {
      googlePlaceId: null,
      googleRating: null,
      googleReviewCount: null,
      googleMapsUrl: null,
      googleReviewsJson: null as unknown as never,
      googleSyncedAt: null,
    },
  });
}

export function parseReviews(json: unknown): GoogleReview[] {
  if (!Array.isArray(json)) return [];
  return (json as GoogleReview[]).filter(
    (r) => r && typeof r.authorName === "string" && typeof r.text === "string",
  );
}
