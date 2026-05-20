"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Directory } from "@prisma/client";

export function PublicHeader({ directory }: { directory: Directory }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={[
        "sticky top-0 z-50 transition-all duration-300",
        scrolled ? "bg-white/75 backdrop-blur-md shadow-[0_1px_0_rgba(0,0,0,0.04)]" : "bg-transparent",
      ].join(" ")}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
        <Link href="/" className="group flex items-center gap-2">
          {directory.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={directory.logoUrl} alt={directory.name} className="h-7" />
          ) : (
            <span className="font-syne text-[19px] font-extrabold tracking-[-0.02em] text-[color:var(--ink)]">
              {directory.name.split(/(pro|PRO)/i)[0] || directory.name}
              <span style={{ color: directory.primaryColor }}>
                {directory.name.split(/(pro|PRO)/i)[1] ?? ""}
              </span>
            </span>
          )}
        </Link>

        <nav className="hidden items-center gap-8 text-[14px] text-[color:var(--ink-2)] md:flex">
          <Link href="/#categories" className="hover-underline">
            Catégories
          </Link>
          <Link href="/regions" className="hover-underline">
            Régions
          </Link>
          <Link href="/inscription" className="hover-underline">
            Inscrire mon entreprise
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-full px-3 py-[7px] text-[13.5px] text-[color:var(--ink-2)] hover:bg-[color:var(--cream-2)] sm:inline-flex"
          >
            Connexion
          </Link>
          <Link href="/inscription" className="btn-primary text-[13.5px] !px-5 !py-[10px]">
            Rejoindre
          </Link>
        </div>
      </div>
    </header>
  );
}
