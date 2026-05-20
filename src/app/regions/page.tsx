import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentDirectory } from "@/lib/tenant";
import { siteUrl } from "@/lib/seo";
import { PublicHeader } from "@/components/public/PublicHeader";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const directory = await getCurrentDirectory();
  if (!directory) return {};
  return {
    title: `${directory.name} par région — toutes les régions de France`,
    description: `Parcourez ${directory.name} par région : départements, villes et professionnels partout en France.`,
    alternates: { canonical: `${siteUrl(directory)}/regions` },
  };
}

export default async function RegionsIndexPage() {
  const directory = await getCurrentDirectory();
  if (!directory) notFound();

  // Toutes les régions qui ont au moins une ville dans nos pages SEO
  const seoRegions = await prisma.seoPage.findMany({
    where: { directoryId: directory.id, isPublished: true, region: { not: null } },
    select: { region: true, regionLabel: true },
    distinct: ["region"],
  });

  const regionCodes = seoRegions.map((r) => r.region).filter((r): r is string => Boolean(r));
  const regions =
    regionCodes.length > 0
      ? await prisma.geoRegion.findMany({
          where: { code: { in: regionCodes } },
          orderBy: { name: "asc" },
          include: { departements: { include: { _count: { select: { villes: true } } } } },
        })
      : [];

  return (
    <div className="theme-public min-h-screen" style={{ ["--brand" as never]: directory.primaryColor }}>
      <PublicHeader directory={directory} />

      <section className="relative overflow-hidden">
        <div className="hero-mesh-light noise absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-[1200px] px-6 py-14">
          <nav className="mb-3 text-[13px] text-[color:var(--mute)]">
            <Link href="/" className="hover-underline">Accueil</Link>{" "}
            › <strong className="text-[color:var(--ink)]">Toutes les régions</strong>
          </nav>
          <h1 className="font-syne text-[clamp(32px,5vw,52px)] font-extrabold leading-[1.05] tracking-[-0.02em]">
            {directory.name} en <span style={{ color: directory.primaryColor }}>France entière</span>
          </h1>
          <p className="mt-3 max-w-2xl text-[15.5px] leading-[1.6] text-[color:var(--mute)]">
            Choisissez votre région pour accéder aux départements, villes et aux professionnels
            référencés près de chez vous.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-[1200px] px-6 pb-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {regions.map((r) => (
            <Link
              key={r.code}
              href={`/region/${r.slug}` as never}
              className="card-lift rounded-2xl border border-[color:var(--mist)] bg-white p-6"
            >
              <div className="font-syne text-[18px] font-bold leading-tight text-[color:var(--ink)]">
                {r.name}
              </div>
              <div className="mt-1 text-[13px] text-[color:var(--mute)]">
                {r.departements.length} département{r.departements.length > 1 ? "s" : ""} ·{" "}
                {r.departements.reduce((s, d) => s + d._count.villes, 0)} villes
              </div>
              <div className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-[color:var(--ink-2)]">
                Explorer →
              </div>
            </Link>
          ))}
          {regions.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-[color:var(--mist)] bg-white p-10 text-center text-[color:var(--mute)]">
              Aucune région couverte pour le moment.
            </div>
          ) : null}
        </div>
      </main>

      <footer className="border-t border-[color:var(--mist)] bg-white/60">
        <div className="mx-auto max-w-[1200px] px-6 py-10 text-center text-[13px] text-[color:var(--mute)]">
          {directory.name} · Toutes les régions
        </div>
      </footer>
    </div>
  );
}
