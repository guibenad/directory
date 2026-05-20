import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth-server";
import { SuperAdminNav } from "@/components/super-admin/SuperAdminNav";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSuperAdmin();
  if (!session) redirect("/login?callbackUrl=/super-admin");

  return (
    <div className="min-h-screen bg-bg">
      <SuperAdminNav />
      <main className="mx-auto max-w-[1400px] p-8">{children}</main>
    </div>
  );
}
