import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentDirectory } from "@/lib/tenant";
import { siteUrl } from "@/lib/seo";
import { PublicHeader } from "@/components/public/PublicHeader";
import { Section } from "@/components/public/ui/Section";
import { CategoryIcon } from "@/components/public/ui/CategoryIcon";
import { Counter } from "@/components/public/ui/Counter";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const directory = await getCurrentDirectory();
  if (!directory) return {};
  return {
    title: directory.tagline
      ? `${directory.name} — ${directory.tagline}`
      : directory.name,
    description:
      directory.description ??
      `${directory.name} — trouvez un professionnel de confiance près de chez vous.`,
    alternates: { canonical: siteUrl(directory) },
  };
}

export default async function HomePage() {
  const directory = await getCurrentDirectory();
  if (!directory) notFound();

  const [categories, topPages, villes, listingsCount, reviewsCount, listingCountsRaw] =
    await Promise.all([
      prisma.category.findMany({
        where: { directoryId: directory.id },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.seoPage.findMany({
        where: { directoryId: directory.id, isPublished: true },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { category: { select: { icon: true, color: true } } },
      }),
      prisma.seoPage.findMany({
        where: { directoryId: directory.id, isPublished: true },
        select: { ville: true, villeLabel: true },
        distinct: ["ville"],
        orderBy: { villeLabel: "asc" },
        take: 50,
      }),
      prisma.listing.count({ where: { directoryId: directory.id, isPublished: true } }),
      prisma.review.count({ where: { directoryId: directory.id } }),
      prisma.listing.groupBy({
        by: ["categoryId", "ville"],
        where: { directoryId: directory.id, isPublished: true },
        _count: { _all: true },
        _avg: { rating: true },
      }),
    ]);

  const listingCountByKey = new Map<string, { count: number; rating: number }>();
  for (const r of listingCountsRaw) {
    listingCountByKey.set(`${r.categoryId}:${r.ville}`, {
      count: r._count._all,
      rating: r._avg.rating ?? 0,
    });
  }

  const brand = directory.primaryColor;

  return (
    <div className="theme-public min-h-screen" style={{ ["--brand" as never]: brand }}>
      <PublicHeader directory={directory} />

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden">
        <div className="hero-mesh-light noise absolute inset-0" aria-hidden />
        <div className="relative mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-12 px-6 pb-24 pt-14 md:grid-cols-[1.1fr_.9fr] md:pt-20">
          <div className="reveal">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[color:var(--mist)] bg-white/80 px-3 py-[6px] text-[12.5px] text-[color:var(--ink-2)] backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-[color:var(--success)] pulse-dot" />
              <Counter to={listingsCount} /> pros référencés ·{" "}
              <Counter to={reviewsCount} /> avis vérifiés
            </div>

            <h1 className="font-syne text-[clamp(38px,6vw,68px)] font-extrabold leading-[1.02] tracking-[-0.02em] text-[color:var(--ink)]">
              Trouvez <span className="text-[color:var(--accent)]">le bon pro</span>
              <br />
              <span className="relative inline-block">
                près de chez vous
                <svg
                  aria-hidden
                  viewBox="0 0 300 14"
                  className="absolute -bottom-1 left-0 h-[10px] w-full"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M2 10 Q80 2 150 8 T298 6"
                    fill="none"
                    stroke={brand}
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-[17px] leading-[1.6] text-[color:var(--mute)]">
              {directory.description ??
                "Comparez les professionnels, lisez les avis clients et demandez un devis gratuit en quelques secondes."}
            </p>

            {/* Search card floating */}
            <form
              action="/recherche"
              className="mt-8 max-w-xl rounded-2xl border border-[color:var(--mist)] bg-white p-2 shadow-[var(--shadow-soft)]"
            >
              <div className="grid grid-cols-1 gap-1 sm:grid-cols-[1fr_1fr_auto]">
                <div className="relative">
                  <Field
                    name="metier"
                    label={categories[0]?.label ?? "Catégorie"}
                    placeholder={`Ex : ${categories[0]?.label ?? "plombier"}`}
                  />
                </div>
                <div className="relative border-t border-[color:var(--mist)] sm:border-l sm:border-t-0">
                  <Field name="ville" label="Ville" placeholder="Ex : Nice" />
                </div>
                <button type="submit" className="btn-primary m-1 rounded-xl">
                  Rechercher →
                </button>
              </div>
            </form>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-[12.5px] text-[color:var(--mute)]">
              <span className="inline-flex items-center gap-1">✓ Devis gratuit</span>
              <span className="inline-flex items-center gap-1">✓ Sans inscription</span>
              <span className="inline-flex items-center gap-1">✓ Pros vérifiés</span>
            </div>
          </div>

          {/* Visual floating card preview */}
          <div className="relative hidden md:block">
            <div className="absolute -right-12 top-6 float-slow" aria-hidden>
              <div
                className="h-40 w-40 rounded-full opacity-70 blur-3xl"
                style={{ background: `${brand}55` }}
              />
            </div>
            <div className="reveal reveal-delay-2 relative rounded-3xl border border-[color:var(--mist)] bg-white p-5 shadow-[var(--shadow-lift)]">
              <div className="mb-4 flex items-center gap-3">
                <CategoryIcon slug="plombier" label="Plombier" size={52} />
                <div>
                  <div className="font-syne text-[18px] font-bold">Plomberie Martin</div>
                  <div className="text-[13px] text-[color:var(--mute)]">Plombier certifié · Nice</div>
                </div>
                <span className="ml-auto rounded-full bg-[color:var(--accent-soft)] px-[10px] py-[3px] font-syne text-[11px] font-bold text-[#8b5a00]">
                  ⭐ Pro
                </span>
              </div>
              <div className="flex items-center justify-between text-[13px] text-[color:var(--ink-2)]">
                <span>★★★★★ 4.9 · 128 avis</span>
                <span className="text-[color:var(--success)]">● Dispo aujourd'hui</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11.5px] text-[color:var(--mute)]">
                <div className="rounded-lg bg-[color:var(--cream-2)] py-2">⚡ Urgence</div>
                <div className="rounded-lg bg-[color:var(--cream-2)] py-2">📄 Devis 24h</div>
                <div className="rounded-lg bg-[color:var(--cream-2)] py-2">✓ Garanti</div>
              </div>
            </div>

            {/* Mini floating card */}
            <div className="reveal reveal-delay-3 absolute -left-6 -bottom-8 rounded-2xl border border-[color:var(--mist)] bg-white p-3 shadow-[var(--shadow-soft)]">
              <div className="flex items-center gap-2 text-[12px]">
                <span className="h-2 w-2 rounded-full bg-[color:var(--success)] pulse-dot" />
                <span className="text-[color:var(--ink-2)]">Nouveau message reçu</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TRUST BAND ===== */}
      <section className="border-y border-[color:var(--mist)] bg-white/60">
        <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-6 px-6 py-10 md:grid-cols-4">
          <Stat label="Professionnels référencés" value={listingsCount} />
          <Stat label="Catégories" value={categories.length} />
          <Stat label="Villes couvertes" value={villes.length} suffix="+" />
          <Stat label="Avis clients" value={reviewsCount} />
        </div>
      </section>

      <main className="mx-auto max-w-[1200px] px-6">
        {/* ===== CATÉGORIES BENTO ===== */}
        <div id="categories">
          <Section
            eyebrow="Catégories"
            title="Un expert pour chaque besoin"
            subtitle="Chaque catégorie est animée par des artisans locaux vérifiés et notés."
            action={
              <Link href="/recherche" className="text-[13.5px] text-[color:var(--ink-2)] hover-underline">
                Voir tout →
              </Link>
            }
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {categories.map((c, i) => (
                <Link
                  key={c.id}
                  href={`/${c.slug}` as never}
                  className={[
                    "card-lift group flex flex-col items-start gap-3 rounded-2xl border border-[color:var(--mist)] bg-white p-5",
                    i === 0 ? "lg:col-span-2 lg:row-span-2" : "",
                  ].join(" ")}
                >
                  <CategoryIcon
                    slug={c.slug}
                    label={c.label}
                    icon={c.icon}
                    color={c.color}
                    size={i === 0 ? 72 : 52}
                  />
                  <div>
                    <div className="font-syne text-[16px] font-bold text-[color:var(--ink)]">
                      {c.label}
                    </div>
                    <div className="mt-1 text-[12.5px] text-[color:var(--mute)]">
                      Voir les pros →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Section>
        </div>

        {/* ===== TOP PAGES SEO ===== */}
        <Section
          eyebrow="Recherches populaires"
          title="Les plus consultées cette semaine"
          subtitle="Des milliers de visiteurs comparent ces professionnels chaque mois."
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {topPages.map((p, i) => {
              const stats = listingCountByKey.get(`${p.categoryId}:${p.ville}`) ?? {
                count: 0,
                rating: 0,
              };
              // Teinte douce dérivée du slug catégorie (accordée avec CategoryIcon)
              let hash = 0;
              for (const c of p.metier) hash = (hash * 31 + c.charCodeAt(0)) | 0;
              const hue = Math.abs(hash) % 360;

              return (
                <Link
                  key={p.slug}
                  href={`/${p.slug}` as never}
                  className="card-lift group relative flex flex-col overflow-hidden rounded-2xl border border-[color:var(--mist)] bg-white p-5"
                >
                  {/* Halo couleur catégorie */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-60 blur-2xl transition-opacity group-hover:opacity-90"
                    style={{ background: `hsl(${hue} 80% 80%)` }}
                  />

                  <div className="relative flex items-start justify-between">
                    <CategoryIcon
                      slug={p.metier}
                      label={p.metierLabel}
                      icon={p.category?.icon}
                      color={p.category?.color}
                      size={48}
                    />
                    {i < 3 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--ink)] px-[9px] py-[3px] font-syne text-[10.5px] font-bold text-white">
                        #{i + 1}
                      </span>
                    ) : null}
                  </div>

                  <div className="relative mt-5">
                    <div className="font-syne text-[20px] font-extrabold leading-[1.1] tracking-[-0.01em] text-[color:var(--ink)]">
                      {p.metierLabel}
                    </div>
                    <div className="mt-0.5 text-[14px] font-medium text-[color:var(--mute)]">
                      à {p.villeLabel}
                    </div>
                  </div>

                  <div className="relative mt-5 flex items-center gap-3 border-t border-dashed border-[color:var(--mist)] pt-4 text-[12px] text-[color:var(--mute)]">
                    <span className="inline-flex items-center gap-1">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: `hsl(${hue} 60% 55%)` }}
                      />
                      {stats.count} pro{stats.count > 1 ? "s" : ""}
                    </span>
                    {stats.rating > 0 ? (
                      <>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <span className="text-[color:var(--accent)]">★</span>
                          {stats.rating.toFixed(1)}
                        </span>
                      </>
                    ) : null}
                    <span className="ml-auto inline-flex items-center gap-1 font-medium text-[color:var(--ink-2)] transition-transform duration-300 group-hover:translate-x-1">
                      Explorer
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                        <path d="M5 12h14M13 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </Section>

        {/* ===== VILLES ===== */}
        <div id="villes">
          <Section
            eyebrow="Où qu'on se trouve"
            title={`Présent dans ${villes.length} villes`}
            subtitle="De la grande métropole au village, des pros locaux à portée de clic."
          >
            <ul className="flex flex-wrap gap-2">
              {villes.map((v) => (
                <li key={v.ville}>
                  <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--mist)] bg-white px-4 py-2 text-[13px] text-[color:var(--ink-2)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--accent)]" />
                    {v.villeLabel}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        </div>

        {/* ===== CTA BAND ===== */}
        <section className="my-12 overflow-hidden rounded-3xl border border-[color:var(--mist)] bg-[color:var(--ink)] text-white noise relative">
          <div className="hero-mesh absolute inset-0 opacity-60" aria-hidden />
          <div className="relative grid grid-cols-1 items-center gap-6 px-8 py-12 md:grid-cols-[1.2fr_auto] md:px-12">
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">
                Vous êtes pro ?
              </div>
              <h3 className="font-syne text-[clamp(26px,3.5vw,38px)] font-extrabold leading-[1.1]">
                Rejoignez {directory.name} et recevez
                <br />
                <span style={{ color: brand }}>des demandes qualifiées</span> chaque semaine.
              </h3>
              <p className="mt-3 max-w-xl text-[14.5px] text-white/75">
                14 jours gratuits. Sans engagement. Annulez en un clic.
              </p>
            </div>
            <Link href="/inscription" className="btn-primary text-[15px] !px-7 !py-[14px]">
              Créer ma fiche gratuite →
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[color:var(--mist)] bg-white/60">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-4 px-6 py-10 text-[13px] text-[color:var(--mute)] md:flex-row">
          <div>
            © {new Date().getFullYear()} {directory.name} · {directory.tagline}
          </div>
          <div className="flex gap-6">
            <Link href="/inscription" className="hover-underline">
              Inscrire mon entreprise
            </Link>
            <Link href="/login" className="hover-underline">
              Espace pro
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Field({
  name,
  label,
  placeholder,
}: {
  name: string;
  label: string;
  placeholder: string;
}) {
  return (
    <label className="block px-4 py-2">
      <span className="block text-[10.5px] font-semibold uppercase tracking-[0.15em] text-[color:var(--mute-2)]">
        {label}
      </span>
      <input
        name={name}
        placeholder={placeholder}
        className="w-full border-none bg-transparent p-0 text-[15px] text-[color:var(--ink)] outline-none placeholder:text-[color:var(--mute-2)] focus:outline-none"
      />
    </label>
  );
}

function Stat({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div>
      <div className="font-syne text-[34px] font-extrabold leading-none text-[color:var(--ink)]">
        <Counter to={value} suffix={suffix} />
      </div>
      <div className="mt-2 text-[12.5px] uppercase tracking-[0.1em] text-[color:var(--mute)]">
        {label}
      </div>
    </div>
  );
}
