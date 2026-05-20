import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SuperAdminDashboardPage() {
  const [directories, companiesCount, listingsCount, subs, payments] = await Promise.all([
    prisma.directory.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        _count: { select: { listings: true, subscriptions: true, seoPages: true } },
      },
    }),
    prisma.company.count(),
    prisma.listing.count(),
    prisma.subscription.findMany({
      where: { status: "ACTIVE" },
      include: { plan: true, directory: { select: { name: true, slug: true } } },
    }),
    prisma.payment.aggregate({
      where: {
        status: "succeeded",
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) },
      },
      _sum: { amountCents: true },
    }),
  ]);

  const totalMrrCents = subs.reduce((s, sub) => s + sub.plan.priceCents, 0);
  const mrrByDir = new Map<string, number>();
  for (const sub of subs) {
    mrrByDir.set(
      sub.directoryId,
      (mrrByDir.get(sub.directoryId) ?? 0) + sub.plan.priceCents,
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-syne text-[26px] font-bold">Vue globale</h1>
        <p className="mt-1 text-[13.5px] text-text3">
          Tous les annuaires, tous les clients, toutes les stats
        </p>
      </div>

      <div className="mb-8 grid grid-cols-4 gap-4">
        <Kpi label="Annuaires actifs" value={directories.filter((d) => d.isActive).length} color="amber" />
        <Kpi label="Clients uniques" value={companiesCount} color="green" />
        <Kpi label="Fiches publiées" value={listingsCount} color="blue" />
        <Kpi
          label="MRR consolidé"
          value={`${(totalMrrCents / 100).toLocaleString("fr-FR")} €`}
          color="purple"
        />
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-syne text-[18px] font-semibold">Performances par annuaire</h2>
        <Link
          href="/super-admin/annuaires"
          className="text-[13px] text-amber hover:underline"
        >
          Gérer les annuaires →
        </Link>
      </div>

      <div className="overflow-hidden rounded-r2 border border-border bg-card">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Annuaire", "Domaines", "Fiches", "Abonnés", "Pages SEO", "MRR", "Statut"].map((h) => (
                <th
                  key={h}
                  className="border-b border-border px-6 py-[10px] text-left text-[11.5px] font-medium uppercase tracking-[0.7px] text-text3"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {directories.map((d) => (
              <tr key={d.id} className="border-b border-border last:border-0">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-md font-syne text-[14px] font-bold text-[#0F1117]"
                      style={{ background: d.primaryColor }}
                    >
                      {d.name[0]}
                    </span>
                    <div>
                      <Link
                        href={`/super-admin/annuaires/${d.id}`}
                        className="text-[14px] font-medium text-text hover:text-amber"
                      >
                        {d.name}
                      </Link>
                      <div className="text-[12px] text-text3">/{d.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-[13px] text-text2">
                  {d.domains.length === 0 ? (
                    <span className="text-text3">—</span>
                  ) : (
                    d.domains.map((h) => (
                      <div key={h} className="text-[12.5px]">
                        {h}
                      </div>
                    ))
                  )}
                </td>
                <td className="px-6 py-4 text-[13px] text-text">{d._count.listings}</td>
                <td className="px-6 py-4 text-[13px] text-text">{d._count.subscriptions}</td>
                <td className="px-6 py-4 text-[13px] text-text">{d._count.seoPages}</td>
                <td className="px-6 py-4 text-[13px] text-amber">
                  {((mrrByDir.get(d.id) ?? 0) / 100).toLocaleString("fr-FR")} €
                </td>
                <td className="px-6 py-4">
                  <span
                    className={[
                      "inline-flex rounded-md px-[10px] py-[4px] text-[12px] font-medium",
                      d.isActive ? "bg-green-bg text-green" : "bg-red-bg text-red",
                    ].join(" ")}
                  >
                    {d.isActive ? "Actif" : "Désactivé"}
                  </span>
                </td>
              </tr>
            ))}
            {directories.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-text3">
                  Aucun annuaire — créez le premier depuis la page Annuaires.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-6 rounded-r2 border border-border bg-card p-6">
        <div className="mb-2 font-syne text-[15px] font-semibold">Paiements encaissés sur 30 jours</div>
        <div className="font-syne text-[28px] font-extrabold text-green">
          {((payments._sum.amountCents ?? 0) / 100).toLocaleString("fr-FR")} €
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
