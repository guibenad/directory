import { requireSession } from "@/lib/auth-server";
import { getCurrentDirectory } from "@/lib/tenant";
import { isSuperAdmin, canManageDirectory } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Directory } from "@prisma/client";

/**
 * Résout l'annuaire "courant" pour un admin connecté.
 *  - SUPER_ADMIN : l'annuaire défini dans le query param `?directory=<slug>` OU celui du hostname OU le premier
 *  - DIRECTORY_ADMIN : son propre annuaire (session.user.directoryId)
 *  - Autres : null
 */
export async function resolveAdminDirectory(
  searchParams?: { directory?: string },
): Promise<{ directory: Directory; canEdit: boolean } | null> {
  const session = await requireSession();
  if (!session?.user || !canManageDirectory(session.user.role)) return null;

  if (session.user.role === "DIRECTORY_ADMIN") {
    if (!session.user.directoryId) return null;
    const directory = await prisma.directory.findUnique({
      where: { id: session.user.directoryId },
    });
    if (!directory) return null;
    return { directory, canEdit: true };
  }

  // SUPER_ADMIN
  if (searchParams?.directory) {
    const directory = await prisma.directory.findUnique({
      where: { slug: searchParams.directory },
    });
    if (directory) return { directory, canEdit: true };
  }

  const fromHost = await getCurrentDirectory();
  if (fromHost) return { directory: fromHost, canEdit: true };

  const first = await prisma.directory.findFirst({ orderBy: { createdAt: "asc" } });
  return first ? { directory: first, canEdit: true } : null;
}

export { isSuperAdmin };
