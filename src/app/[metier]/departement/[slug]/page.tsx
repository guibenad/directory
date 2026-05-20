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
  const [dep, category] = await Promise.all([
    prisma.geoDepartement.findUnique({ where: { slug: params.slug }, include: { region: true } }),
    prisma.category.findUnique({
      where: { directoryId_slug: { directoryId: directory.id, slug: params.metier } },
    }),
  ]);
  if (!dep || !category) return {};
  return {
    title: `${category.label} dans le ${dep.name} (${dep.code}) — ${directory.name}`,
    description: `Trouvez un ${category.label.toLowerCase()} dans le département ${dep.name}. Toutes les communes couvertes.`,
    alternates: {
      canonical: `${siteUrl(directory)}/${params.metier}/departement/${dep.slug}`,
    },
  };
}

export default async function MetierDepartementPage({ params }: { params: Params }) {
  const directory = await getCurrentDirectory();
  if (!directory) notFound();

  const [dep, category] = await Promise.all([
    prisma.geoDepartement.findUnique({
      where: { slug: params.slug },
      include: {
        region: true,
        villes: {
          orderBy: [{ population: "desc" }, { name: "asc" }],
        },
      },
    }),
    prisma.category.findUnique({
      where: { directoryId_slug: { directoryId: directory.id, slug: params.metier } },
    }),
  ]);
  if (!dep || !category) notFound();

  const pagesForMetier = await prisma.seoPage.findMany({
    where: {
      directoryId: directory.id,
      metier: params.metier,
      isPublished: true,
      departement: dep.code,
    },
    select: { ville: true },
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

  const topVilles = dep.villes.slice(0, 12);
  const otherVilles = dep.villes.slice(12);

  const base = siteUrl(directory);
  const crumbs = breadcrumbSchema([
    { name: "Accueil", url: `${base}/` },
    { name: category.label, url: `${base}/${category.slug}` },
    { name: dep.region.name, url: `${base}/region/${dep.region.slug}` },
    { name: dep.name, url: `${base}/departement/${dep.slug}` },
    {
      name: `${category.label} dans le ${dep.name}`,
      url: `${base}/${category.slug}/departement/${dep.slug}`,
    },
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
            <Link href={`/region/${dep.region.slug}` as never} className="hover-underline">
              {dep.region.name}
            </Link>{" "}
            ›{" "}
            <Link href={`/departement/${dep.slug}` as never} className="hover-underline">
              {dep.name}
            </Link>{" "}
            ›{" "}
            <strong className="text-[color:var(--ink)]">
              {category.label} dans le {dep.name}
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
              {category.label} dans le{" "}
              <span style={{ color: directory.primaryColor }}>
                {dep.name} ({dep.code})
              </span>
            </h1>
          </div>
          <p className="mt-3 max-w-2xl text-[15.5px] leading-[1.6] text-[color:var(--mute)]">
            {listingsCount} {category.label.toLowerCase()}s référencés dans le département{" "}
            {dep.name}, répartis sur {dep.villes.length.toLocaleString("fr-FR")} communes.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-[1200px] space-y-14 px-6 pb-16">
        <section>
          <h2 className="mb-5 font-syne text-[24px] font-bold">
            Principales villes pour un {category.label.toLowerCase()}
          </h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {topVilles.map((v) => {
              const hasPage = villeSlugSet.has(v.slug);
              return (
                <Link
                  key={v.insee}
                  href={
                    hasPage
                      ? (`/${category.slug}/${v.slug}` as never)
                      : (`/ville/${v.slug}` as never)
                  }
                  className="card-lift rounded-2xl border border-[color:var(--mist)] bg-white p-4"
                >
                  <div className="font-syne text-[16px] font-bold leading-tight text-[color:var(--ink)]">
                    {category.label} à {v.name}
                  </div>
                  <div className="mt-1 text-[12px] text-[color:var(--mute)]">
                    {v.population > 0 ? `${v.population.toLocaleString("fr-FR")} hab.` : ""}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {otherVilles.length > 0 ? (
          <section>
            <h2 className="mb-5 font-syne text-[22px] font-bold">
              {category.label} dans {otherVilles.length} autres communes
            </h2>
            <ul className="flex flex-wrap gap-2">
              {otherVilles.map((v) => {
                const hasPage = villeSlugSet.has(v.slug);
                return (
                  <li key={v.insee}>
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
        ) : null}
      </main>

      <footer className="border-t border-[color:var(--mist)] bg-white/60">
        <div className="mx-auto max-w-[1200px] px-6 py-10 text-center text-[13px] text-[color:var(--mute)]">
          {directory.name} · {category.label} · {dep.name}
        </div>
      </footer>
    </div>
  );
}
