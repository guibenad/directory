import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMonthlyRecapEmail } from "@/lib/resend";
import { verifyCron } from "@/lib/cron";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function previousMonthRange(): { start: Date; end: Date; label: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 1);
  const label = start.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return { start, end, label };
}

export async function GET(req: Request) {
  const unauthorized = verifyCron(req);
  if (unauthorized) return unauthorized;

  const { start, end, label } = previousMonthRange();

  const companies = await prisma.company.findMany({
    where: { subscriptions: { some: { status: "ACTIVE" } } },
    select: { id: true, name: true, email: true },
  });

  let sent = 0;
  for (const c of companies) {
    const messages = await prisma.message.count({
      where: {
        listing: { companyId: c.id },
        createdAt: { gte: start, lt: end },
      },
    });
    const viewsEstimate = messages * 10;
    try {
      await sendMonthlyRecapEmail({
        to: c.email,
        companyName: c.name,
        monthLabel: label,
        messages,
        viewsEstimate,
      });
      sent += 1;
    } catch (err) {
      console.error("monthly-recap", c.id, err);
    }
  }
  return NextResponse.json({ scanned: companies.length, sent, period: label });
}
