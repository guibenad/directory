import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-server";
import { BillingPortalButton } from "./BillingPortalButton";

export const dynamic = "force-dynamic";

const STATUS_BADGE = {
  ACTIVE: { bg: "bg-green-bg", color: "text-green", label: "Actif" },
  TRIAL: { bg: "bg-amber-bg", color: "text-amber", label: "Essai" },
  SUSPENDED: { bg: "bg-red-bg", color: "text-red", label: "Suspendu" },
  CANCELLED: { bg: "bg-bg3", color: "text-text2", label: "Annulé" },
} as const;

export default async function MyAccountPage() {
  const session = await requireSession();
  if (!session?.user.companyId) notFound();

  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
    include: {
      subscriptions: {
        include: {
          plan: true,
          directory: true,
        },
        orderBy: { createdAt: "desc" },
      },
      listings: {
        include: {
          directory: { select: { name: true, slug: true, primaryColor: true } },
          category: { select: { label: true } },
        },
      },
    },
  });
  if (!company) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-syne text-[22px] font-bold">Bonjour {company.name}</h1>
        <p className="mt-1 text-[13.5px] text-text3">
          {company.subscriptions.length} abonnement{company.subscriptions.length > 1 ? "s" : ""}
        </p>
      </div>

      {company.stripeCustomerId ? <BillingPortalButton /> : null}

      <section>
        <h2 className="mb-3 font-syne text-[16px] font-semibold">Mes abonnements</h2>
        {company.subscriptions.length === 0 ? (
          <div className="rounded-r2 border border-dashed border-border bg-card p-8 text-center text-text3">
            Aucun abonnement actif.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {company.subscriptions.map((s) => {
              const badge = STATUS_BADGE[s.status];
              const listing = company.listings.find((l) => l.directoryId === s.directoryId);
              return (
                <div
                  key={s.id}
                  className="rounded-r2 border border-border bg-card p-5"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-lg font-syne text-[14px] font-bold text-[#0F1117]"
                        style={{ background: s.directory.primaryColor }}
                      >
                        {s.directory.name[0]}
                      </span>
                      <div>
                        <div className="font-syne text-[16px] font-bold text-text">
                          {s.directory.name}
                        </div>
                        <div className="text-[12px] text-text3">{s.plan.name}</div>
                      </div>
                    </div>
                    <span
                      className={`inline-flex rounded-md px-[10px] py-[4px] text-[12px] font-medium ${badge.bg} ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div className="text-[13px] text-text2">
                    <strong className="text-amber">
                      {(s.plan.priceCents / 100).toLocaleString("fr-FR")} €/mois
                    </strong>
                  </div>

                  {listing ? (
                    <div className="mt-3 rounded-lg border border-border bg-bg3 p-3 text-[12.5px] text-text2">
                      <div className="text-text3">Fiche publique</div>
                      <div className="mt-1 font-medium text-text">
                        {listing.category.label} · {listing.villeLabel ?? listing.ville}
                      </div>
                      <Link
                        href={`/mon-compte/${listing.id}` as never}
                        className="mt-2 inline-block text-amber hover:underline"
                      >
                        Gérer ma fiche →
                      </Link>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-syne text-[16px] font-semibold">Ajouter un annuaire</h2>
        <Link
          href="/inscription"
          className="inline-block rounded-lg bg-amber px-5 py-2 text-[13px] font-medium text-[#0F1117]"
        >
          Inscrire dans un nouvel annuaire
        </Link>
      </section>
    </div>
  );
}
