import { prisma } from "@/lib/prisma";
import type { SubscriptionStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<SubscriptionStatus, { bg: string; color: string; label: string }> = {
  ACTIVE: { bg: "bg-green-bg", color: "text-green", label: "Actif" },
  TRIAL: { bg: "bg-amber-bg", color: "text-amber", label: "Essai" },
  SUSPENDED: { bg: "bg-red-bg", color: "text-red", label: "Suspendu" },
  CANCELLED: { bg: "bg-bg3", color: "text-text2", label: "Annulé" },
};

export default async function AllSubscriptionsPage() {
  const subs = await prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      plan: true,
      directory: { select: { name: true, slug: true, primaryColor: true } },
      company: { select: { name: true, email: true } },
    },
  });

  const totalMrrCents = subs
    .filter((s) => s.status === "ACTIVE")
    .reduce((s, sub) => s + sub.plan.priceCents, 0);

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-syne text-[22px] font-bold">Tous les abonnements</h1>
          <p className="mt-1 text-[13.5px] text-text3">
            MRR consolidé{" "}
            <strong className="text-amber">
              {(totalMrrCents / 100).toLocaleString("fr-FR")} €
            </strong>{" "}
            · {subs.length} abonnements
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-r2 border border-border bg-card">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Annuaire", "Client", "Plan", "Montant", "Statut", "Créé le"].map((h) => (
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
            {subs.map((s) => {
              const badge = STATUS_BADGE[s.status];
              return (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-bg3">
                  <td className="px-6 py-[14px] text-[13.5px]">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: s.directory.primaryColor }}
                      />
                      <span className="text-text">{s.directory.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-[14px] text-[13px]">
                    <div className="text-text">{s.company.name}</div>
                    <div className="text-[12px] text-text3">{s.company.email}</div>
                  </td>
                  <td className="px-6 py-[14px] text-[13px] text-text2">{s.plan.name}</td>
                  <td className="px-6 py-[14px] text-[13px] text-amber">
                    {(s.plan.priceCents / 100).toLocaleString("fr-FR")} €/mois
                  </td>
                  <td className="px-6 py-[14px]">
                    <span
                      className={`inline-flex rounded-md px-[10px] py-[4px] text-[12px] font-medium ${badge.bg} ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-6 py-[14px] text-[13px] text-text3">
                    {s.createdAt.toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              );
            })}
            {subs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-text3">
                  Aucun abonnement.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
