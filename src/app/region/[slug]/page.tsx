import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentDirectory } from "@/lib/tenant";
import { siteUrl } from "@/lib/seo";
import { breadcrumbSchema } from "@/lib/seo-content";
import { fetchListingsForCard } from "@/lib/listings";
import { PublicHeader } from "@/components/public/PublicHeader";
import { ListingCard } from "@/components/public/ListingCard";
import { CategoryIcon } from "@/components/public/ui/CategoryIcon";

export const revalidate = 3600;
export const dynamicParams = true;

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const regions = await prisma.geoRegion.findMany({ select: { slug: true } });
  return regions.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const directory = await getCurrentDirectory();
  if (!directory) return {};
  const region = await prisma.geoRegion.findUnique({ where: { slug: params.slug } });
  if (!region) return {};
  return {
    title: `${directory.name} en ${region.name} — trouver un pro`,
    description: `Trouvez un professionnel en ${region.name}. Tous les départements et villes couverts par ${directory.name}.`,
    alternates: { canonical: `${siteUrl(directory)}/region/${region.slug}` },
  };
}

export default async function RegionPage({ params }: { params: Params }) {
  const directory = await getCurrentDirectory();
  if (!directory) notFound();

  const region = await prisma.geoRegion.findUnique({
    where: { slug: params.slug },
    include: {
      departements: {
        orderBy: { name: "asc" },
        include: {
          villes: {
            orderBy: [{ population: "desc" }, { name: "asc" }],
            take: 12,
            select: { slug: true, name: true, population: true },
          },
          _count: { select: { villes: true } },
        },
      },
    },
  });
  if (!region) notFound();

  const villeSlugsInRegion = region.departements.flatMap((d) =>
    d.villes.map((v) => v.slug),
  );

  // Catégories, listings totaux + top listings de la région
  const [categories, listingsCount, topListings] = await Promise.all([
    prisma.category.findMany({
      where: { directoryId: directory.id },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    }),
    prisma.listing.count({
      where: {
        directoryId: directory.id,
        isPublished: true,
        ville: { in: villeSlugsInRegion },
      },
    }),
    fetchListingsForCard({
      directoryId: directory.id,
      villeSlugs: villeSlugsInRegion,
      limit: 12,
    }),
  ]);

  const totalVilles = region.departements.reduce((s, d) => s + d._count.villes, 0);
  const base = siteUrl(directory);
  const crumbs = breadcrumbSchema([
    { name: "Accueil", url: `${base}/` },
    { name: "Régions", url: `${base}/regions` },
    { name: region.name, url: `${base}/region/${region.slug}` },
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
        <div className="relative mx-auto max-w-[1200px] px-6 py-14">
          <nav className="mb-3 text-[13px] text-[color:var(--mute)]">
            <Link href="/" className="hover-underline">Accueil</Link> ›{" "}
            <Link href="/regions" className="hover-underline">Régions</Link> ›{" "}
            <strong className="text-[color:var(--ink)]">{region.name}</strong>
          </nav>
          <h1 className="font-syne text-[clamp(32px,5vw,52px)] font-extrabold leading-[1.05] tracking-[-0.02em]">
            {directory.name} en{" "}
            <span style={{ color: directory.primaryColor }}>{region.name}</span>
          </h1>
          <p className="mt-3 max-w-2xl text-[15.5px] leading-[1.6] text-[color:var(--mute)]">
            {region.departements.length} département{region.departements.length > 1 ? "s" : ""},{" "}
            {totalVilles.toLocaleString("fr-FR")} villes, {listingsCount} professionnels référencés
            dans la région {region.name}.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-[1200px] space-y-14 px-6 pb-16">
        {/* Fiches en vedette */}
        {topListings.length > 0 ? (
          <section>
            <div className="mb-2 flex items-end justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--mute)]">
                  Professionnels en vedette
                </div>
                <h2 className="mt-1 font-syne text-[24px] font-bold">
                  {listingsCount} pros référencés en {region.name}
                </h2>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topListings.map((l, i) => (
                <ListingCard key={l.id} listing={l} animationDelay={i * 30} />
              ))}
            </div>
          </section>
        ) : null}

        {/* Par catégorie dans la région */}
        <section>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--mute)]">
            Recherches les plus utilisées
          </div>
          <h2 className="mb-6 font-syne text-[24px] font-bold">
            Choisissez un métier en {region.name}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/${c.slug}/region/${region.slug}` as never}
                className="card-lift flex flex-col items-start gap-3 rounded-2xl border border-[color:var(--mist)] bg-white p-5"
              >
                <CategoryIcon
                  slug={c.slug}
                  label={c.label}
                  icon={c.icon}
                  color={c.color}
                  size={44}
                />
                <div className="font-syne text-[14.5px] font-bold leading-tight text-[color:var(--ink)]">
                  {c.label}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Par département */}
        <section>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--mute)]">
            Départements
          </div>
          <h2 className="mb-6 font-syne text-[24px] font-bold">
            Les {region.departements.length} départements de {region.name}
          </h2>
          <div className="space-y-5">
            {region.departements.map((d) => (
              <article
                key={d.code}
                className="rounded-2xl border border-[color:var(--mist)] bg-white p-6 shadow-[var(--shadow-soft)]"
              >
                <header className="mb-3 flex items-end justify-between gap-4">
                  <div>
                    <h3 className="font-syne text-[18px] font-bold leading-tight">
                      <Link
                        href={`/departement/${d.slug}` as never}
                        className="text-[color:var(--ink)] hover:text-[color:var(--accent)]"
                      >
                        {d.name} ({d.code})
                      </Link>
                    </h3>
                    <div className="text-[12.5px] text-[color:var(--mute)]">
                      {d._count.villes} villes
                    </div>
                  </div>
                  <Link
                    href={`/departement/${d.slug}` as never}
                    className="text-[13px] font-medium text-[color:var(--ink-2)] hover-underline"
                  >
                    Voir toutes les villes →
                  </Link>
                </header>
                <ul className="flex flex-wrap gap-2">
                  {d.villes.map((v) => (
                    <li key={v.slug}>
                      <Link href={`/${v.slug}` as never} className="pill">
                        {v.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-[color:var(--mist)] bg-white/60">
        <div className="mx-auto max-w-[1200px] px-6 py-10 text-center text-[13px] text-[color:var(--mute)]">
          {directory.name} · {region.name}
        </div>
      </footer>
    </div>
  );
}
