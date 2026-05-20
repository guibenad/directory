import type { MetadataRoute } from "next";
import { getCurrentDirectory } from "@/lib/tenant";
import { siteUrl } from "@/lib/seo";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const directory = await getCurrentDirectory();
  const base = siteUrl(directory);
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/super-admin/", "/mon-compte/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
