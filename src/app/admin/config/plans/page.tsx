import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveAdminDirectory } from "@/lib/scope";
import { PlansEditor } from "./PlansEditor";

export const dynamic = "force-dynamic";

export default async function PlansConfigPage({
  searchParams,
}: {
  searchParams?: { directory?: string };
}) {
  const scope = await resolveAdminDirectory(searchParams);
  if (!scope) notFound();

  const plans = await prisma.plan.findMany({
    where: { directoryId: scope.directory.id },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { subscriptions: true } } },
  });

  return (
    <PlansEditor
      directorySlug={searchParams?.directory}
      plans={plans.map((p) => ({
        id: p.id,
        key: p.key,
        name: p.name,
        priceCents: p.priceCents,
        priority: p.priority,
        stripePriceId: p.stripePriceId,
        features: p.features,
        trialDays: p.trialDays,
        sortOrder: p.sortOrder,
        subscribersCount: p._count.subscriptions,
      }))}
    />
  );
}
