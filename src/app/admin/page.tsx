import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveAdminDirectory } from "@/lib/scope";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams?: { directory?: string };
}) {
  const scope = await resolveAdminDirectory(searchParams);
  if (!scope) notFound();
  const { directory } = scope;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [subCounts, activeCount, messagesMonth, seoPublished, recentListings, plans] =
    await Promise.all([
      prisma.subscription.groupBy({
        by: ["planId"],
        where: { directoryId: directory.id, status: "ACTIVE" },
        _count: { _all: true },
      }),
      prisma.subscription.count({ where: { directoryId: directory.id, status: "ACTIVE" } }),
      prisma.message.count({
        where: { directoryId: directory.id, createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.seoPage.count({ where: { directoryId: directory.id, isPublished: true } }),
      prisma.listing.findMany({
        where: { directoryId: directory.id },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          company: { select: { name: true } },
          category: { select: { label: true } },
        },
      }),
      prisma.plan.findMany({ where: { directoryId: directory.id } }),
    ]);

  const planById = new Map(plans.map((p) => [p.id, p]));
  const mrrCents = subCounts.reduce((sum, r) => {
    const p = planById.get(r.planId);
    return sum + r._count._all * (p?.priceCents ?? 0);
  }, 0);
  const total = subCounts.reduce((s, r) => s + r._count._all, 0);
  const pctFor = (planId: string) => {
    const n = subCounts.find((r) => r.planId === planId)?._count._all ?? 0;
    return total === 0 ? 0 : Math.round((n / total) * 100);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-syne text-[22px] font-bold">Tableau de bord · {directory.name}</h1>
        <p className="mt-1 text-[13.5px] text-text3">Vue d'ensemble de l'annuaire</p>
      </div>

      <div className="mb-8 grid grid-cols-4 gap-4">
        <Kpi label="Abonnements actifs" value={activeCount} color="amber" />
        <Kpi
          label="MRR"
          value={`${(mrrCents / 100).toLocaleString("fr-FR")} €`}
          color="green"
        />
        <Kpi label="Messages 30j" value={messagesMonth} color="blue" />
        <Kpi label="Pages SEO publiées" value={seoPublished} color="purple" />
      </div>

      <div className="grid grid-cols-[1.6fr_1fr] gap-4">
        <div className="rounded-r2 border border-border bg-card p-6">
          <div className="mb-4 font-syne text-[15px] font-semibold">Dernières fiches</div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Fiche", "Catégorie", "Ville", "Créée le"].map((h) => (
                  <th
                    key={h}
                    className="border-b border-border pb-2 text-left text-[11.5px] font-medium uppercase tracking-[0.7px] text-text3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentListings.map((l) => (
                <tr key={l.id} className="border-b border-border last:border-0">
                  <td className="py-3 text-[13.5px] text-text">{l.company.name}</td>
                  <td className="py-3 text-[13px] text-text2">{l.category.label}</td>
                  <td className="py-3 text-[13px] text-text2">{l.villeLabel ?? l.ville}</td>
                  <td className="py-3 text-[13px] text-text3">
                    {l.createdAt.toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
              {recentListings.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-text3">
                    Aucune fiche.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="rounded-r2 border border-border bg-card p-6">
          <div className="mb-4 font-syne text-[15px] font-semibold">Répartition des plans</div>
          <div className="space-y-3">
            {plans.map((p) => (
              <div key={p.id}>
                <div className="mb-1 flex items-center justify-between text-[13px]">
                  <span className="text-text">{p.name}</span>
                  <span className="text-text2">{pctFor(p.id)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-bg3">
                  <div
                    className="h-full bg-amber"
                    style={{ width: `${pctFor(p.id)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: "amber" | "green" | "blue" | "purple";
}) {
  const colorClass = {
    amber: "text-amber",
    green: "text-green",
    blue: "text-blue",
    purple: "text-purple",
  }[color];
  return (
    <div className="rounded-r2 border border-border bg-card px-6 py-5">
      <div className="mb-2 text-[12px] font-medium uppercase tracking-[0.8px] text-text3">
        {label}
      </div>
      <div className={`font-syne text-[32px] font-bold leading-[1.1] ${colorClass}`}>{value}</div>
    </div>
  );
}
