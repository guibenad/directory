import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getCurrentDirectory } from "@/lib/tenant";
import { siteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const directory = await getCurrentDirectory();
  if (!directory) return [];
  const base = siteUrl(directory);

  const [seoPages, listings, regions, departements, villes, categories] = await Promise.all([
    prisma.seoPage.findMany({
      where: { directoryId: directory.id, isPublished: true },
      select: { slug: true, updatedAt: true, metier: true, ville: true, region: true, departement: true },
    }),
    prisma.listing.findMany({
      where: { directoryId: directory.id, isPublished: true },
      select: { slug: true, updatedAt: true },
      take: 50_000,
    }),
    prisma.geoRegion.findMany({ select: { slug: true } }),
    prisma.geoDepartement.findMany({ select: { slug: true } }),
    prisma.geoVille.findMany({
      where: { population: { gte: 5000 } },
      select: { slug: true },
      take: 10_000,
    }),
    prisma.category.findMany({
      where: { directoryId: directory.id },
      select: { slug: true },
    }),
  ]);

  const entries: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/regions`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  ];

  // Hubs régions
  for (const r of regions) {
    entries.push({
      url: `${base}/region/${r.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  // Hubs départements
  for (const d of departements) {
    entries.push({
      url: `${base}/departement/${d.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  // Hubs villes (pour les villes > 5000 hab)
  for (const v of villes) {
    entries.push({
      url: `${base}/ville/${v.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    });
  }

  // Hubs métier
  for (const c of categories) {
    entries.push({
      url: `${base}/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  // Hubs métier × région
  for (const c of categories) {
    for (const r of regions) {
      entries.push({
        url: `${base}/${c.slug}/region/${r.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  }

  // Hubs métier × département
  for (const c of categories) {
    for (const d of departements) {
      entries.push({
        url: `${base}/${c.slug}/departement/${d.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
  }

  // Pages SEO publiées métier × ville — priorité maximale (c'est le cœur SEO)
  for (const p of seoPages) {
    entries.push({
      url: `${base}/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "daily",
      priority: 0.9,
    });
  }

  // Fiches entreprises
  for (const l of listings) {
    entries.push({
      url: `${base}/entreprise/${l.slug}`,
      lastModified: l.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  return entries;
}
