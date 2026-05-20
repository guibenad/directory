import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ReviewCreateSchema } from "@/lib/validators";
import { getClientIp, getMessagesRateLimiter } from "@/lib/rate-limit";
import { sanitizeText } from "@/lib/sanitize";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const parsed = ReviewCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const ip = getClientIp(req);
  const limiter = getMessagesRateLimiter();
  const rl = await limiter.limit(`reviews:${ip}`);
  if (!rl.success) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const listing = await prisma.listing.findUnique({ where: { id: parsed.data.listingId } });
  if (!listing) return NextResponse.json({ error: "listing_not_found" }, { status: 404 });

  const authorName = sanitizeText(parsed.data.authorName);
  const comment = parsed.data.comment ? sanitizeText(parsed.data.comment) : undefined;

  const [review] = await prisma.$transaction([
    prisma.review.create({
      data: {
        listingId: listing.id,
        directoryId: listing.directoryId,
        authorName,
        rating: parsed.data.rating,
        comment,
      },
    }),
    prisma.listing.update({
      where: { id: listing.id },
      data: {
        reviewCount: { increment: 1 },
        rating:
          (listing.rating * listing.reviewCount + parsed.data.rating) /
          (listing.reviewCount + 1),
      },
    }),
  ]);

  return NextResponse.json(review, { status: 201 });
}
