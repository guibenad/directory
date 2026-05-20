"use client";

import { useState } from "react";

type Faq = { question: string; answer: string };

export function FaqAccordion({ items }: { items: Faq[] }) {
  const [openIdx, setOpenIdx] = useState(0);
  if (items.length === 0) return null;

  return (
    <ul className="divide-y divide-[color:var(--mist)] rounded-2xl border border-[color:var(--mist)] bg-white shadow-[var(--shadow-soft)]">
      {items.map((f, i) => {
        const open = openIdx === i;
        return (
          <li key={i}>
            <button
              type="button"
              onClick={() => setOpenIdx(open ? -1 : i)}
              aria-expanded={open}
              className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left"
            >
              <span
                className={`font-syne text-[16px] font-semibold leading-tight transition-colors ${
                  open ? "text-[color:var(--ink)]" : "text-[color:var(--ink-2)]"
                }`}
              >
                {f.question}
              </span>
              <span
                aria-hidden
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-transform ${
                  open
                    ? "rotate-45 border-[color:var(--accent)] text-[color:var(--accent)]"
                    : "border-[color:var(--mist-2)] text-[color:var(--mute)]"
                }`}
              >
                +
              </span>
            </button>
            <div
              className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out ${
                open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="min-h-0">
                <p className="px-6 pb-6 text-[14.5px] leading-[1.7] text-[color:var(--ink-3)]">
                  {f.answer}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
