import { notFound } from "next/navigation";
import { resolveAdminDirectory } from "@/lib/scope";
import { ConfigSubnav } from "./ConfigSubnav";

export default async function ConfigLayout({ children }: { children: React.ReactNode }) {
  const scope = await resolveAdminDirectory();
  if (!scope) notFound();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-syne text-[22px] font-bold">Configuration</h1>
        <p className="mt-1 text-[13.5px] text-text3">
          Personnalisez {scope.directory.name} : branding, catégories, plans
        </p>
      </div>
      <ConfigSubnav directorySlug={scope.directory.slug} />
      <div className="mt-6">{children}</div>
    </div>
  );
}
