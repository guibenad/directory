import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentDirectory } from "@/lib/tenant";
import { siteUrl } from "@/lib/seo";
import { PublicHeader } from "@/components/public/PublicHeader";
import { ContactForm } from "@/components/public/ContactForm";
import { ReviewForm } from "@/components/public/ReviewForm";
import { PhotoCarousel } from "@/components/public/PhotoCarousel";
import { ServicesBlock } from "@/components/public/ServicesBlock";
import { SocialButtons } from "@/components/public/SocialButtons";
import { GoogleReviews } from "@/components/public/GoogleReviews";
import { parseReviews } from "@/lib/google-sync";
import { CategoryIcon } from "@/components/public/ui/CategoryIcon";
import { Stars } from "@/components/public/ui/Stars";
import { Badge } from "@/components/public/ui/Badge";

export const revalidate = 3600;
export const dynamicParams = true;

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const listings = await prisma.listing.findMany({
    where: { isPublished: true },
    select: { slug: true },
    take: 500,
  });
  return listings.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const directory = await getCurrentDirectory();
  if (!directory) return {};
  const listing = await prisma.listing.findUnique({
    where: { directoryId_slug: { directoryId: directory.id, slug: params.slug } },
    include: { company: true, category: true },
  });
  if (!listing) return {};
  const title = `${listing.company.name} — ${listing.category.label} à ${listing.villeLabel ?? listing.ville}`;
  const description =
    listing.description?.slice(0, 180) ??
    `${listing.company.name}, ${listing.category.label.toLowerCase()} à ${listing.villeLabel ?? listing.ville}.`;
  return {
    title,
    description,
    alternates: { canonical: `${siteUrl(directory)}/entreprise/${listing.slug}` },
  };
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function CompanyListingPage({ params }: { params: Params }) {
  const directory = await getCurrentDirectory();
  if (!directory) notFound();

  const listing = await prisma.listing.findUnique({
    where: { directoryId_slug: { directoryId: directory.id, slug: params.slug } },
    include: {
      company: true,
      category: true,
      reviews: { orderBy: { createdAt: "desc" }, take: 10 },
      services: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!listing || !listing.isPublished) notFound();

  const activeSub = await prisma.subscription.findFirst({
    where: {
      companyId: listing.companyId,
      directoryId: listing.directoryId,
      status: { in: ["ACTIVE", "TRIAL"] },
    },
    include: { plan: true },
  });
  const planKey = activeSub?.plan.key ?? null;
  const showPhone = planKey !== "STARTER";
  const maxPhotos = planKey === "STARTER" ? 1 : planKey === "ESSENTIEL" ? 10 : 999;
  const photos = listing.photos.slice(0, maxPhotos);
  const brand = directory.primaryColor;

  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: listing.company.name,
    url: `${siteUrl(directory)}/entreprise/${listing.slug}`,
    description: listing.description ?? undefined,
    address: listing.address
      ? {
          "@type": "PostalAddress",
          streetAddress: listing.address,
          addressLocality: listing.villeLabel ?? listing.ville,
        }
      : undefined,
    telephone: showPhone ? listing.company.phone ?? undefined : undefined,
    ...(listing.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: listing.rating,
            reviewCount: listing.reviewCount,
          },
        }
      : {}),
  };

  return (
    <div className="theme-public min-h-screen" style={{ ["--brand" as never]: brand }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <PublicHeader directory={directory} />

      {/* Breadcrumb + Hero */}
      <section className="relative overflow-hidden">
        <div className="hero-mesh-light noise absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-[1200px] px-6 pb-8 pt-8">
          <nav className="mb-6 text-[13px] text-[color:var(--mute)]">
            <Link href="/" className="hover-underline">
              Accueil
            </Link>{" "}
            ›{" "}
            <Link
              href={`/${listing.category.slug}/${listing.ville}` as never}
              className="hover-underline"
            >
              {listing.category.label} à {listing.villeLabel ?? listing.ville}
            </Link>{" "}
            › <strong className="text-[color:var(--ink)]">{listing.company.name}</strong>
          </nav>

          <div className="flex items-start gap-5">
            <div className="relative">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-2xl font-syne text-[26px] font-extrabold"
                style={{ background: `${brand}18`, color: brand }}
              >
                {initials(listing.company.name)}
              </div>
              {planKey === "PRO" ? (
                <span className="absolute -bottom-2 -right-2 rounded-full bg-white p-1 shadow-sm">
                  <Badge variant="pro" />
                </span>
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[12.5px] text-[color:var(--mute)]">
                <CategoryIcon slug={listing.category.slug} label={listing.category.label} size={16} />
                <span>{listing.category.label}</span>
                <span>·</span>
                <span>{listing.villeLabel ?? listing.ville}</span>
              </div>
              <h1 className="mt-1 font-syne text-[clamp(28px,4.2vw,44px)] font-extrabold leading-[1.05] tracking-[-0.02em]">
                {listing.company.name}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13.5px] text-[color:var(--ink-3)]">
                {listing.reviewCount > 0 ? (
                  <span className="inline-flex items-center gap-2">
                    <Stars rating={listing.rating} showValue />
                    <span className="text-[color:var(--mute)]">· {listing.reviewCount} avis</span>
                  </span>
                ) : (
                  <span className="text-[color:var(--mute-2)]">Pas encore d'avis</span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--success)] pulse-dot" />
                  Disponible aujourd'hui
                </span>
                <span>Sur {directory.name} depuis {new Date(listing.createdAt).getFullYear()}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-[1200px] gap-8 px-6 pb-16 md:grid-cols-[1.4fr_.8fr]">
        <article className="space-y-8">
          {/* Description card */}
          <div className="rounded-2xl border border-[color:var(--mist)] bg-white p-6 shadow-[var(--shadow-soft)]">
            {listing.description ? (
              <p className="whitespace-pre-line text-[15.5px] leading-[1.75] text-[color:var(--ink-2)]">
                {listing.description}
              </p>
            ) : (
              <p className="text-[14px] italic text-[color:var(--mute)]">
                Description à venir.
              </p>
            )}

            <ul className="mt-6 grid gap-3 text-[14px] text-[color:var(--ink-2)] sm:grid-cols-2">
              {listing.address ? (
                <InfoLine icon="📍" label={listing.address} />
              ) : null}
              {showPhone && listing.company.phone ? (
                <InfoLine icon="📞" label={listing.company.phone} />
              ) : null}
              {listing.company.website ? (
                <InfoLine
                  icon="🌐"
                  label={
                    <a
                      href={listing.company.website}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="hover-underline"
                    >
                      {new URL(listing.company.website).hostname}
                    </a>
                  }
                />
              ) : null}
              <InfoLine
                icon="🗓️"
                label={`Inscrit depuis ${new Date(listing.createdAt).toLocaleDateString("fr-FR")}`}
              />
            </ul>

            <SocialButtons
              className="mt-5"
              whatsapp={listing.whatsapp}
              facebook={listing.facebook}
              instagram={listing.instagram}
              phone={showPhone ? listing.company.phone : null}
              whatsappMessage={`Bonjour ${listing.company.name}, je vous contacte depuis ${directory.name}.`}
            />
          </div>

          <ServicesBlock
            services={listing.services.map((s) => ({
              id: s.id,
              title: s.title,
              items: s.items,
              priceLabel: s.priceLabel,
            }))}
          />

          {listing.googlePlaceId ? (
            <GoogleReviews
              rating={listing.googleRating}
              reviewCount={listing.googleReviewCount}
              mapsUrl={listing.googleMapsUrl}
              reviews={parseReviews(listing.googleReviewsJson)}
            />
          ) : null}

          {photos.length > 0 ? (
            <section>
              <h2 className="mb-4 font-syne text-[22px] font-bold">Galerie</h2>
              <PhotoCarousel photos={photos} alt={listing.company.name} />
            </section>
          ) : null}

          <section>
            <div className="mb-4 flex items-end justify-between">
              <h2 className="font-syne text-[22px] font-bold">Avis clients</h2>
              {listing.reviewCount > 0 ? (
                <div className="text-[13px] text-[color:var(--mute)]">
                  <Stars rating={listing.rating} showValue /> · {listing.reviewCount} avis
                </div>
              ) : null}
            </div>

            {listing.reviews.length === 0 ? (
              <div className="mb-6 rounded-2xl border border-dashed border-[color:var(--mist)] bg-white p-8 text-center text-[14px] text-[color:var(--mute)]">
                Aucun avis pour le moment. Soyez le premier à laisser un retour.
              </div>
            ) : (
              <ul className="mb-6 grid gap-3">
                {listing.reviews.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-2xl border border-[color:var(--mist)] bg-white p-5 shadow-[var(--shadow-soft)]"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-[14px] text-[color:var(--ink)]">
                        {r.authorName}
                      </strong>
                      <Stars rating={r.rating} />
                    </div>
                    {r.comment ? (
                      <p className="mt-2 text-[14.5px] leading-[1.65] text-[color:var(--ink-2)]">
                        {r.comment}
                      </p>
                    ) : null}
                    <div className="mt-2 text-[11.5px] text-[color:var(--mute-2)]">
                      {new Date(r.createdAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <ReviewForm listingId={listing.id} />
          </section>
        </article>

        {/* Sidebar contact sticky */}
        <aside className="md:sticky md:top-24 md:self-start">
          <div className="rounded-2xl border border-[color:var(--mist)] bg-white p-6 shadow-[var(--shadow-lift)]">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--mute)]">
              Contact rapide
            </div>
            <h3 className="mb-4 font-syne text-[20px] font-bold">
              Demander un devis gratuit
            </h3>
            <ContactForm listingId={listing.id} />
          </div>

          <div className="mt-4 rounded-2xl border border-[color:var(--mist)] bg-[color:var(--cream-2)] p-5 text-[13px] text-[color:var(--ink-2)]">
            <div className="mb-2 font-semibold">Pourquoi passer par {directory.name} ?</div>
            <ul className="space-y-1 text-[13px] text-[color:var(--mute)]">
              <li>✓ Professionnels vérifiés</li>
              <li>✓ Avis clients authentiques</li>
              <li>✓ Devis sans engagement</li>
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
}

function InfoLine({ icon, label }: { icon: string; label: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span aria-hidden className="text-[15px]">
        {icon}
      </span>
      <span>{label}</span>
    </li>
  );
}
