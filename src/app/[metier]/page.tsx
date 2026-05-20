import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentDirectory } from "@/lib/tenant";
import { siteUrl } from "@/lib/seo";
import { PublicHeader } from "@/components/public/PublicHeader";

export const revalidate = 3600;
export const dynamicParams = true;

type Params = { metier: string };

export async function generateStaticParams(): Promise<Params[]> {
  const cats = await prisma.category.findMany({ select: { slug: true }, distinct: ["slug"] });
  return cats.map((c) => ({ metier: c.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const directory = await getCurrentDirectory();
  if (!directory) return {};
  const category = await prisma.category.findUnique({
    where: { directoryId_slug: { directoryId: directory.id, slug: params.metier } },
  });
  if (!category) return {};
  const title = `${category.label} — Trouvez un pro · ${directory.name}`;
  const description = `Trouvez un ${category.label.toLowerCase()} proche de chez vous. Avis clients vérifiés et devis gratuit.`;
  return {
    title,
    description,
    alternates: { canonical: `${siteUrl(directory)}/${params.metier}` },
  };
}

export default async function MetierIndexPage({ params }: { params: Params }) {
  const directory = await getCurrentDirectory();
  if (!directory) notFound();

  const category = await prisma.category.findUnique({
    where: { directoryId_slug: { directoryId: directory.id, slug: params.metier } },
  });
  if (!category) notFound();

  const pages = await prisma.seoPage.findMany({
    where: { directoryId: directory.id, metier: params.metier, isPublished: true },
    orderBy: { villeLabel: "asc" },
  });

  const countsByVille = await prisma.listing.groupBy({
    by: ["ville"],
    where: {
      directoryId: directory.id,
      category: { slug: params.metier },
      isPublished: true,
    },
    _count: { _all: true },
  });
  const countFor = (v: string) => countsByVille.find((c) => c.ville === v)?._count._all ?? 0;

  return (
    <div className="theme-public min-h-screen">
      <PublicHeader directory={directory} />

      <section className="bg-[#1A1A1A] px-8 py-16 text-center text-white">
        <nav className="mb-3 text-[13px] text-[#999]">
          <Link href="/" className="hover:text-[color:var(--brand)]" style={{ ["--brand" as never]: directory.primaryColor }}>
            Accueil
          </Link>{" "}
          › <strong className="text-white">{category.label}</strong>
        </nav>
        <h1 className="mx-auto max-w-3xl font-syne text-[42px] font-extrabold leading-[1.15]">
          <span style={{ color: directory.primaryColor }}>{category.label}</span> en France
        </h1>
        <p className="mx-auto mt-4 max-w-[600px] text-[17px] text-[#B0B0B0]">
          Sélectionnez votre ville pour voir les {category.label.toLowerCase()}s proches.
        </p>
      </section>

      <main className="mx-auto max-w-[1100px] px-8 py-10">
        <h2 className="mb-6 font-syne text-[22px] font-bold">Villes couvertes ({pages.length})</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {pages.map((p) => (
            <Link
              key={p.slug}
              href={`/${p.slug}` as never}
              className="rounded-[14px] border border-[#E8E8E0] bg-white p-5 transition-all hover:border-[color:var(--brand)]"
              style={{ ["--brand" as never]: directory.primaryColor }}
            >
              <div className="font-syne text-[17px] font-bold text-[#1A1A1A]">
                {category.label} à {p.villeLabel}
              </div>
              <div className="mt-1 text-[13px] text-[#777]">
                {countFor(p.ville)} professionnel{countFor(p.ville) > 1 ? "s" : ""} référencé
                {countFor(p.ville) > 1 ? "s" : ""}
              </div>
            </Link>
          ))}
        </div>
      </main>

      <footer className="bg-[#1A1A1A] px-8 py-10 text-center text-[13px] text-[#888]">
        {directory.name} — {category.label} près de chez vous
      </footer>
    </div>
  );
}
