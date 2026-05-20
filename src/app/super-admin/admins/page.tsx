import { prisma } from "@/lib/prisma";
import { AdminsTable } from "./AdminsTable";
import { CreateAdminButton } from "./CreateAdminButton";

export const dynamic = "force-dynamic";

export default async function AdminsPage() {
  const [admins, directories] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: ["SUPER_ADMIN", "DIRECTORY_ADMIN"] } },
      orderBy: { createdAt: "asc" },
      include: { directory: { select: { name: true, slug: true } } },
    }),
    prisma.directory.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-syne text-[22px] font-bold">Administrateurs</h1>
          <p className="mt-1 text-[13.5px] text-text3">
            {admins.length} comptes admin · super-admin (global) ou directory-admin (1 annuaire)
          </p>
        </div>
        <CreateAdminButton directories={directories} />
      </div>

      <AdminsTable
        admins={admins.map((a) => ({
          id: a.id,
          email: a.email,
          name: a.name,
          role: a.role,
          directoryName: a.directory?.name ?? null,
          createdAt: a.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
