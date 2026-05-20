import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

/**
 * Route de redirection après login. Aiguille vers l'espace adapté au rôle.
 */
export default async function DashboardRedirect() {
  const session = await requireSession();
  if (!session?.user) redirect("/login");

  switch (session.user.role) {
    case "SUPER_ADMIN":
      redirect("/super-admin");
    case "DIRECTORY_ADMIN":
      redirect("/admin");
    case "COMPANY":
      redirect("/mon-compte");
    default:
      redirect("/");
  }
}
