import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveAdminDirectory } from "@/lib/scope";
import { PlanUpdateSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const scope = await resolveAdminDirectory({
    directory: searchParams.get("directory") ?? undefined,
  });
  if (!scope) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const plan = await prisma.plan.findUnique({ where: { id: params.id } });
  if (!plan || plan.directoryId !== scope.directory.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const parsed = PlanUpdateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const updated = await prisma.plan.update({
    where: { id: params.id },
    data: parsed.data,
  });
  return NextResponse.json(updated);
}
