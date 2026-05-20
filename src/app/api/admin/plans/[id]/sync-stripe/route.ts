import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveAdminDirectory } from "@/lib/scope";
import { syncPlanWithStripe } from "@/lib/stripe-sync";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const scope = await resolveAdminDirectory({
    directory: searchParams.get("directory") ?? undefined,
  });
  if (!scope) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const plan = await prisma.plan.findUnique({ where: { id: params.id } });
  if (!plan || plan.directoryId !== scope.directory.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  try {
    const result = await syncPlanWithStripe(plan.id);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return NextResponse.json({ error: "stripe_sync_failed", message }, { status: 502 });
  }
}
