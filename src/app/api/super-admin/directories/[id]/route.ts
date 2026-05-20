import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth-server";

export const runtime = "nodejs";

const UpdateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  tagline: z.string().max(160).optional(),
  description: z.string().max(2000).optional(),
  logoUrl: z.string().url().optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  darkBg: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  emailFrom: z.string().email().optional(),
  domains: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = UpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const updated = await prisma.directory.update({
    where: { id: params.id },
    data: parsed.data,
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await prisma.directory.update({
    where: { id: params.id },
    data: { isActive: false },
  });
  return NextResponse.json({ ok: true });
}
