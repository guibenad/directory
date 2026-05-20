import type { Directory } from "@prisma/client";

export type SeoSlug = { metier: string; ville: string };

export function siteUrl(directory?: Pick<Directory, "domains"> | null): string {
  const primary = directory?.domains?.[0];
  if (primary) return `https://${primary}`;
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

export function canonicalUrl(
  { metier, ville }: SeoSlug,
  directory?: Pick<Directory, "domains"> | null,
): string {
  return `${siteUrl(directory)}/${metier}/${ville}`;
}

export function buildTitle(metierLabel: string, villeLabel: string, brand: string): string {
  return `${metierLabel} à ${villeLabel} — Devis gratuit · ${brand}`;
}

export function buildDescription(metier: string, ville: string, count: number): string {
  return `Trouvez les meilleurs ${metier.toLowerCase()}s à ${ville}. Comparez les avis, obtenez un devis gratuit. ${count} professionnels référencés.`;
}

export function buildH1(metierLabel: string, villeLabel: string): string {
  return `${metierLabel} à ${villeLabel} — Devis gratuit · Intervention rapide`;
}

export function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
