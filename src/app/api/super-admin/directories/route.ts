import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth-server";

export const runtime = "nodejs";

const CreateSchema = z.object({
  slug: z.string().min(2).max(40).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(80),
  emailFrom: z.string().email(),
  tagline: z.string().max(160).optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  domains: z.array(z.string()).optional(),
});

const DEFAULT_PLANS = [
  { key: "STARTER", name: "Starter", priceCents: 900, priority: 1, sortOrder: 1, features: ["Fiche basique", "Messagerie"] },
  { key: "ESSENTIEL", name: "Essentiel", priceCents: 2900, priority: 2, sortOrder: 2, features: ["Photos", "Téléphone", "Stats"] },
  { key: "PRO", name: "Pro", priceCents: 4900, priority: 3, sortOrder: 3, features: ["Priorité", "Photos illimitées", "Support"] },
];

export async function GET() {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const directories = await prisma.directory.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { listings: true, subscriptions: true, seoPages: true } } },
  });
  return NextResponse.json({ items: directories });
}

export async function POST(req: Request) {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = CreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body", details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.directory.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return NextResponse.json({ error: "slug_taken" }, { status: 409 });

  const directory = await prisma.directory.create({
    data: {
      slug: parsed.data.slug,
      name: parsed.data.name,
      emailFrom: parsed.data.emailFrom,
      tagline: parsed.data.tagline,
      primaryColor: parsed.data.primaryColor ?? "#F5A623",
      domains: parsed.data.domains ?? [],
      plans: { create: DEFAULT_PLANS },
    },
  });

  return NextResponse.json(directory, { status: 201 });
}
