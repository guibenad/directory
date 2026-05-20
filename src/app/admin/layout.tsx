import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveAdminDirectory } from "@/lib/scope";
import { requireSession } from "@/lib/auth-server";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({
  children,
  searchParams,
}: {
  children: React.ReactNode;
  searchParams?: { directory?: string };
}) {
  const session = await requireSession();
  if (!session?.user) redirect("/login?callbackUrl=/admin");

  const scope = await resolveAdminDirectory(searchParams);
  if (!scope) redirect("/super-admin");

  const isSuper = session.user.role === "SUPER_ADMIN";
  const available = isSuper
    ? await prisma.directory.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true, primaryColor: true },
      })
    : [];

  return (
    <div className="min-h-screen bg-bg">
      <AdminNav
        directory={{
          id: scope.directory.id,
          name: scope.directory.name,
          slug: scope.directory.slug,
          primaryColor: scope.directory.primaryColor,
        }}
        isSuperAdmin={isSuper}
        availableDirectories={available}
      />
      <main className="mx-auto max-w-[1300px] p-8">{children}</main>
    </div>
  );
}
