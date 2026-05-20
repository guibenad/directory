import { prisma } from "@/lib/prisma";

export type NearbyVille = {
  insee: string;
  slug: string;
  name: string;
  departementCode: string;
  population: number;
  lat: number | null;
  lng: number | null;
  distanceKm: number;
};

/**
 * Retourne les villes les plus proches d'un point GPS, triées par distance croissante.
 * Utilise la formule de Haversine en raw SQL (pas besoin d'extension earthdistance).
 */
export async function getNearbyVilles(opts: {
  lat: number;
  lng: number;
  maxKm?: number;
  limit?: number;
  excludeInsee?: string;
  minPopulation?: number;
}): Promise<NearbyVille[]> {
  const maxKm = opts.maxKm ?? 50;
  const limit = opts.limit ?? 12;
  const excludeInsee = opts.excludeInsee ?? "";
  const minPopulation = opts.minPopulation ?? 0;

  const rows = await prisma.$queryRaw<
    {
      insee: string;
      slug: string;
      name: string;
      departementCode: string;
      population: number;
      lat: number | null;
      lng: number | null;
      distance_km: number;
    }[]
  >`
    SELECT
      insee,
      slug,
      name,
      "departementCode",
      population,
      lat,
      lng,
      (
        6371 * acos(
          cos(radians(${opts.lat})) * cos(radians(lat)) *
          cos(radians(lng) - radians(${opts.lng})) +
          sin(radians(${opts.lat})) * sin(radians(lat))
        )
      ) AS distance_km
    FROM "GeoVille"
    WHERE
      lat IS NOT NULL AND lng IS NOT NULL
      AND insee <> ${excludeInsee}
      AND population >= ${minPopulation}
    ORDER BY distance_km ASC
    LIMIT ${Math.max(limit, 1)}
  `;

  return rows
    .filter((r) => r.distance_km <= maxKm)
    .map((r) => ({
      insee: r.insee,
      slug: r.slug,
      name: r.name,
      departementCode: r.departementCode,
      population: r.population,
      lat: r.lat,
      lng: r.lng,
      distanceKm: Number(r.distance_km.toFixed(1)),
    }));
}
