import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CompanyEditForm } from "./CompanyEditForm";
import { AddToDirectoryButton } from "./AddToDirectoryButton";

export const dynamic = "force-dynamic";

const STATUS_BADGE = {
  ACTIVE: { bg: "bg-green-bg", color: "text-green", label: "Actif" },
  TRIAL: { bg: "bg-amber-bg", color: "text-amber", label: "Essai" },
  SUSPENDED: { bg: "bg-red-bg", color: "text-red", label: "Suspendu" },
  CANCELLED: { bg: "bg-bg3", color: "text-text2", label: "Annulé" },
} as const;

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const company = await prisma.company.findUnique({
    where: { id: params.id },
    include: {
      subscriptions: {
        include: { plan: true, directory: true },
        orderBy: { createdAt: "desc" },
      },
      listings: {
        include: {
          directory: { select: { name: true, slug: true, primaryColor: true } },
          category: { select: { label: true } },
          _count: { select: { messages: true, reviews: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      payments: {
        include: { company: false },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
  if (!company) notFound();

  const totalPaidCents = company.payments
    .filter((p) => p.status === "succeeded")
    .reduce((s, p) => s + p.amountCents, 0);

  const activeMrrCents = company.subscriptions
    .filter((s) => s.status === "ACTIVE")
    .reduce((s, sub) => s + sub.plan.priceCents, 0);

  // Map listings par directoryId pour jointure rapide
  const listingsByDir = new Map(company.listings.map((l) => [l.directoryId, l]));

  // Annuaires disponibles = actifs - ceux auxquels le client est déjà abonné (non-cancelled)
  const activeSubDirectoryIds = new Set(
    company.subscriptions
      .filter((s) => s.status !== "CANCELLED")
      .map((s) => s.directoryId),
  );
  const allDirectories = await prisma.directory.findMany({
    where: { isActive: true },
    include: {
      categories: { orderBy: [{ sortOrder: "asc" }, { label: "asc" }], select: { id: true, label: true } },
      plans: { orderBy: { sortOrder: "asc" }, select: { id: true, name: true, priceCents: true, key: true } },
    },
  });
  const availableDirectories = allDirectories
    .filter((d) => !activeSubDirectoryIds.has(d.id))
    .map((d) => ({
      id: d.id,
      slug: d.slug,
      name: d.name,
      primaryColor: d.primaryColor,
      categories: d.categories,
      plans: d.plans,
    }));

  return (
    <div>
      <Link
        href="/super-admin/clients"
        className="mb-4 inline-flex items-center gap-1 text-[13px] text-text3 hover:text-amber"
      >
        ← Retour aux clients
      </Link>

      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text3">
            Client global
          </div>
          <h1 className="mt-1 font-syne text-[26px] font-bold">{company.name}</h1>
          <p className="mt-1 text-[13.5px] text-text3">
            {company.email} · Inscrit le{" "}
            {company.createdAt.toLocaleDateString("fr-FR")}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <Kpi
          label="Annuaires souscrits"
          value={company.subscriptions.length}
          color="text-amber"
        />
        <Kpi label="Fiches publiées" value={company.listings.length} color="text-green" />
        <Kpi
          label="MRR actif"
          value={`${(activeMrrCents / 100).toLocaleString("fr-FR")} €`}
          color="text-blue"
        />
        <Kpi
          label="Total encaissé"
          value={`${(totalPaidCents / 100).toLocaleString("fr-FR")} €`}
          color="text-purple"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          {/* Abonnements par annuaire */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-syne text-[16px] font-semibold">Annuaires souscrits</h2>
              <AddToDirectoryButton
                companyId={company.id}
                availableDirectories={availableDirectories}
              />
            </div>
            {company.subscriptions.length === 0 ? (
              <div className="rounded-r2 border border-dashed border-border bg-card p-8 text-center text-text3">
                Ce client n'a aucun abonnement.
              </div>
            ) : (
              <div className="space-y-3">
                {company.subscriptions.map((s) => {
                  const badge = STATUS_BADGE[s.status];
                  const listing = listingsByDir.get(s.directoryId);
                  return (
                    <div
                      key={s.id}
                      className="flex items-start gap-4 rounded-r2 border border-border bg-card p-5"
                    >
                      <span
                        className="flex h-12 w-12 items-center justify-center rounded-xl font-syne text-[16px] font-bold text-[#0F1117]"
                        style={{ background: s.directory.primaryColor }}
                      >
                        {s.directory.name[0]}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link
                              href={`/super-admin/annuaires/${s.directoryId}`}
                              className="font-syne text-[16px] font-bold text-text hover:text-amber"
                            >
                              {s.directory.name}
                            </Link>
                            <div className="text-[12px] text-text3">/{s.directory.slug}</div>
                          </div>
                          <span
                            className={`inline-flex rounded-md px-[10px] py-[4px] text-[12px] font-medium ${badge.bg} ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center gap-4 text-[13px] text-text2">
                          <span className="text-amber">
                            {s.plan.name} — {(s.plan.priceCents / 100).toLocaleString("fr-FR")} €/mois
                          </span>
                          {listing ? (
                            <>
                              <span>·</span>
                              <span>
                                {listing.category.label} · {listing.villeLabel ?? listing.ville}
                              </span>
                              <span>·</span>
                              <span>{listing._count.messages} messages</span>
                            </>
                          ) : null}
                        </div>

                        <div className="mt-3 flex gap-3 text-[12.5px]">
                          {listing ? (
                            <Link
                              href={`/admin/fiches/${listing.id}?directory=${s.directory.slug}` as never}
                              className="text-amber hover:underline"
                            >
                              Éditer la fiche →
                            </Link>
                          ) : null}
                          <Link
                            href={`/admin/abonnements?directory=${s.directory.slug}`}
                            className="text-text2 hover:text-text"
                          >
                            Voir l'admin →
                          </Link>
                          {listing ? (
                            <Link
                              href={`/entreprise/${listing.slug}` as never}
                              target="_blank"
                              className="text-text2 hover:text-text"
                            >
                              Fiche publique ↗
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Paiements */}
          <section>
            <h2 className="mb-3 font-syne text-[16px] font-semibold">Historique paiements</h2>
            {company.payments.length === 0 ? (
              <div className="rounded-r2 border border-dashed border-border bg-card p-8 text-center text-text3">
                Aucun paiement.
              </div>
            ) : (
              <div className="overflow-hidden rounded-r2 border border-border bg-card">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {["Date", "Montant", "Statut"].map((h) => (
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
                    {company.payments.map((p) => (
                      <tr key={p.id} className="border-b border-border last:border-0">
                        <td className="px-6 py-3 text-[13px] text-text2">
                          {p.createdAt.toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-6 py-3 text-[13px] text-text">
                          {(p.amountCents / 100).toLocaleString("fr-FR")}{" "}
                          {p.currency.toUpperCase()}
                        </td>
                        <td className="px-6 py-3">
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <aside>
          <CompanyEditForm
            company={{
              id: company.id,
              name: company.name,
              email: company.email,
              phone: company.phone,
              website: company.website,
              stripeCustomerId: company.stripeCustomerId,
              slug: company.slug,
            }}
          />
        </aside>
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
  color: string;
}) {
  return (
    <div className="rounded-r2 border border-border bg-card px-5 py-4">
      <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.8px] text-text3">
        {label}
      </div>
      <div className={`font-syne text-[26px] font-bold leading-[1.1] ${color}`}>{value}</div>
    </div>
  );
}
