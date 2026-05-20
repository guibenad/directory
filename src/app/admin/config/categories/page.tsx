import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveAdminDirectory } from "@/lib/scope";
import { CategoryManager } from "./CategoryManager";

export const dynamic = "force-dynamic";

export default async function CategoriesConfigPage({
  searchParams,
}: {
  searchParams?: { directory?: string };
}) {
  const scope = await resolveAdminDirectory(searchParams);
  if (!scope) notFound();

  const categories = await prisma.category.findMany({
    where: { directoryId: scope.directory.id },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    include: { _count: { select: { listings: true, seoPages: true } } },
  });

  return (
    <CategoryManager
      directorySlug={searchParams?.directory}
      initial={categories.map((c) => ({
        id: c.id,
        slug: c.slug,
        label: c.label,
        icon: c.icon,
        color: c.color,
        sortOrder: c.sortOrder,
        listingsCount: c._count.listings,
        seoPagesCount: c._count.seoPages,
      }))}
    />
  );
}
