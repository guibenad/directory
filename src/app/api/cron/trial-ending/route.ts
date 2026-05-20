import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTrialEndingEmail } from "@/lib/resend";
import { verifyCron } from "@/lib/cron";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAYS_BEFORE = 2;

export async function GET(req: Request) {
  const unauthorized = verifyCron(req);
  if (unauthorized) return unauthorized;

  const target = new Date();
  target.setDate(target.getDate() + DAYS_BEFORE);
  const startOfDay = new Date(target);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(target);
  endOfDay.setHours(23, 59, 59, 999);

  const subs = await prisma.subscription.findMany({
    where: { status: "TRIAL", subscriptionEnd: { gte: startOfDay, lte: endOfDay } },
    include: { company: true },
  });

  let sent = 0;
  for (const s of subs) {
    try {
      await sendTrialEndingEmail(s.company.email, s.company.name, DAYS_BEFORE);
      sent += 1;
    } catch (err) {
      console.error("trial-ending", s.id, err);
    }
  }
  return NextResponse.json({ scanned: subs.length, sent });
}
