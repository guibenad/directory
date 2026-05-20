import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveAdminDirectory } from "@/lib/scope";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams?: { directory?: string };
}) {
  const scope = await resolveAdminDirectory(searchParams);
  if (!scope) notFound();
  const { directory } = scope;

  const [plans, subs, payments] = await Promise.all([
    prisma.plan.findMany({
      where: { directoryId: directory.id },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.subscription.findMany({
      where: { directoryId: directory.id },
      include: { plan: true, company: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payment.findMany({
      where: { directoryId: directory.id },
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { company: { select: { name: true } } },
    }),
  ]);

  const countByPlan = new Map<string, number>();
  for (const s of subs) {
    if (s.status === "ACTIVE") {
      countByPlan.set(s.planId, (countByPlan.get(s.planId) ?? 0) + 1);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-syne text-[22px] font-bold">Abonnements — {directory.name}</h1>
        <p className="mt-1 text-[13.5px] text-text3">{subs.length} abonnements au total</p>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-4">
        {plans.map((p) => {
          const n = countByPlan.get(p.id) ?? 0;
          return (
            <div
              key={p.id}
              className="relative rounded-r2 border border-border bg-card p-7"
            >
              <div className="mb-1 font-syne text-[16px] font-bold">{p.name}</div>
              <div className="font-syne text-[36px] font-extrabold leading-none text-amber">
                {(p.priceCents / 100).toLocaleString("fr-FR")}€
                <span className="text-[14px] font-normal text-text2">/mois</span>
              </div>
              <div className="mt-3 text-[13px] text-text2">
                <strong className="text-text">{n}</strong> abonné{n > 1 ? "s" : ""} · MRR{" "}
                <strong className="text-text">
                  {((n * p.priceCents) / 100).toLocaleString("fr-FR")} €
                </strong>
              </div>
              {p.features.length > 0 ? (
                <ul className="my-5 flex flex-col gap-[8px]">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-[13px] text-text2">
                      <span className="text-green">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-r2 border border-border bg-card">
        <div className="border-b border-border px-6 py-4 font-syne text-[15px] font-semibold">
          Paiements récents
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Client", "Montant", "Statut", "Date"].map((h) => (
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
            {payments.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-text3">
                  Aucun paiement.
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-6 py-[14px] text-[13.5px] text-text">{p.company.name}</td>
                  <td className="px-6 py-[14px] text-[13.5px] text-text2">
                    {(p.amountCents / 100).toLocaleString("fr-FR")} {p.currency.toUpperCase()}
                  </td>
                  <td className="px-6 py-[14px]">
                    <span
                      className={[
                        "inline-flex rounded-md px-[10px] py-[4px] text-[12px] font-medium",
                        p.status === "succeeded"
                          ? "bg-green-bg text-green"
                          : p.status === "failed"
                            ? "bg-red-bg text-red"
                            : "bg-bg3 text-text2",
                      ].join(" ")}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-[14px] text-[13.5px] text-text3">
                    {p.createdAt.toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
