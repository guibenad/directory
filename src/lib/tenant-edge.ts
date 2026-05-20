/**
 * Edge-compatible helper — utilisable depuis le middleware.
 * Pas d'accès Prisma ni React ici, uniquement du parsing pur.
 */
export function resolveDirectorySlugFromHost(host: string): string | null {
  const clean = host.split(":")[0]?.toLowerCase() ?? "";
  if (!clean) return null;

  const mapping = process.env.DIRECTORY_DOMAIN_MAP;
  if (mapping) {
    for (const pair of mapping.split(",")) {
      const [domain, slug] = pair.split("=");
      if (domain && slug && domain.trim() === clean) return slug.trim();
    }
  }

  const parts = clean.split(".");
  if (parts.length >= 2 && parts[0] && parts[0] !== "www") {
    return parts[0];
  }

  return process.env.DEFAULT_DIRECTORY_SLUG ?? null;
}
