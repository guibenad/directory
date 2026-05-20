import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentDirectory } from "@/lib/tenant";
import { siteUrl } from "@/lib/seo";
import { breadcrumbSchema } from "@/lib/seo-content";
import { getNearbyVilles } from "@/lib/geo-nearby";
import { fetchListingsForCard } from "@/lib/listings";
import { PublicHeader } from "@/components/public/PublicHeader";
import { ListingCard } from "@/components/public/ListingCard";
import { CategoryIcon } from "@/components/public/ui/CategoryIcon";

export const revalidate = 3600;
export const dynamicParams = true;

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const villes = await prisma.geoVille.findMany({
    select: { slug: true },
    where: { population: { gte: 5000 } },
    take: 1000,
  });
  return villes.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const directory = await getCurrentDirectory();
  if (!directory) return {};
  const ville = await prisma.geoVille.findUnique({ where: { slug: params.slug } });
  if (!ville) return {};
  return {
    title: `Professionnels à ${ville.name} — ${directory.name}`,
    description: `Tous les métiers et professionnels à ${ville.name}. Comparez, lisez les avis et demandez un devis gratuit.`,
    alternates: { canonical: `${siteUrl(directory)}/ville/${ville.slug}` },
  };
}

export default async function VillePage({ params }: { params: Params }) {
  const directory = await getCurrentDirectory();
  if (!directory) notFound();

  const ville = await prisma.geoVille.findUnique({
    where: { slug: params.slug },
    include: { departement: { include: { region: true } } },
  });
  if (!ville) notFound();

  const [categories, listingsCount, topListings] = await Promise.all([
    prisma.category.findMany({
      where: { directoryId: directory.id },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    }),
    prisma.listing.count({
      where: { directoryId: directory.id, isPublished: true, ville: ville.slug },
    }),
    fetchListingsForCard({
      directoryId: directory.id,
      villeSlugs: [ville.slug],
      limit: 12,
    }),
  ]);

  // Pages SEO qui existent pour cette ville
  const seoPages = await prisma.seoPage.findMany({
    where: {
      directoryId: directory.id,
      ville: ville.slug,
      isPublished: true,
    },
    select: { metier: true, metierLabel: true },
  });
  const seoMetierSet = new Set(seoPages.map((p) => p.metier));

  // Listings par catégorie dans la ville
  const countsRaw = await prisma.listing.groupBy({
    by: ["categoryId"],
    where: { directoryId: directory.id, ville: ville.slug, isPublished: true },
    _count: { _all: true },
  });
  const countByCategory = new Map(countsRaw.map((r) => [r.categoryId, r._count._all]));

  const nearby =
    ville.lat != null && ville.lng != null
      ? await getNearbyVilles({
          lat: ville.lat,
          lng: ville.lng,
          maxKm: 50,
          limit: 12,
          excludeInsee: ville.insee,
        })
      : [];

  const base = siteUrl(directory);
  const crumbs = breadcrumbSchema([
    { name: "Accueil", url: `${base}/` },
    { name: "Régions", url: `${base}/regions` },
    { name: ville.departement.region.name, url: `${base}/region/${ville.departement.region.slug}` },
    { name: ville.departement.name, url: `${base}/departement/${ville.departement.slug}` },
    { name: ville.name, url: `${base}/ville/${ville.slug}` },
  ]);

  return (
    <div className="theme-public min-h-screen" style={{ ["--brand" as never]: directory.primaryColor }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />
      <PublicHeader directory={directory} />

      <section className="relative overflow-hidden">
        <div className="hero-mesh-light noise absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-[1200px] px-6 py-12">
          <nav className="mb-3 text-[13px] text-[color:var(--mute)]">
            <Link href="/" className="hover-underline">Accueil</Link> ›{" "}
            <Link href={`/region/${ville.departement.region.slug}` as never} className="hover-underline">
              {ville.departement.region.name}
            </Link>{" "}
            ›{" "}
            <Link href={`/departement/${ville.departement.slug}` as never} className="hover-underline">
              {ville.departement.name}
            </Link>{" "}
            › <strong className="text-[color:var(--ink)]">{ville.name}</strong>
          </nav>
          <h1 className="font-syne text-[clamp(32px,5vw,52px)] font-extrabold leading-[1.05] tracking-[-0.02em]">
            Professionnels à{" "}
            <span style={{ color: directory.primaryColor }}>{ville.name}</span>
          </h1>
          <p className="mt-3 max-w-2xl text-[15.5px] leading-[1.6] text-[color:var(--mute)]">
            {ville.name}{" "}
            {ville.population > 0 ? `(${ville.population.toLocaleString("fr-FR")} habitants)` : ""} —{" "}
            {ville.departement.name} ({ville.departement.code}). Sélectionnez un métier pour voir
            les pros référencés.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-[1200px] space-y-14 px-6 pb-16">
        {topListings.length > 0 ? (
          <section>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--mute)]">
              Professionnels en vedette
            </div>
            <h2 className="mb-6 font-syne text-[24px] font-bold">
              {listingsCount} pros à {ville.name}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topListings.map((l, i) => (
                <ListingCard key={l.id} listing={l} animationDelay={i * 30} />
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <h2 className="mb-6 font-syne text-[24px] font-bold">
            Choisissez un métier à {ville.name}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((c) => {
              const n = countByCategory.get(c.id) ?? 0;
              const hasPage = seoMetierSet.has(c.slug);
              return (
                <Link
                  key={c.id}
                  href={
                    hasPage
                      ? (`/${c.slug}/${ville.slug}` as never)
                      : (`/${c.slug}` as never)
                  }
                  className="card-lift flex items-center gap-3 rounded-2xl border border-[color:var(--mist)] bg-white p-4"
                >
                  <CategoryIcon
                    slug={c.slug}
                    label={c.label}
                    icon={c.icon}
                    color={c.color}
                    size={44}
                  />
                  <div>
                    <div className="font-syne text-[15px] font-bold leading-tight text-[color:var(--ink)]">
                      {c.label}
                    </div>
                    <div className="text-[11.5px] text-[color:var(--mute)]">
                      {n > 0 ? `${n} pro${n > 1 ? "s" : ""}` : "Dans les environs"}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {nearby.length > 0 ? (
          <section>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--mute)]">
              Villes proches · 50 km
            </div>
            <h2 className="mb-5 font-syne text-[22px] font-bold">
              Autour de {ville.name}
            </h2>
            <ul className="flex flex-wrap gap-2">
              {nearby.map((n) => (
                <li key={n.insee}>
                  <Link href={`/ville/${n.slug}` as never} className="pill">
                    {n.name}
                    <span className="text-[10.5px] text-[color:var(--mute-2)]">· {n.distanceKm} km</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>

      <footer className="border-t border-[color:var(--mist)] bg-white/60">
        <div className="mx-auto max-w-[1200px] px-6 py-10 text-center text-[13px] text-[color:var(--mute)]">
          {directory.name} · {ville.name}, {ville.departement.name}
        </div>
      </footer>
    </div>
  );
}
