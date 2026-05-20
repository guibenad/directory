import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const companies = await prisma.company.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      subscriptions: {
        include: { plan: true, directory: { select: { name: true, slug: true } } },
      },
      _count: { select: { listings: true, payments: true } },
    },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-syne text-[22px] font-bold">Clients (tous annuaires)</h1>
        <p className="mt-1 text-[13.5px] text-text3">
          {companies.length} clients · vue consolidée multi-annuaire
        </p>
      </div>

      <div className="overflow-hidden rounded-r2 border border-border bg-card">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Client", "Email", "Annuaires souscrits", "Fiches", "Paiements", "Créé le", ""].map((h) => (
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
            {companies.map((c) => (
              <tr key={c.id} className="group border-b border-border last:border-0 hover:bg-bg3">
                <td className="px-6 py-[14px] text-[13.5px]">
                  <Link
                    href={`/super-admin/clients/${c.id}`}
                    className="font-medium text-text hover:text-amber"
                  >
                    {c.name}
                  </Link>
                  <div className="text-[12px] text-text3">/{c.slug}</div>
                </td>
                <td className="px-6 py-[14px] text-[13px] text-text2">{c.email}</td>
                <td className="px-6 py-[14px]">
                  <div className="flex flex-wrap gap-1">
                    {c.subscriptions.length === 0 ? (
                      <span className="text-[12px] text-text3">—</span>
                    ) : (
                      c.subscriptions.map((s) => (
                        <span
                          key={s.id}
                          title={`${s.directory.name} — ${s.plan.name}`}
                          className={[
                            "inline-flex rounded-md px-[8px] py-[3px] text-[11.5px] font-medium",
                            s.status === "ACTIVE"
                              ? "bg-green-bg text-green"
                              : s.status === "TRIAL"
                                ? "bg-amber-bg text-amber"
                                : s.status === "SUSPENDED"
                                  ? "bg-red-bg text-red"
                                  : "bg-bg3 text-text2",
                          ].join(" ")}
                        >
                          {s.directory.name} · {s.plan.name}
                        </span>
                      ))
                    )}
                  </div>
                </td>
                <td className="px-6 py-[14px] text-[13px] text-text2">{c._count.listings}</td>
                <td className="px-6 py-[14px] text-[13px] text-text2">{c._count.payments}</td>
                <td className="px-6 py-[14px] text-[13px] text-text3">
                  {c.createdAt.toLocaleDateString("fr-FR")}
                </td>
                <td className="px-6 py-[14px] text-right text-[12.5px]">
                  <Link
                    href={`/super-admin/clients/${c.id}`}
                    className="text-amber opacity-0 transition-opacity group-hover:opacity-100 hover:underline"
                  >
                    Détail →
                  </Link>
                </td>
              </tr>
            ))}
            {companies.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-text3">
                  Aucun client.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
