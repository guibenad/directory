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
  const deps = await prisma.geoDepartement.findMany({ select: { slug: true } });
  return deps.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const directory = await getCurrentDirectory();
  if (!directory) return {};
  const dep = await prisma.geoDepartement.findUnique({ where: { slug: params.slug } });
  if (!dep) return {};
  return {
    title: `${directory.name} dans le ${dep.name} (${dep.code}) — trouver un pro`,
    description: `Trouvez un professionnel dans le département ${dep.name}. Toutes les villes couvertes par ${directory.name}.`,
    alternates: { canonical: `${siteUrl(directory)}/departement/${dep.slug}` },
  };
}

export default async function DepartementPage({ params }: { params: Params }) {
  const directory = await getCurrentDirectory();
  if (!directory) notFound();

  const dep = await prisma.geoDepartement.findUnique({
    where: { slug: params.slug },
    include: {
      region: true,
      villes: {
        orderBy: [{ population: "desc" }, { name: "asc" }],
      },
    },
  });
  if (!dep) notFound();

  const villeSlugsInDep = dep.villes.map((v) => v.slug);
  const [categories, listingsCount, topListings] = await Promise.all([
    prisma.category.findMany({
      where: { directoryId: directory.id },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    }),
    prisma.listing.count({
      where: {
        directoryId: directory.id,
        isPublished: true,
        ville: { in: villeSlugsInDep },
      },
    }),
    fetchListingsForCard({
      directoryId: directory.id,
      villeSlugs: villeSlugsInDep,
      limit: 12,
    }),
  ]);

  // Top villes (population) et reste
  const topVilles = dep.villes.slice(0, 12);
  const otherVilles = dep.villes.slice(12);
  const base = siteUrl(directory);

  const crumbs = breadcrumbSchema([
    { name: "Accueil", url: `${base}/` },
    { name: "Régions", url: `${base}/regions` },
    { name: dep.region.name, url: `${base}/region/${dep.region.slug}` },
    { name: dep.name, url: `${base}/departement/${dep.slug}` },
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
            <Link href={`/region/${dep.region.slug}` as never} className="hover-underline">
              {dep.region.name}
            </Link>{" "}
            › <strong className="text-[color:var(--ink)]">{dep.name}</strong>
          </nav>
          <h1 className="font-syne text-[clamp(32px,5vw,52px)] font-extrabold leading-[1.05] tracking-[-0.02em]">
            {directory.name} dans le{" "}
            <span style={{ color: directory.primaryColor }}>
              {dep.name} ({dep.code})
            </span>
          </h1>
          <p className="mt-3 max-w-2xl text-[15.5px] leading-[1.6] text-[color:var(--mute)]">
            {dep.villes.length.toLocaleString("fr-FR")} communes du département {dep.name} sont
            référencées. Choisissez un métier ci-dessous ou sélectionnez votre ville directement.
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
              {listingsCount} pros référencés dans le {dep.name}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topListings.map((l, i) => (
                <ListingCard key={l.id} listing={l} animationDelay={i * 30} />
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--mute)]">
            Par métier dans le {dep.name}
          </div>
          <h2 className="mb-6 font-syne text-[24px] font-bold">
            Trouvez un métier dans le {dep.name}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/${c.slug}/departement/${dep.slug}` as never}
                className="card-lift flex items-center gap-3 rounded-2xl border border-[color:var(--mist)] bg-white p-4"
              >
                <CategoryIcon
                  slug={c.slug}
                  label={c.label}
                  icon={c.icon}
                  color={c.color}
                  size={40}
                />
                <span className="font-syne text-[14.5px] font-bold leading-tight text-[color:var(--ink)]">
                  {c.label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--mute)]">
            Principales villes
          </div>
          <h2 className="mb-5 font-syne text-[24px] font-bold">
            Les {topVilles.length} plus grandes villes du {dep.name}
          </h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {topVilles.map((v) => (
              <Link
                key={v.insee}
                href={`/ville/${v.slug}` as never}
                className="card-lift rounded-2xl border border-[color:var(--mist)] bg-white p-4"
              >
                <div className="font-syne text-[16px] font-bold leading-tight text-[color:var(--ink)]">
                  {v.name}
                </div>
                <div className="mt-1 text-[12px] text-[color:var(--mute)]">
                  {v.population > 0 ? `${v.population.toLocaleString("fr-FR")} habitants` : "—"}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {otherVilles.length > 0 ? (
          <section>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--mute)]">
              Toutes les villes
            </div>
            <h2 className="mb-5 font-syne text-[22px] font-bold">
              {otherVilles.length} autres villes du {dep.name}
            </h2>
            <ul className="flex flex-wrap gap-2">
              {otherVilles.map((v) => (
                <li key={v.insee}>
                  <Link href={`/ville/${v.slug}` as never} className="pill">
                    {v.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>

      <footer className="border-t border-[color:var(--mist)] bg-white/60">
        <div className="mx-auto max-w-[1200px] px-6 py-10 text-center text-[13px] text-[color:var(--mute)]">
          {directory.name} · {dep.name} ({dep.code})
        </div>
      </footer>
    </div>
  );
}
