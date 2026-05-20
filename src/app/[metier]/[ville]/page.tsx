import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentDirectory } from "@/lib/tenant";
import { buildDescription, buildH1, buildTitle, canonicalUrl, siteUrl } from "@/lib/seo";
import {
  buildFaq,
  buildIntro,
  buildProcess,
  buildSubServices,
  faqSchema,
  breadcrumbSchema,
} from "@/lib/seo-content";
import { getNearbyVilles } from "@/lib/geo-nearby";
import { PublicHeader } from "@/components/public/PublicHeader";
import { CategoryIcon } from "@/components/public/ui/CategoryIcon";
import { Stars } from "@/components/public/ui/Stars";
import { Badge } from "@/components/public/ui/Badge";
import { FaqAccordion } from "@/components/public/FaqAccordion";

export const revalidate = 3600;
export const dynamicParams = true;

type Params = { metier: string; ville: string };

export async function generateStaticParams(): Promise<Params[]> {
  const pages = await prisma.seoPage.findMany({
    where: { isPublished: true },
    select: { metier: true, ville: true },
    take: 1000,
  });
  return pages.map((p) => ({ metier: p.metier, ville: p.ville }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const directory = await getCurrentDirectory();
  if (!directory) return {};
  const page = await prisma.seoPage.findUnique({
    where: {
      directoryId_slug: { directoryId: directory.id, slug: `${params.metier}/${params.ville}` },
    },
  });
  if (!page?.isPublished) return {};
  const count = await prisma.listing.count({
    where: {
      directoryId: directory.id,
      ville: params.ville,
      category: { slug: params.metier },
      isPublished: true,
    },
  });
  const title = page.title || buildTitle(page.metierLabel, page.villeLabel, directory.name);
  const description =
    page.description || buildDescription(page.metierLabel, page.villeLabel, count);
  const url = canonicalUrl(params, directory);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: directory.name,
      locale: "fr_FR",
    },
  };
}

