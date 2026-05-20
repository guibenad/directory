import { notFound } from "next/navigation";
import { resolveAdminDirectory } from "@/lib/scope";
import { BrandingForm } from "./BrandingForm";

export const dynamic = "force-dynamic";

export default async function ConfigBrandingPage({
  searchParams,
}: {
  searchParams?: { directory?: string };
}) {
  const scope = await resolveAdminDirectory(searchParams);
  if (!scope) notFound();
  const d = scope.directory;

  return (
    <BrandingForm
      directorySlug={searchParams?.directory}
      directory={{
        name: d.name,
        tagline: d.tagline,
        description: d.description,
        logoUrl: d.logoUrl,
        primaryColor: d.primaryColor,
        darkBg: d.darkBg,
        emailFrom: d.emailFrom,
      }}
    />
  );
}
