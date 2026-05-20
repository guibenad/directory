import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-server";

export const runtime = "nodejs";

const ProfileSchema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().min(6).max(30).optional(),
  website: z.string().url().optional(),
});

export async function PATCH(req: Request) {
  const session = await requireSession();
  if (!session?.user.companyId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = ProfileSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const updated = await prisma.company.update({
    where: { id: session.user.companyId },
    data: parsed.data,
  });
  return NextResponse.json(updated);
}
