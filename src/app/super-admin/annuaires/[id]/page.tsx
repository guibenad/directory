import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DirectorySettingsForm } from "./DirectorySettingsForm";

export const dynamic = "force-dynamic";

export default async function DirectoryDetailPage({ params }: { params: { id: string } }) {
  const directory = await prisma.directory.findUnique({
    where: { id: params.id },
    include: {
      categories: { orderBy: { sortOrder: "asc" } },
      plans: { orderBy: { sortOrder: "asc" } },
      _count: { select: { listings: true, subscriptions: true, seoPages: true } },
    },
  });
  if (!directory) notFound();

  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-[13px] text-text3">
        <Link href="/super-admin/annuaires" className="hover:text-amber">
          ← Annuaires
        </Link>
      </div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-syne text-[26px] font-bold">{directory.name}</h1>
          <p className="mt-1 text-[13.5px] text-text3">
            /{directory.slug} · {directory._count.listings} fiches · {directory._count.subscriptions}{" "}
            abonnés · {directory._count.seoPages} pages SEO
          </p>
        </div>
        <Link
          href={`/admin?directory=${directory.slug}`}
          className="rounded-lg bg-amber px-4 py-[7px] text-[13px] font-medium text-[#0F1117]"
        >
          Ouvrir l'admin de cet annuaire →
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <DirectorySettingsForm
          directory={{
            id: directory.id,
            name: directory.name,
            tagline: directory.tagline,
            description: directory.description,
            logoUrl: directory.logoUrl,
            primaryColor: directory.primaryColor,
            darkBg: directory.darkBg,
            emailFrom: directory.emailFrom,
            domains: directory.domains,
            isActive: directory.isActive,
          }}
        />

        <div className="space-y-4">
          <section className="rounded-r2 border border-border bg-card p-5">
            <h2 className="mb-3 font-syne text-[15px] font-semibold">Plans</h2>
            <ul className="space-y-2 text-[13px]">
              {directory.plans.map((p) => (
                <li key={p.id} className="flex items-center justify-between">
                  <span className="text-text">{p.name}</span>
                  <span className="text-amber">
                    {(p.priceCents / 100).toLocaleString("fr-FR")} €/mois
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-r2 border border-border bg-card p-5">
            <h2 className="mb-3 font-syne text-[15px] font-semibold">Catégories</h2>
            {directory.categories.length === 0 ? (
              <p className="text-[13px] text-text3">
                Aucune catégorie — à définir depuis l'admin de l'annuaire.
              </p>
            ) : (
              <ul className="flex flex-wrap gap-2 text-[12px]">
                {directory.categories.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-full border border-border bg-bg3 px-3 py-1 text-text2"
                  >
                    {c.label}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
