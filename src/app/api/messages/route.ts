import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { MessageCreateSchema } from "@/lib/validators";
import { getClientIp, getMessagesRateLimiter } from "@/lib/rate-limit";
import { resolveAdminDirectory } from "@/lib/scope";
import { sendNewMessageEmail } from "@/lib/resend";
import { sanitizeText } from "@/lib/sanitize";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const scope = await resolveAdminDirectory({
    directory: searchParams.get("directory") ?? undefined,
  });
  if (!scope) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const filter = searchParams.get("filter");
  const where: Prisma.MessageWhereInput = {
    directoryId: scope.directory.id,
    ...(filter === "unread" ? { isRead: false } : {}),
    ...(filter === "pending" ? { reply: null } : {}),
  };

  const messages = await prisma.message.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      listing: { select: { slug: true, company: { select: { name: true } } } },
    },
  });
  return NextResponse.json({ items: messages });
}

export async function POST(req: Request) {
  const parsed = MessageCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const ip = getClientIp(req);
  const limiter = getMessagesRateLimiter();
  const rl = await limiter.limit(`ip:${ip}`);
  if (!rl.success) {
    return NextResponse.json({ error: "rate_limited", resetAt: rl.reset }, { status: 429 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: parsed.data.listingId },
    include: {
      company: { select: { email: true, name: true } },
      directory: { select: { id: true } },
    },
  });
  if (!listing) return NextResponse.json({ error: "listing_not_found" }, { status: 404 });

  const message = await prisma.message.create({
    data: {
      listingId: listing.id,
      directoryId: listing.directoryId,
      senderName: sanitizeText(parsed.data.senderName),
      senderEmail: parsed.data.senderEmail.toLowerCase(),
      senderIp: ip,
      content: sanitizeText(parsed.data.content),
    },
  });

  sendNewMessageEmail({
    to: listing.company.email,
    companyName: listing.company.name,
    senderName: message.senderName,
    senderEmail: message.senderEmail,
    content: message.content,
  }).catch((err) => console.error("sendNewMessageEmail", err));

  return NextResponse.json(message, { status: 201 });
}
