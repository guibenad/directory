import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveAdminDirectory } from "@/lib/scope";

export const runtime = "nodejs";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const scope = await resolveAdminDirectory();
  if (!scope) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const m = await prisma.message.findUnique({ where: { id: params.id } });
  if (!m || (scope.directory.id && m.directoryId !== scope.directory.id)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const updated = await prisma.message.update({
    where: { id: params.id },
    data: { isRead: true },
  });
  return NextResponse.json(updated);
}
