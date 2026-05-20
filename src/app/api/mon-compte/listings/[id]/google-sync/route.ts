import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-server";
import { syncGooglePlace, clearGooglePlace } from "@/lib/google-sync";

export const runtime = "nodejs";

const BodySchema = z.object({ input: z.string().max(600) });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session?.user.companyId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing || listing.companyId !== session.user.companyId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const result = await syncGooglePlace({
    listingId: listing.id,
    input: parsed.data.input,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json(result);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session?.user.companyId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing || listing.companyId !== session.user.companyId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await clearGooglePlace(listing.id);
  return NextResponse.json({ ok: true });
}
