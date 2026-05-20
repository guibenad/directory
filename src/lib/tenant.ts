import { cache } from "react";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { Directory } from "@prisma/client";

export { resolveDirectorySlugFromHost } from "@/lib/tenant-edge";

/**
 * Résout l'annuaire courant (server-side uniquement).
 *  1. header `x-directory-slug` (injecté par le middleware)
 *  2. host présent dans `Directory.domains` OU sous-domaine = slug
 *  3. fallback sur le premier annuaire actif
 */
export const getCurrentDirectory = cache(async (): Promise<Directory | null> => {
  const h = headers();
  const slugHeader = h.get("x-directory-slug");
  if (slugHeader) {
    const d = await prisma.directory.findUnique({ where: { slug: slugHeader } });
    if (d?.isActive) return d;
  }

  const host = h.get("host")?.split(":")[0]?.toLowerCase();
  if (host) {
    const d = await prisma.directory.findFirst({
      where: {
        isActive: true,
        OR: [{ domains: { has: host } }, { slug: host.split(".")[0] }],
      },
    });
    if (d) return d;
  }

  return prisma.directory.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });
});

export async function requireDirectory(): Promise<Directory> {
  const d = await getCurrentDirectory();
  if (!d) throw new Error("Aucun annuaire actif n'a été trouvé.");
  return d;
}
