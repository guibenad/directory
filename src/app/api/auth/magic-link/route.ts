import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { issueLoginToken, LOGIN_TOKEN_TTL_MIN } from "@/lib/login-tokens";
import { sendLoginLinkEmail } from "@/lib/resend";
import { getClientIp, getLoginRateLimiter } from "@/lib/rate-limit";

export const runtime = "nodejs";

const BodySchema = z.object({
  email: z.string().email().max(200),
  callbackUrl: z.string().max(500).optional(),
});

function safeCallback(raw: string | undefined): string {
  if (!raw) return "/dashboard";
  if (!raw.startsWith("/")) return "/dashboard";
  if (raw.startsWith("//")) return "/dashboard";
  return raw;
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limiter = getLoginRateLimiter();
  const limited = await limiter.limit(`ip:${ip}`);
  if (!limited.success) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const callbackUrl = safeCallback(parsed.data.callbackUrl);

  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const emailLimited = await limiter.limit(`email:${email}`);
    if (!emailLimited.success) {
      return NextResponse.json({ ok: true });
    }

    const token = await issueLoginToken(user.id);
    const base = process.env.NEXTAUTH_URL ?? "http://localhost:3100";
    const loginUrl = `${base}/auth/verify?token=${encodeURIComponent(token)}&callbackUrl=${encodeURIComponent(callbackUrl)}`;
    await sendLoginLinkEmail({
      to: email,
      loginUrl,
      expiresMinutes: LOGIN_TOKEN_TTL_MIN,
    });
  }

  return NextResponse.json({ ok: true });
}
