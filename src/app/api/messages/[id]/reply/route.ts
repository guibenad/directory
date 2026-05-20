import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-server";
import { canManageDirectory } from "@/lib/auth";
import { MessageReplySchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = MessageReplySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const message = await prisma.message.findUnique({
    where: { id: params.id },
    include: { listing: true },
  });
  if (!message) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const isSuper = session.user.role === "SUPER_ADMIN";
  const isDirectoryAdmin =
    session.user.role === "DIRECTORY_ADMIN" &&
    session.user.directoryId === message.directoryId;
  const isOwner =
    session.user.role === "COMPANY" &&
    session.user.companyId === message.listing.companyId;

  if (!isSuper && !isDirectoryAdmin && !isOwner) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // scope check for COMPANY users via canManageDirectory (for Typing helper)
  void canManageDirectory;

  const updated = await prisma.message.update({
    where: { id: message.id },
    data: {
      reply: parsed.data.reply,
      repliedAt: new Date(),
      isRead: true,
    },
  });
  return NextResponse.json(updated);
}
