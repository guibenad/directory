import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveAdminDirectory } from "@/lib/scope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const scope = await resolveAdminDirectory({
    directory: searchParams.get("directory") ?? undefined,
  });
  if (!scope) return NextResponse.json({ count: 0 }, { status: 401 });

  const count = await prisma.message.count({
    where: { directoryId: scope.directory.id, isRead: false },
  });
  return NextResponse.json({ count });
}
