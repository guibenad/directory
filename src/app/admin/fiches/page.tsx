import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveAdminDirectory } from "@/lib/scope";
import { ListingsTable } from "@/components/admin/ListingsTable";

export const dynamic = "force-dynamic";

export default async function ListingsPage({
  searchParams,
}: {
  searchParams?: { directory?: string };
}) {
  const scope = await resolveAdminDirectory(searchParams);
  if (!scope) notFound();
  const { directory } = scope;

  const [total, categories, plans] = await Promise.all([
    prisma.listing.count({ where: { directoryId: directory.id } }),
    prisma.category.findMany({
      where: { directoryId: directory.id },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
      select: { id: true, label: true },
    }),
    prisma.plan.findMany({
      where: { directoryId: directory.id },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, key: true },
    }),
  ]);

  const qs = searchParams?.directory ? `?directory=${searchParams.directory}` : "";

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-syne text-[22px] font-bold">Fiches — {directory.name}</h1>
          <p className="mt-1 text-[13.5px] text-text3">
            {total.toLocaleString("fr-FR")} fiche{total > 1 ? "s" : ""} au total · utilisez les
            filtres pour affiner
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/api/admin/listings/export${qs}`}
            className="rounded-lg border border-border2 px-4 py-[7px] text-[13px] text-text2 hover:border-amber hover:text-amber"
          >
            Export CSV
          </Link>
          <Link
            href={`/admin/fiches/nouvelle${qs}` as never}
            className="rounded-lg bg-amber px-4 py-[7px] text-[13px] font-medium text-[#0F1117]"
          >
            + Nouvelle fiche
          </Link>
        </div>
      </div>

      <ListingsTable
        categories={categories}
        plans={plans}
        directorySlug={searchParams?.directory}
      />
    </div>
  );
}
