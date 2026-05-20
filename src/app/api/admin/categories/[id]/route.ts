import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveAdminDirectory } from "@/lib/scope";
import { CategoryUpdateSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const scope = await resolveAdminDirectory({
    directory: searchParams.get("directory") ?? undefined,
  });
  if (!scope) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const category = await prisma.category.findUnique({ where: { id: params.id } });
  if (!category || category.directoryId !== scope.directory.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const parsed = CategoryUpdateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const updated = await prisma.category.update({
    where: { id: params.id },
    data: parsed.data,
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const scope = await resolveAdminDirectory({
    directory: searchParams.get("directory") ?? undefined,
  });
  if (!scope) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const category = await prisma.category.findUnique({
    where: { id: params.id },
    include: { _count: { select: { listings: true } } },
  });
  if (!category || category.directoryId !== scope.directory.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (category._count.listings > 0) {
    return NextResponse.json({ error: "has_listings" }, { status: 409 });
  }
  await prisma.category.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
