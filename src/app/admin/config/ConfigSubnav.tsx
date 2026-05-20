"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/config", label: "Branding" },
  { href: "/admin/config/categories", label: "Catégories" },
  { href: "/admin/config/plans", label: "Plans" },
];

export function ConfigSubnav({ directorySlug }: { directorySlug?: string }) {
  const pathname = usePathname();
  const qs = directorySlug ? `?directory=${directorySlug}` : "";
  return (
    <nav className="flex gap-2 border-b border-border">
      {TABS.map((t) => {
        const isActive = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={`${t.href}${qs}` as never}
            className={[
              "relative px-4 py-3 text-[13.5px] transition-colors",
              isActive ? "text-amber" : "text-text2 hover:text-text",
            ].join(" ")}
          >
            {t.label}
            {isActive ? (
              <span className="absolute inset-x-0 -bottom-px h-[2px] bg-amber" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
