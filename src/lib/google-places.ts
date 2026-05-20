/**
 * Intégration Google Places API — Places Details.
 * Docs : https://developers.google.com/maps/documentation/places/web-service/details
 *
 * Côté dashboard Google Cloud : activer l'API "Places API" et créer une clé.
 * Restrictions recommandées : HTTP referrer (pour le navigateur) OU IP (serveur).
 */

export type GoogleReview = {
  authorName: string;
  authorUrl?: string;
  authorPhotoUrl?: string;
  rating: number;
  relativeTime: string;
  text: string;
  time: number;
};

export type GooglePlaceDetails = {
  placeId: string;
  name: string;
  rating: number | null;
  userRatingsTotal: number | null;
  url: string | null;
  reviews: GoogleReview[];
};

/**
 * Extrait un place_id d'une URL Google Maps si possible.
 * Formats supportés :
 *   https://maps.google.com/?cid=123...
 *   https://g.page/XYZ
 *   https://www.google.com/maps/place/.../@lat,lng,z/data=.../place_id:ChIJ...
 * Retourne null si le placeId ne peut pas être extrait.
 */
export function extractPlaceIdFromInput(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Place_id direct (commence par ChIJ, ou lettres/chiffres)
  if (/^[A-Za-z0-9_-]{20,}$/.test(trimmed)) {
    return trimmed;
  }

  // Dans une URL : place_id:XXX
  const m = trimmed.match(/place_id[:=]([A-Za-z0-9_-]+)/);
  if (m) return m[1] ?? null;

  return null;
}

const FIELDS = [
  "place_id",
  "name",
  "rating",
  "user_ratings_total",
  "url",
  "reviews",
].join(",");

type RawReview = {
  author_name: string;
  author_url?: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
};

type RawResponse = {
  status: string;
  result?: {
    place_id: string;
    name: string;
    rating?: number;
    user_ratings_total?: number;
    url?: string;
    reviews?: RawReview[];
  };
  error_message?: string;
};

export async function fetchPlaceDetails(
  placeId: string,
): Promise<GooglePlaceDetails | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error("GOOGLE_PLACES_API_KEY manquant");

  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", FIELDS);
  url.searchParams.set("language", "fr");
  url.searchParams.set("reviews_sort", "newest");
  url.searchParams.set("reviews_no_translations", "true");
  url.searchParams.set("key", key);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Google Places ${res.status}`);
  }
  const data = (await res.json()) as RawResponse;
  if (data.status !== "OK" || !data.result) {
    throw new Error(data.error_message || `Google Places status=${data.status}`);
  }

  const r = data.result;
  const reviews: GoogleReview[] = (r.reviews ?? []).slice(0, 5).map((rev) => ({
    authorName: rev.author_name,
    authorUrl: rev.author_url,
    authorPhotoUrl: rev.profile_photo_url,
    rating: rev.rating,
    relativeTime: rev.relative_time_description,
    text: rev.text,
    time: rev.time,
  }));

  return {
    placeId: r.place_id,
    name: r.name,
    rating: r.rating ?? null,
    userRatingsTotal: r.user_ratings_total ?? null,
    url: r.url ?? null,
    reviews,
  };
}
