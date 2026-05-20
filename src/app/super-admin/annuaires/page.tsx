import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CreateDirectoryButton } from "@/components/super-admin/CreateDirectoryButton";

export const dynamic = "force-dynamic";

export default async function DirectoriesPage() {
  const directories = await prisma.directory.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { listings: true, subscriptions: true, seoPages: true, categories: true } },
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-syne text-[22px] font-bold">Annuaires</h1>
          <p className="mt-1 text-[13.5px] text-text3">
            {directories.length} annuaire{directories.length > 1 ? "s" : ""} configuré
            {directories.length > 1 ? "s" : ""}
          </p>
        </div>
        <CreateDirectoryButton />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {directories.map((d) => (
          <Link
            key={d.id}
            href={`/super-admin/annuaires/${d.id}`}
            className="group rounded-r2 border border-border bg-card p-6 transition-all hover:border-amber"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-lg font-syne text-[18px] font-bold text-[#0F1117]"
                  style={{ background: d.primaryColor }}
                >
                  {d.name[0]}
                </span>
                <div>
                  <div className="font-syne text-[17px] font-bold text-text group-hover:text-amber">
                    {d.name}
                  </div>
                  <div className="text-[12px] text-text3">/{d.slug}</div>
                </div>
              </div>
              <span
                className={[
                  "inline-flex rounded-md px-[10px] py-[4px] text-[12px] font-medium",
                  d.isActive ? "bg-green-bg text-green" : "bg-red-bg text-red",
                ].join(" ")}
              >
                {d.isActive ? "Actif" : "Inactif"}
              </span>
            </div>

            {d.tagline ? (
              <p className="mt-3 text-[13px] text-text2">{d.tagline}</p>
            ) : null}

            <div className="mt-4 grid grid-cols-4 gap-3 text-center text-[12px]">
              <Stat label="Catégories" value={d._count.categories} />
              <Stat label="Fiches" value={d._count.listings} />
              <Stat label="Abonnés" value={d._count.subscriptions} />
              <Stat label="Pages SEO" value={d._count.seoPages} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-bg3 px-3 py-2">
      <div className="font-syne text-[16px] font-bold text-text">{value}</div>
      <div className="text-text3">{label}</div>
    </div>
  );
}
