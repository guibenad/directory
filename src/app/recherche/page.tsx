import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentDirectory } from "@/lib/tenant";
import { PublicHeader } from "@/components/public/PublicHeader";
import { normalize } from "@/lib/seo";

export const dynamic = "force-dynamic";

type SearchParams = { metier?: string; ville?: string };

export default async function RecherchePage({ searchParams }: { searchParams: SearchParams }) {
  const directory = await getCurrentDirectory();
  if (!directory) notFound();

  const metier = searchParams.metier ? normalize(searchParams.metier) : undefined;
  const ville = searchParams.ville ? normalize(searchParams.ville) : undefined;

  if (metier && ville) {
    const exact = await prisma.seoPage.findUnique({
      where: { directoryId_slug: { directoryId: directory.id, slug: `${metier}/${ville}` } },
    });
    if (exact?.isPublished) {
      return (
        <div className="theme-public flex min-h-screen items-center justify-center px-8">
          <meta httpEquiv="refresh" content={`0; url=/${exact.slug}`} />
        </div>
      );
    }
  }

  const pages = await prisma.seoPage.findMany({
    where: {
      directoryId: directory.id,
      isPublished: true,
      ...(metier ? { metier } : {}),
      ...(ville ? { ville } : {}),
    },
    orderBy: [{ metierLabel: "asc" }, { villeLabel: "asc" }],
    take: 60,
  });

  return (
    <div className="theme-public min-h-screen">
      <PublicHeader directory={directory} />

      <main className="mx-auto max-w-[1100px] px-8 py-10">
        <h1 className="mb-6 font-syne text-[28px] font-bold">
          Résultats de recherche
          {searchParams.metier ? ` · ${searchParams.metier}` : ""}
          {searchParams.ville ? ` à ${searchParams.ville}` : ""}
        </h1>

        {pages.length === 0 ? (
          <p className="rounded-[14px] border border-dashed border-[#DDD] bg-white p-8 text-center text-[#555]">
            Aucune page correspondante.{" "}
            <Link href="/" style={{ color: directory.primaryColor }}>
              Retour à l'accueil
            </Link>
          </p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {pages.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/${p.slug}` as never}
                  className="block rounded-[14px] border border-[#E8E8E0] bg-white p-4 hover:border-[color:var(--brand)]"
                  style={{ ["--brand" as never]: directory.primaryColor }}
                >
                  <div className="font-syne text-[15px] font-bold">
                    {p.metierLabel} à {p.villeLabel}
                  </div>
                  <div className="mt-1 text-[12px]" style={{ color: directory.primaryColor }}>
                    /{p.slug}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
