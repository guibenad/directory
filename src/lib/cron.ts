import { NextResponse } from "next/server";

export function verifyCron(req: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "cron_secret_missing" }, { status: 500 });
    }
    return null;
  }

  const header = req.headers.get("authorization");
  if (header === `Bearer ${secret}`) return null;

  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}
