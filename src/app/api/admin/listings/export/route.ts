import { prisma } from "@/lib/prisma";
import { resolveAdminDirectory } from "@/lib/scope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const scope = await resolveAdminDirectory({
    directory: searchParams.get("directory") ?? undefined,
  });
  if (!scope) return new Response("unauthorized", { status: 401 });

  const listings = await prisma.listing.findMany({
    where: { directoryId: scope.directory.id },
    include: { company: true, category: true },
  });

  const headers = [
    "listingId",
    "slug",
    "companyName",
    "companyEmail",
    "companyPhone",
    "category",
    "ville",
    "isPublished",
    "priority",
    "rating",
    "reviewCount",
    "createdAt",
  ];

  const rows = listings.map((l) =>
    [
      l.id,
      l.slug,
      l.company.name,
      l.company.email,
      l.company.phone ?? "",
      l.category.label,
      l.villeLabel ?? l.ville,
      l.isPublished,
      l.priority,
      l.rating,
      l.reviewCount,
      l.createdAt.toISOString(),
    ]
      .map(escape)
      .join(","),
  );

  const csv = `${headers.join(",")}\n${rows.join("\n")}`;
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${scope.directory.slug}-listings-${Date.now()}.csv"`,
    },
  });
}
