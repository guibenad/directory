import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentDirectory } from "@/lib/tenant";
import { siteUrl } from "@/lib/seo";
import { breadcrumbSchema } from "@/lib/seo-content";
import { PublicHeader } from "@/components/public/PublicHeader";
import { CategoryIcon } from "@/components/public/ui/CategoryIcon";

export const revalidate = 3600;
export const dynamicParams = true;

type Params = { metier: string; slug: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const directory = await getCurrentDirectory();
  if (!directory) return {};
  const [region, category] = await Promise.all([
    prisma.geoRegion.findUnique({ where: { slug: params.slug } }),
    prisma.category.findUnique({
      where: { directoryId_slug: { directoryId: directory.id, slug: params.metier } },
    }),
  ]);
  if (!region || !category) return {};
  return {
    title: `${category.label} en ${region.name} — ${directory.name}`,
    description: `Trouvez un ${category.label.toLowerCase()} en ${region.name}. Tous les départements et villes couverts.`,
    alternates: {
      canonical: `${siteUrl(directory)}/${params.metier}/region/${region.slug}`,
    },
  };
}

export default async function MetierRegionPage({ params }: { params: Params }) {
  const directory = await getCurrentDirectory();
  if (!directory) notFound();

  const [region, category] = await Promise.all([
    prisma.geoRegion.findUnique({
      where: { slug: params.slug },
      include: {
        departements: {
          orderBy: { name: "asc" },
          include: {
            villes: {
              orderBy: [{ population: "desc" }, { name: "asc" }],
              take: 10,
              select: { slug: true, name: true },
            },
            _count: { select: { villes: true } },
          },
        },
      },
    }),
    prisma.category.findUnique({
      where: { directoryId_slug: { directoryId: directory.id, slug: params.metier } },
    }),
  ]);
  if (!region || !category) notFound();

  const pagesForMetier = await prisma.seoPage.findMany({
    where: {
      directoryId: directory.id,
      metier: params.metier,
      isPublished: true,
      region: region.code,
    },
    select: { ville: true, villeLabel: true, departement: true },
  });
  const villeSlugSet = new Set(pagesForMetier.map((p) => p.ville));

  const listingsCount = await prisma.listing.count({
    where: {
      directoryId: directory.id,
      categoryId: category.id,
      isPublished: true,
      ville: { in: Array.from(villeSlugSet) },
    },
  });

  const base = siteUrl(directory);
  const crumbs = breadcrumbSchema([
    { name: "Accueil", url: `${base}/` },
    { name: category.label, url: `${base}/${category.slug}` },
    { name: region.name, url: `${base}/region/${region.slug}` },
    { name: `${category.label} en ${region.name}`, url: `${base}/${category.slug}/region/${region.slug}` },
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
            <Link href={`/${category.slug}` as never} className="hover-underline">
              {category.label}
            </Link>{" "}
            ›{" "}
            <Link href={`/region/${region.slug}` as never} className="hover-underline">
              {region.name}
            </Link>{" "}
            ›{" "}
            <strong className="text-[color:var(--ink)]">
              {category.label} en {region.name}
            </strong>
          </nav>
          <div className="flex items-center gap-3">
            <CategoryIcon
              slug={category.slug}
              label={category.label}
              icon={category.icon}
              color={category.color}
              size={56}
            />
            <h1 className="font-syne text-[clamp(30px,5vw,50px)] font-extrabold leading-[1.05] tracking-[-0.02em]">
              {category.label} en{" "}
              <span style={{ color: directory.primaryColor }}>{region.name}</span>
            </h1>
          </div>
          <p className="mt-3 max-w-2xl text-[15.5px] leading-[1.6] text-[color:var(--mute)]">
            {listingsCount} {category.label.toLowerCase()}s référencés en {region.name}.{" "}
            {region.departements.length} départements — choisissez votre ville ci-dessous.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-[1200px] space-y-10 px-6 pb-16">
        {region.departements.map((d) => (
          <section
            key={d.code}
            className="rounded-2xl border border-[color:var(--mist)] bg-white p-6 shadow-[var(--shadow-soft)]"
          >
            <header className="mb-3 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-syne text-[20px] font-bold leading-tight">
                  {category.label} dans le {d.name} ({d.code})
                </h2>
                <div className="text-[12.5px] text-[color:var(--mute)]">
                  {d._count.villes} villes
                </div>
              </div>
              <Link
                href={`/${category.slug}/departement/${d.slug}` as never}
                className="text-[13px] font-medium text-[color:var(--ink-2)] hover-underline"
              >
                Voir tout le département →
              </Link>
            </header>
            <ul className="flex flex-wrap gap-2">
              {d.villes.map((v) => {
                const hasPage = villeSlugSet.has(v.slug);
                return (
                  <li key={v.slug}>
                    <Link
                      href={
                        hasPage
                          ? (`/${category.slug}/${v.slug}` as never)
                          : (`/ville/${v.slug}` as never)
                      }
                      className="pill"
                    >
                      {v.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </main>

      <footer className="border-t border-[color:var(--mist)] bg-white/60">
        <div className="mx-auto max-w-[1200px] px-6 py-10 text-center text-[13px] text-[color:var(--mute)]">
          {directory.name} · {category.label} en {region.name}
        </div>
      </footer>
    </div>
  );
}
