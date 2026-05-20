"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

type Directory = { id: string; name: string; slug: string; primaryColor: string };

type Tab = { href: string; label: string; icon: string; key?: "messages" };

const TABS: Tab[] = [
  { href: "/admin", label: "Tableau de bord", icon: "▦" },
  { href: "/admin/fiches", label: "Fiches", icon: "◉" },
  { href: "/admin/abonnements", label: "Abonnements", icon: "◈" },
  { href: "/admin/messages", label: "Messages", icon: "✉", key: "messages" },
  { href: "/admin/seo", label: "SEO", icon: "⚙" },
  { href: "/admin/config", label: "Configuration", icon: "✦" },
];

function useUnreadCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let cancelled = false;
    async function fetchCount() {
      const res = await fetch("/api/messages/unread-count", { cache: "no-store" });
      if (cancelled || !res.ok) return;
      const data = (await res.json()) as { count: number };
      setCount(data.count);
    }
    void fetchCount();
    const supabase = getBrowserSupabase();
    if (!supabase) {
      const id = setInterval(fetchCount, 30_000);
      return () => {
        cancelled = true;
        clearInterval(id);
      };
    }
    const channel = supabase
      .channel("nav-unread")
      .on("postgres_changes", { event: "*", schema: "public", table: "Message" }, fetchCount)
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);
  return count;
}

export function AdminNav({
  directory,
  isSuperAdmin,
  availableDirectories,
}: {
  directory: Directory;
  isSuperAdmin: boolean;
  availableDirectories: Directory[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const unread = useUnreadCount();
  const qs = searchParams.get("directory");

  const hrefWithDir = (href: string) =>
    isSuperAdmin && qs ? `${href}?directory=${qs}` : href;

  return (
    <nav className="sticky top-0 z-[100] flex h-[60px] items-center gap-0 border-b border-border bg-bg2 px-8">
      <Link
        href={hrefWithDir("/admin")}
        className="mr-6 flex items-center gap-2 whitespace-nowrap font-syne text-[18px] font-extrabold"
      >
        <span
          className="rounded-md px-2 py-[2px] text-[12px] text-[#0F1117]"
          style={{ background: directory.primaryColor }}
        >
          {directory.name[0]}
        </span>
        <span className="text-text">{directory.name}</span>
      </Link>

      {isSuperAdmin && availableDirectories.length > 1 ? (
        <select
          value={directory.slug}
          onChange={(e) => {
            const slug = e.target.value;
            window.location.href = `/admin?directory=${slug}`;
          }}
          className="mr-6 rounded-lg border border-border bg-bg3 px-3 py-[6px] text-[12px] text-text2"
        >
          {availableDirectories.map((d) => (
            <option key={d.id} value={d.slug}>
              {d.name}
            </option>
          ))}
        </select>
      ) : null}

      <div className="flex h-full flex-1 gap-0">
        {TABS.map((tab) => {
          const isActive =
            pathname === tab.href || (tab.href !== "/admin" && pathname.startsWith(`${tab.href}/`));
          return (
            <Link
              key={tab.href}
              href={hrefWithDir(tab.href) as never}
              className={[
                "flex h-full items-center gap-2 whitespace-nowrap border-b-2 px-5 text-[13.5px] transition-all",
                isActive
                  ? "border-amber text-amber"
                  : "border-transparent text-text2 hover:bg-bg3 hover:text-text",
              ].join(" ")}
            >
              <span className="text-[15px]">{tab.icon}</span>
              {tab.label}
              {tab.key === "messages" && unread > 0 ? (
                <span className="ml-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-amber px-[6px] text-[11px] font-bold text-[#0F1117]">
                  {unread}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>

      <div className="ml-auto flex items-center gap-3">
        {isSuperAdmin ? (
          <Link
            href="/super-admin"
            className="rounded-lg border border-border2 px-4 py-[7px] text-[13px] text-text2 hover:border-amber hover:text-amber"
          >
            ← Super admin
          </Link>
        ) : null}
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className="rounded-lg border border-border2 px-4 py-[7px] text-[13px] text-text2 hover:border-amber hover:text-amber"
          >
            Déconnexion
          </button>
        </form>
      </div>
    </nav>
  );
}
