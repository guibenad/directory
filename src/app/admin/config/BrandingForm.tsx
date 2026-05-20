"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Directory = {
  name: string;
  tagline: string | null;
  description: string | null;
  logoUrl: string | null;
  primaryColor: string;
  darkBg: string;
  emailFrom: string;
};

export function BrandingForm({
  directory,
  directorySlug,
}: {
  directory: Directory;
  directorySlug?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState({ ...directory });
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    const qs = directorySlug ? `?directory=${directorySlug}` : "";
    const res = await fetch(`/api/admin/settings${qs}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        tagline: form.tagline || null,
        description: form.description || null,
        logoUrl: form.logoUrl || null,
        primaryColor: form.primaryColor,
        darkBg: form.darkBg,
        emailFrom: form.emailFrom,
      }),
    });
    if (res.ok) {
      setState("ok");
      router.refresh();
    } else {
      setState("error");
    }
  }

  return (
    <form onSubmit={save} className="max-w-2xl space-y-4 rounded-r2 border border-border bg-card p-6">
      <h2 className="font-syne text-[15px] font-semibold">Identité de marque</h2>

      <F label="Nom public" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
      <F label="Email d'envoi" value={form.emailFrom} onChange={(v) => setForm({ ...form, emailFrom: v })} />
      <F label="Baseline" value={form.tagline ?? ""} onChange={(v) => setForm({ ...form, tagline: v })} />
      <F label="URL du logo" value={form.logoUrl ?? ""} onChange={(v) => setForm({ ...form, logoUrl: v })} />

      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.15em] text-text3">
          Description
        </span>
        <textarea
          rows={3}
          value={form.description ?? ""}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-text outline-none focus:border-amber"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-[12px] uppercase tracking-wide text-text3">
          Couleur d'accent
          <input
            type="color"
            value={form.primaryColor}
            onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
            className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-border bg-bg3"
          />
        </label>
        <label className="block text-[12px] uppercase tracking-wide text-text3">
          Fond sombre
          <input
            type="color"
            value={form.darkBg}
            onChange={(e) => setForm({ ...form, darkBg: e.target.value })}
            className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-border bg-bg3"
          />
        </label>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        {state === "ok" ? <span className="text-[13px] text-green">✓ Enregistré.</span> : <span />}
        {state === "error" ? <span className="text-[13px] text-red">Erreur d'enregistrement.</span> : null}
        <button
          type="submit"
          disabled={state === "loading"}
          className="rounded-lg bg-amber px-5 py-2 text-[13px] font-medium text-[#0F1117] disabled:opacity-60"
        >
          {state === "loading" ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}

function F({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.15em] text-text3">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-text outline-none focus:border-amber"
      />
    </label>
  );
}
