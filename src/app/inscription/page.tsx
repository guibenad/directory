import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentDirectory } from "@/lib/tenant";
import { InscriptionWizard } from "./InscriptionWizard";

export const dynamic = "force-dynamic";

export default async function InscriptionPage() {
  const directory = await getCurrentDirectory();
  if (!directory) notFound();

  const [plans, categories] = await Promise.all([
    prisma.plan.findMany({ where: { directoryId: directory.id }, orderBy: { sortOrder: "asc" } }),
    prisma.category.findMany({ where: { directoryId: directory.id }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div
      className="theme-public min-h-screen"
      style={{ ["--brand" as never]: directory.primaryColor }}
    >
      <header className="sticky top-0 z-50 border-b border-[color:var(--mist)] bg-white/75 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
          <Link
            href="/"
            className="font-syne text-[19px] font-extrabold tracking-[-0.02em] text-[color:var(--ink)]"
          >
            {directory.name}
          </Link>
          <span className="text-[12.5px] text-[color:var(--mute)]">
            14 jours gratuits · sans engagement · annulable en 1 clic
          </span>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="hero-mesh-light noise absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-[900px] px-6 pb-16 pt-10">
          <InscriptionWizard
            directory={{
              slug: directory.slug,
              name: directory.name,
              primaryColor: directory.primaryColor,
            }}
            plans={plans.map((p) => ({
              id: p.id,
              key: p.key,
              name: p.name,
              priceCents: p.priceCents,
              features: p.features,
              sortOrder: p.sortOrder,
            }))}
            categories={categories.map((c) => ({ slug: c.slug, label: c.label }))}
          />
        </div>
      </section>
    </div>
  );
}