export default async function Page({ params }: { params: Params }) {
  const directory = await getCurrentDirectory();
  if (!directory) notFound();

  const seoPage = await prisma.seoPage.findUnique({
    where: {
      directoryId_slug: { directoryId: directory.id, slug: `${params.metier}/${params.ville}` },
    },
  });
  if (!seoPage?.isPublished) notFound();

  const listings = await prisma.listing.findMany({
    where: {
      directoryId: directory.id,
      ville: params.ville,
      category: { slug: params.metier },
      isPublished: true,
    },
    orderBy: [{ priority: "desc" }, { rating: "desc" }, { createdAt: "asc" }],
    include: { company: { select: { phone: true, name: true } } },
    take: 60,
  });

  const subs =
    listings.length > 0
      ? await prisma.subscription.findMany({
          where: {
            directoryId: directory.id,
            companyId: { in: listings.map((l) => l.companyId) },
            status: { in: ["ACTIVE", "TRIAL"] },
          },
          include: { plan: { select: { key: true } } },
        })
      : [];
  const planByCompany = new Map(subs.map((s) => [s.companyId, s.plan.key]));

  // --- Référentiel géo pour maillage 50km ---
  const currentGeo = seoPage.villeInsee
    ? await prisma.geoVille.findUnique({
        where: { insee: seoPage.villeInsee },
        include: { departement: { include: { region: true } } },
      })
    : null;

  const nearbyVilles =
    currentGeo?.lat != null && currentGeo.lng != null
      ? await getNearbyVilles({
          lat: currentGeo.lat,
          lng: currentGeo.lng,
          maxKm: 50,
          limit: 12,
          excludeInsee: currentGeo.insee,
        })
      : [];

  // Pour chaque ville voisine, on vérifie si une SeoPage (metier × ville) existe
  const nearbySlugSet = new Set(nearbyVilles.map((v) => v.slug));
  const nearbySeoPages =
    nearbySlugSet.size > 0
      ? await prisma.seoPage.findMany({
          where: {
            directoryId: directory.id,
            metier: params.metier,
            ville: { in: Array.from(nearbySlugSet) },
            isPublished: true,
          },
          select: { ville: true, villeLabel: true },
        })
      : [];
  const nearbySeoVilleSet = new Set(nearbySeoPages.map((p) => p.ville));

  const otherMetiers = await prisma.seoPage.findMany({
    where: {
      directoryId: directory.id,
      ville: params.ville,
      isPublished: true,
      NOT: { metier: params.metier },
    },
    orderBy: { metierLabel: "asc" },
    take: 16,
    include: { category: { select: { icon: true, color: true } } },
  });

  // --- Contenu éditorial généré ---
  const intro = buildIntro(seoPage.metierLabel, seoPage.villeLabel, listings.length, directory.name);
  const process = buildProcess(seoPage.metierLabel, seoPage.villeLabel);
  const subServices = buildSubServices(params.metier);
  const faq = buildFaq(seoPage.metierLabel, seoPage.villeLabel, listings.length, directory.name);

  const h1 = seoPage.h1 || buildH1(seoPage.metierLabel, seoPage.villeLabel);
  const brand = directory.primaryColor;
  const base = siteUrl(directory);

  // --- Schemas ---
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: h1,
    itemListElement: listings.map((l, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "LocalBusiness",
        name: l.company.name,
        url: `${base}/entreprise/${l.slug}`,
        address: l.address ?? undefined,
      },
    })),
  };
  const crumbsSchema = breadcrumbSchema([
    { name: "Accueil", url: `${base}/` },
    { name: seoPage.metierLabel, url: `${base}/${params.metier}` },
    ...(seoPage.region
      ? [
          {
            name: seoPage.regionLabel ?? "",
            url: `${base}/region/${(seoPage.regionLabel ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          },
        ]
      : []),
    ...(seoPage.departement
      ? [
          {
            name: seoPage.departementLabel ?? "",
            url: `${base}/departement/${(seoPage.departementLabel ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          },
        ]
      : []),
    { name: `${seoPage.metierLabel} à ${seoPage.villeLabel}`, url: `${base}/${params.metier}/${params.ville}` },
  ]);
  const faqJsonLd = faqSchema(faq);

  return (
    <div className="theme-public min-h-screen" style={{ ["--brand" as never]: brand }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbsSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <PublicHeader directory={directory} />

      {/* --- Hero compact --- */}
      <section className="relative overflow-hidden">
        <div className="hero-mesh-light noise absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-[1200px] px-6 pb-10 pt-8">
          <nav className="mb-5 flex flex-wrap items-center gap-1 text-[13px] text-[color:var(--mute)]">
            <Link href="/" className="hover-underline">
              Accueil
            </Link>
            <span>›</span>
            <Link href={`/${params.metier}` as never} className="hover-underline">
              {seoPage.metierLabel}
            </Link>
            {currentGeo ? (
              <>
                <span>›</span>
                <Link
                  href={`/region/${currentGeo.departement.region.slug}` as never}
                  className="hover-underline"
                >
                  {currentGeo.departement.region.name}
                </Link>
                <span>›</span>
                <Link
                  href={`/departement/${currentGeo.departement.slug}` as never}
                  className="hover-underline"
                >
                  {currentGeo.departement.name}
                </Link>
              </>
            ) : null}
            <span>›</span>
            <strong className="text-[color:var(--ink)]">{seoPage.villeLabel}</strong>
          </nav>

          <div className="grid grid-cols-1 items-end gap-6 md:grid-cols-[1fr_auto]">
            <div className="reveal">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[color:var(--mist)] bg-white/80 px-3 py-[6px] text-[12px] text-[color:var(--ink-2)] backdrop-blur">
                <CategoryIcon slug={params.metier} label={seoPage.metierLabel} size={18} />
                <span>{listings.length} pros à {seoPage.villeLabel}</span>
              </div>
              <h1 className="font-syne text-[clamp(32px,5vw,54px)] font-extrabold leading-[1.05] tracking-[-0.02em]">
                {seoPage.metierLabel} à{" "}
                <span style={{ color: brand }}>{seoPage.villeLabel}</span>
              </h1>
              <p className="mt-3 max-w-2xl text-[15.5px] leading-[1.6] text-[color:var(--mute)]">
                Comparez {Math.max(listings.length, 1)} {seoPage.metierLabel.toLowerCase()}
                {listings.length > 1 ? "s" : ""} de {seoPage.villeLabel}, lisez les avis clients
                et demandez un devis gratuit en 30 secondes.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" className="pill active">Tous</button>
              <button type="button" className="pill">⚡ Urgences</button>
              <button type="button" className="pill">📄 Devis gratuit</button>
              <button type="button" className="pill">✓ Certifiés</button>
              <button type="button" className="pill">★ 4+</button>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1200px] px-6 pb-16">
        {/* --- Listings --- */}
        {listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[color:var(--mist)] bg-white p-12 text-center text-[color:var(--mute)]">
            Aucun professionnel référencé pour cette page pour le moment.{" "}
            {nearbyVilles.length > 0 ? (
              <span className="mt-2 block text-[13px]">
                Voir dans les{" "}
                <Link
                  href={`/${params.metier}/${nearbyVilles[0]!.slug}` as never}
                  className="text-[color:var(--accent)] hover:underline"
                >
                  villes proches
                </Link>
              </span>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l, idx) => {
              const planKey = planByCompany.get(l.companyId) ?? null;
              const variant =
                planKey === "PRO" ? "pro" : planKey === "ESSENTIEL" ? "certifie" : null;
              const showPhone = planKey !== "STARTER";
              return (
                <Link
                  key={l.id}
                  href={`/entreprise/${l.slug}` as never}
                  className="card-lift relative flex flex-col rounded-2xl border border-[color:var(--mist)] bg-white p-5"
                  style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}
                >
                  {variant ? (
                    <div className="absolute right-4 top-4">
                      <Badge variant={variant} />
                    </div>
                  ) : null}

                  <div className="mb-4 flex items-center gap-3">
                    <CategoryIcon slug={params.metier} label={seoPage.metierLabel} size={48} />
                    <div>
                      <div className="font-syne text-[16px] font-bold leading-tight text-[color:var(--ink)]">
                        {l.company.name}
                      </div>
                      <div className="text-[12.5px] text-[color:var(--mute)]">
                        {seoPage.metierLabel} · {seoPage.villeLabel}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[13px]">
                    {l.reviewCount > 0 ? <Stars rating={l.rating} showValue /> : (
                      <span className="text-[color:var(--mute-2)]">Pas encore d'avis</span>
                    )}
                    {l.reviewCount > 0 ? (
                      <span className="text-[color:var(--mute)]">{l.reviewCount} avis</span>
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-col gap-2 text-[13px] text-[color:var(--ink-3)]">
                    {l.address ? (
                      <div className="flex items-center gap-2">
                        <IconPin />
                        <span className="truncate">{l.address}</span>
                      </div>
                    ) : null}
                    {showPhone && l.company.phone ? (
                      <div className="flex items-center gap-2">
                        <IconPhone />
                        <span>{l.company.phone}</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-[color:var(--mist)] pt-4 text-[13px]">
                    <span className="inline-flex items-center gap-1 text-[color:var(--success)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--success)] pulse-dot" />
                      Dispo
                    </span>
                    <span className="font-medium text-[color:var(--ink-2)]">Voir la fiche →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* --- Intro éditoriale --- */}
        <section className="mt-14">
          <h2 className="mb-4 font-syne text-[24px] font-bold">
            {seoPage.metierLabel} à {seoPage.villeLabel} — ce qu'il faut savoir
          </h2>
          <p className="max-w-3xl text-[15.5px] leading-[1.75] text-[color:var(--ink-3)]">
            {intro}
          </p>
        </section>

        {/* --- Process 3 étapes --- */}
        <section className="mt-14">
          <h2 className="mb-6 font-syne text-[24px] font-bold">
            Comment trouver un {seoPage.metierLabel.toLowerCase()} à {seoPage.villeLabel} ?
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {process.map((step, i) => (
              <article
                key={i}
                className="relative rounded-2xl border border-[color:var(--mist)] bg-white p-6 shadow-[var(--shadow-soft)]"
              >
                <span
                  className="absolute right-5 top-5 font-syne text-[44px] font-extrabold leading-none opacity-[0.08]"
                  style={{ color: brand }}
                >
                  {i + 1}
                </span>
                <h3 className="font-syne text-[17px] font-bold leading-tight">{step.title}</h3>
                <p className="mt-2 text-[14px] leading-[1.6] text-[color:var(--ink-3)]">{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* --- Sous-services --- */}
        <section className="mt-14">
          <h2 className="mb-6 font-syne text-[24px] font-bold">
            Interventions les plus demandées à {seoPage.villeLabel}
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {subServices.map((s) => (
              <article
                key={s.title}
                className="rounded-2xl border border-[color:var(--mist)] bg-white p-5 shadow-[var(--shadow-soft)]"
              >
                <h3 className="font-syne text-[16px] font-bold">{s.title}</h3>
                <ul className="mt-3 space-y-2">
                  {s.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-[13.5px] text-[color:var(--ink-3)]"
                    >
                      <span className="mt-[6px] block h-[1.5px] w-[10px] shrink-0 bg-[color:var(--accent)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* --- FAQ --- */}
        <section className="mt-14">
          <h2 className="mb-6 font-syne text-[24px] font-bold">Questions fréquentes</h2>
          <FaqAccordion items={faq} />
        </section>

        {/* --- Maillage géo intelligent --- */}
        <section className="mt-14 grid gap-10 md:grid-cols-2">
          {nearbyVilles.length > 0 ? (
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--mute)]">
                Villes proches · 50 km
              </div>
              <h2 className="mb-5 font-syne text-[22px] font-bold">
                {seoPage.metierLabel} autour de {seoPage.villeLabel}
              </h2>
              <ul className="flex flex-wrap gap-2">
                {nearbyVilles.map((n) => {
                  const hasPage = nearbySeoVilleSet.has(n.slug);
                  const href = hasPage ? `/${params.metier}/${n.slug}` : `/${n.slug}`;
                  return (
                    <li key={n.insee}>
                      <Link
                        href={href as never}
                        className="pill"
                        title={`${n.distanceKm} km`}
                      >
                        {n.name}
                        <span className="text-[10.5px] text-[color:var(--mute-2)]">
                          · {n.distanceKm} km
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          {otherMetiers.length > 0 ? (
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--mute)]">
                Autres pros
              </div>
              <h2 className="mb-5 font-syne text-[22px] font-bold">
                Autres métiers à {seoPage.villeLabel}
              </h2>
              <ul className="flex flex-wrap gap-2">
                {otherMetiers.map((m) => (
                  <li key={m.metier}>
                    <Link href={`/${m.metier}/${params.ville}` as never} className="pill">
                      <CategoryIcon
                        slug={m.metier}
                        label={m.metierLabel}
                        icon={m.category?.icon}
                        color={m.category?.color}
                        size={16}
                      />
                      {m.metierLabel}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        {/* --- Liens vers département & région --- */}
        {currentGeo ? (
          <section className="mt-14 rounded-2xl border border-[color:var(--mist)] bg-white p-6">
            <div className="flex flex-wrap items-center gap-4 text-[13.5px]">
              <span className="text-[color:var(--mute)]">Territoire :</span>
              <Link
                href={`/departement/${currentGeo.departement.slug}` as never}
                className="btn-ghost text-[12.5px] !px-3 !py-1.5"
              >
                Voir tout le département {currentGeo.departement.name}
              </Link>
              <Link
                href={`/${params.metier}/departement/${currentGeo.departement.slug}` as never}
                className="btn-ghost text-[12.5px] !px-3 !py-1.5"
              >
                {seoPage.metierLabel} dans le {currentGeo.departement.name}
              </Link>
              <Link
                href={`/region/${currentGeo.departement.region.slug}` as never}
                className="btn-ghost text-[12.5px] !px-3 !py-1.5"
              >
                Voir la région {currentGeo.departement.region.name}
              </Link>
            </div>
          </section>
        ) : null}
      </main>

      <footer className="border-t border-[color:var(--mist)] bg-white/60">
        <div className="mx-auto max-w-[1200px] px-6 py-10 text-center text-[13px] text-[color:var(--mute)]">
          {directory.name} — Annuaire des {seoPage.metierLabel.toLowerCase()}s à{" "}
          {seoPage.villeLabel}
        </div>
      </footer>
    </div>
  );
}

function IconPin() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 22s-7-7.5-7-13a7 7 0 0 1 14 0c0 5.5-7 13-7 13z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}
function IconPhone() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.4 2.1L7.9 9.8a16 16 0 0 0 6 6l1.4-1.3a2 2 0 0 1 2-.4c.9.3 1.8.5 2.6.6a2 2 0 0 1 1.7 2z" />
    </svg>
  );
}
