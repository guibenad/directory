"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DirectoryInput = {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  logoUrl: string | null;
  primaryColor: string;
  darkBg: string;
  emailFrom: string;
  domains: string[];
  isActive: boolean;
};

export function DirectorySettingsForm({ directory }: { directory: DirectoryInput }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: directory.name,
    tagline: directory.tagline ?? "",
    description: directory.description ?? "",
    logoUrl: directory.logoUrl ?? "",
    primaryColor: directory.primaryColor,
    darkBg: directory.darkBg,
    emailFrom: directory.emailFrom,
    domains: directory.domains.join(", "),
    isActive: directory.isActive,
  });
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    const res = await fetch(`/api/super-admin/directories/${directory.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        tagline: form.tagline || undefined,
        description: form.description || undefined,
        logoUrl: form.logoUrl || null,
        primaryColor: form.primaryColor,
        darkBg: form.darkBg,
        emailFrom: form.emailFrom,
        domains: form.domains
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean),
        isActive: form.isActive,
      }),
    });
    if (res.ok) {
      setState("ok");
      router.refresh();
      return;
    }
    setState("error");
  }

  return (
    <form onSubmit={save} className="space-y-4 rounded-r2 border border-border bg-card p-6">
      <h2 className="font-syne text-[15px] font-semibold">Configuration</h2>

      <div className="grid grid-cols-2 gap-3">
        <F label="Nom public" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <F label="Email d'envoi" value={form.emailFrom} onChange={(v) => setForm({ ...form, emailFrom: v })} />
        <F label="Baseline" value={form.tagline} onChange={(v) => setForm({ ...form, tagline: v })} wide />

        <label className="block text-[12px] uppercase tracking-wide text-text3">
          Couleur d'accent
          <input
            type="color"
            value={form.primaryColor}
            onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
            className="mt-1 h-10 w-full rounded-lg border border-border bg-bg3"
          />
        </label>
        <label className="block text-[12px] uppercase tracking-wide text-text3">
          Fond sombre
          <input
            type="color"
            value={form.darkBg}
            onChange={(e) => setForm({ ...form, darkBg: e.target.value })}
            className="mt-1 h-10 w-full rounded-lg border border-border bg-bg3"
          />
        </label>

        <F
          label="URL du logo"
          value={form.logoUrl}
          onChange={(v) => setForm({ ...form, logoUrl: v })}
          wide
        />
        <F
          label="Domaines (séparés par virgule)"
          value={form.domains}
          onChange={(v) => setForm({ ...form, domains: v })}
          wide
          hint="Ajoutez le domaine racine + sous-domaines Vercel. Ex: localpro.fr, www.localpro.fr"
        />

        <label className="col-span-2 block text-[12px] uppercase tracking-wide text-text3">
          Description
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-text outline-none focus:border-amber"
          />
        </label>

        <label className="col-span-2 flex items-center gap-2 text-[13px] text-text2">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          Annuaire actif (visible publiquement)
        </label>
      </div>

      <div className="flex items-center justify-between pt-2">
        {state === "ok" ? <span className="text-[13px] text-green">✓ Enregistré.</span> : <span />}
        {state === "error" ? (
          <span className="text-[13px] text-red">Enregistrement impossible.</span>
        ) : null}
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

function F({
  label,
  value,
  onChange,
  type = "text",
  hint,
  wide,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  hint?: string;
  wide?: boolean;
}) {
  return (
    <label className={`block text-[12px] uppercase tracking-wide text-text3 ${wide ? "col-span-2" : ""}`}>
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-text outline-none focus:border-amber"
      />
      {hint ? (
        <span className="mt-1 block text-[11px] normal-case tracking-normal text-text3">{hint}</span>
      ) : null}
    </label>
  );
}
