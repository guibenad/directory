import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth-server";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  if (!session?.user) redirect("/login?callbackUrl=/mon-compte");
  if (session.user.role === "SUPER_ADMIN") redirect("/super-admin");
  if (session.user.role === "DIRECTORY_ADMIN") redirect("/admin");
  if (!session.user.companyId) redirect("/");

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-50 flex h-[60px] items-center gap-6 border-b border-border bg-bg2 px-8">
        <Link href="/mon-compte" className="mr-6 font-syne text-[18px] font-extrabold text-amber">
          Espace entreprise
        </Link>
        <nav className="flex h-full flex-1 gap-4 text-[13.5px]">
          <NavLink href="/mon-compte">Mes abonnements</NavLink>
          <NavLink href="/mon-compte/messages">Messages</NavLink>
          <NavLink href="/mon-compte/profil">Profil</NavLink>
        </nav>
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className="rounded-lg border border-border2 px-4 py-[7px] text-[13px] text-text2 hover:border-amber hover:text-amber"
          >
            Déconnexion
          </button>
        </form>
      </header>
      <main className="mx-auto max-w-[1100px] p-8">{children}</main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href as never}
      className="flex items-center border-b-2 border-transparent px-2 text-text2 hover:text-text"
    >
      {children}
    </Link>
  );
}
