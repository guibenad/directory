import { PrismaClient } from "@prisma/client";
import { syncPlanWithStripe } from "../src/lib/stripe-sync";

const prisma = new PrismaClient();

async function main() {
  const plans = await prisma.plan.findMany({
    include: { directory: { select: { name: true, slug: true } } },
    orderBy: [{ directoryId: "asc" }, { sortOrder: "asc" }],
  });

  console.log(`Sync ${plans.length} plans vers Stripe…`);
  for (const plan of plans) {
    try {
      const { stripePriceId } = await syncPlanWithStripe(plan.id);
      console.log(
        `✓ ${plan.directory.slug}/${plan.key} — ${plan.priceCents / 100}€ → ${stripePriceId}`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`✗ ${plan.directory.slug}/${plan.key} — ${message}`);
    }
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
