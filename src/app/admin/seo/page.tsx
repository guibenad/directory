import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveAdminDirectory } from "@/lib/scope";

export const dynamic = "force-dynamic";

export default async function AdminSeoPage({
  searchParams,
}: {
  searchParams?: { directory?: string };
}) {
  const scope = await resolveAdminDirectory(searchParams);
  if (!scope) notFound();
  const { directory } = scope;

  const [pages, categories, villesCount, publishedCount] = await Promise.all([
    prisma.seoPage.findMany({
      where: { directoryId: directory.id },
      orderBy: { createdAt: "desc" },
      take: 36,
    }),
    prisma.category.count({ where: { directoryId: directory.id } }),
    prisma.seoPage
      .findMany({
        where: { directoryId: directory.id },
        select: { ville: true },
        distinct: ["ville"],
      })
      .then((r) => r.length),
    prisma.seoPage.count({ where: { directoryId: directory.id, isPublished: true } }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-syne text-[22px] font-bold">SEO — {directory.name}</h1>
        <p className="mt-1 text-[13.5px] text-text3">
          {publishedCount} pages publiées · {categories} catégories · {villesCount} villes
        </p>
      </div>

      <div className="mb-6 grid grid-cols-4 gap-4">
        <Kpi label="Pages publiées" value={publishedCount} color="text-amber" />
        <Kpi label="Catégories" value={categories} color="text-green" />
        <Kpi label="Villes" value={villesCount} color="text-blue" />
        <Kpi label="Combinaisons" value={categories * villesCount} color="text-purple" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {pages.map((p) => (
          <Link
            key={p.id}
            href={`/${p.slug}` as never}
            target="_blank"
            className="group rounded-r border border-border bg-card p-5 transition-all hover:-translate-y-[2px] hover:border-amber"
          >
            <div className="mb-2 text-[12px] text-amber">/{p.slug}</div>
            <div className="font-syne text-[14px] font-medium text-text">{p.title}</div>
            <div className="mt-2 flex gap-3 text-[12px] text-text3">
              <span>{p.isPublished ? "Publiée" : "Brouillon"}</span>
              <span>·</span>
              <span>{new Date(p.createdAt).toLocaleDateString("fr-FR")}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Kpi({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-r2 border border-border bg-card px-6 py-5">
      <div className="mb-2 text-[12px] font-medium uppercase tracking-[0.8px] text-text3">
        {label}
      </div>
      <div className={`font-syne text-[32px] font-bold leading-[1.1] ${color}`}>{value}</div>
    </div>
  );
}
