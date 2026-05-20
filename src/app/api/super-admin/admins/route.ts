import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth-server";

export const runtime = "nodejs";

const CreateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(80),
  password: z.string().min(8).max(100),
  directoryId: z.string().cuid().nullable(),
  role: z.enum(["SUPER_ADMIN", "DIRECTORY_ADMIN"]),
});

export async function POST(req: Request) {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = CreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { email, name, password, directoryId, role } = parsed.data;

  if (role === "DIRECTORY_ADMIN" && !directoryId) {
    return NextResponse.json({ error: "directory_required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) return NextResponse.json({ error: "email_taken" }, { status: 409 });

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name,
      password: await bcrypt.hash(password, 10),
      role,
      directoryId: role === "DIRECTORY_ADMIN" ? directoryId : null,
    },
  });

  return NextResponse.json({ id: user.id, email: user.email });
}
