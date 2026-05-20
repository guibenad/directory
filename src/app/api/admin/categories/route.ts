import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveAdminDirectory } from "@/lib/scope";
import { CategoryCreateSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const scope = await resolveAdminDirectory({
    directory: searchParams.get("directory") ?? undefined,
  });
  if (!scope) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const items = await prisma.category.findMany({
    where: { directoryId: scope.directory.id },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    include: { _count: { select: { listings: true, seoPages: true } } },
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const scope = await resolveAdminDirectory({
    directory: searchParams.get("directory") ?? undefined,
  });
  if (!scope) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = CategoryCreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body", details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.category.findUnique({
    where: { directoryId_slug: { directoryId: scope.directory.id, slug: parsed.data.slug } },
  });
  if (existing) return NextResponse.json({ error: "slug_taken" }, { status: 409 });

  const category = await prisma.category.create({
    data: {
      directoryId: scope.directory.id,
      slug: parsed.data.slug,
      label: parsed.data.label,
      icon: parsed.data.icon ?? null,
      color: parsed.data.color ?? null,
      sortOrder: parsed.data.sortOrder ?? 0,
    },
  });

  // Auto-génère les pages SEO catégorie × toutes les villes du référentiel
  const directoryName = scope.directory.name;
  const villes = await prisma.geoVille.findMany({
    include: { departement: { include: { region: true } } },
  });

  let seoPagesCreated = 0;
  const CHUNK = 500;
  for (let i = 0; i < villes.length; i += CHUNK) {
    const slice = villes.slice(i, i + CHUNK);
    const res = await prisma.seoPage.createMany({
      data: slice.map((v) => ({
        directoryId: scope.directory.id,
        categoryId: category.id,
        metier: category.slug,
        metierLabel: category.label,
        ville: v.slug,
        villeLabel: v.name,
        villeInsee: v.insee,
        departement: v.departementCode,
        departementLabel: v.departement.name,
        region: v.departement.regionCode,
        regionLabel: v.departement.region.name,
        slug: `${category.slug}/${v.slug}`,
        title: `${category.label} à ${v.name} — Devis gratuit · ${directoryName}`,
        description: `Trouvez les meilleurs ${category.label.toLowerCase()}s à ${v.name}. Comparez les avis, obtenez un devis gratuit.`,
        h1: `${category.label} à ${v.name} — Devis gratuit · Intervention rapide`,
        isPublished: true,
      })),
      skipDuplicates: true,
    });
    seoPagesCreated += res.count;
  }

  return NextResponse.json({ ...category, seoPagesCreated }, { status: 201 });
}
