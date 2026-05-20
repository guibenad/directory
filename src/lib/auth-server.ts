import { getServerSession } from "next-auth";
import { authOptions, canManageDirectory, isSuperAdmin } from "@/lib/auth";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  return session ?? null;
}

export async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isSuperAdmin(session.user.role)) return null;
  return session;
}

/**
 * Accepte SUPER_ADMIN (accès à tous les annuaires) et DIRECTORY_ADMIN (accès au sien).
 * Retourne la session + le `directoryId` effectif (null pour super admin sans contexte).
 */
export async function requireDirectoryAdmin(contextDirectoryId?: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !canManageDirectory(session.user.role)) {
    return null;
  }
  if (session.user.role === "DIRECTORY_ADMIN") {
    if (contextDirectoryId && session.user.directoryId !== contextDirectoryId) return null;
    return { session, directoryId: session.user.directoryId };
  }
  return { session, directoryId: contextDirectoryId ?? null };
}
