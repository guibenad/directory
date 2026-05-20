"use client";

import { useState } from "react";

export function PhotoCarousel({ photos, alt }: { photos: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  if (photos.length === 0) return null;
  const go = (d: number) => setActive((i) => (i + d + photos.length) % photos.length);

  return (
    <div>
      <div className="group relative overflow-hidden rounded-2xl border border-[color:var(--mist)] bg-white shadow-[var(--shadow-soft)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[active]!}
          alt={`${alt} — photo ${active + 1}`}
          loading="lazy"
          className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
        {photos.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Photo précédente"
              className="glass absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-[color:var(--ink)] opacity-0 transition group-hover:opacity-100"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Photo suivante"
              className="glass absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-[color:var(--ink)] opacity-0 transition group-hover:opacity-100"
            >
              ›
            </button>
            <span className="absolute bottom-4 right-4 rounded-full bg-black/65 px-3 py-1 text-[11px] font-medium text-white">
              {active + 1} / {photos.length}
            </span>
          </>
        ) : null}
      </div>

      {photos.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {photos.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Photo ${i + 1}`}
              className={[
                "h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition",
                i === active ? "border-[color:var(--accent)]" : "border-transparent opacity-70 hover:opacity-100",
              ].join(" ")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
