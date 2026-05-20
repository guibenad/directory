import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveAdminDirectory } from "@/lib/scope";
import { DirectorySettingsSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function PATCH(req: Request) {
  const { searchParams } = new URL(req.url);
  const scope = await resolveAdminDirectory({
    directory: searchParams.get("directory") ?? undefined,
  });
  if (!scope) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = DirectorySettingsSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const updated = await prisma.directory.update({
    where: { id: scope.directory.id },
    data: parsed.data,
  });
  return NextResponse.json(updated);
}
