"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = { href: string; label: string };

const TABS: Tab[] = [
  { href: "/super-admin", label: "Vue globale" },
  { href: "/super-admin/annuaires", label: "Annuaires" },
  { href: "/super-admin/clients", label: "Clients" },
  { href: "/super-admin/abonnements", label: "Abonnements" },
  { href: "/super-admin/admins", label: "Admins" },
];

export function SuperAdminNav() {
  const pathname = usePathname();
  return (
    <nav className="sticky top-0 z-[100] flex h-[60px] items-center gap-0 border-b border-border bg-bg2 px-8">
      <Link
        href="/super-admin"
        className="mr-10 whitespace-nowrap font-syne text-[18px] font-extrabold text-amber"
      >
        <span className="rounded-md bg-amber px-2 py-[2px] text-[12px] text-[#0F1117]">SUPER</span>{" "}
        admin
      </Link>
      <div className="flex h-full flex-1 gap-0">
        {TABS.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href !== "/super-admin" && pathname.startsWith(`${tab.href}/`));
          return (
            <Link
              key={tab.href}
              href={tab.href as never}
              className={[
                "flex h-full items-center gap-2 whitespace-nowrap border-b-2 px-5 text-[13.5px] transition-all",
                isActive
                  ? "border-amber text-amber"
                  : "border-transparent text-text2 hover:bg-bg3 hover:text-text",
              ].join(" ")}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
      <form action="/api/auth/signout" method="post" className="ml-auto">
        <button
          type="submit"
          className="rounded-lg border border-border2 px-4 py-[7px] text-[13px] text-text2 hover:border-amber hover:text-amber"
        >
          Déconnexion
        </button>
      </form>
    </nav>
  );
}
