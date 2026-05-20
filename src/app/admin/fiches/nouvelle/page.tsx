import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveAdminDirectory } from "@/lib/scope";
import { NewListingForm } from "./NewListingForm";

export const dynamic = "force-dynamic";

export default async function NewListingPage({
  searchParams,
}: {
  searchParams?: { directory?: string };
}) {
  const scope = await resolveAdminDirectory(searchParams);
  if (!scope) notFound();

  const [categories, plans] = await Promise.all([
    prisma.category.findMany({
      where: { directoryId: scope.directory.id },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    }),
    prisma.plan.findMany({
      where: { directoryId: scope.directory.id },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <div>
      <Link
        href={`/admin/fiches${searchParams?.directory ? `?directory=${searchParams.directory}` : ""}` as never}
        className="mb-4 inline-flex items-center gap-1 text-[13px] text-text3 hover:text-amber"
      >
        ← Retour aux fiches
      </Link>
      <h1 className="mb-1 font-syne text-[22px] font-bold">Nouvelle fiche</h1>
      <p className="mb-6 text-[13.5px] text-text3">
        Crée manuellement une fiche pour {scope.directory.name}. Le client sera créé (ou réutilisé
        par email) et un abonnement sera associé.
      </p>

      {categories.length === 0 || plans.length === 0 ? (
        <div className="rounded-r2 border border-dashed border-border bg-card p-10 text-center text-text3">
          {categories.length === 0 ? "Ajoute d'abord une catégorie. " : ""}
          {plans.length === 0 ? "Configure au moins un plan. " : ""}
          <Link
            href={`/admin/config/categories${searchParams?.directory ? `?directory=${searchParams.directory}` : ""}` as never}
            className="text-amber hover:underline"
          >
            Aller à la configuration →
          </Link>
        </div>
      ) : (
        <NewListingForm
          directorySlug={searchParams?.directory}
          categories={categories.map((c) => ({
            id: c.id,
            slug: c.slug,
            label: c.label,
            icon: c.icon,
            color: c.color,
          }))}
          plans={plans.map((p) => ({ id: p.id, name: p.name, priceCents: p.priceCents, key: p.key }))}
        />
      )}
    </div>
  );
}
