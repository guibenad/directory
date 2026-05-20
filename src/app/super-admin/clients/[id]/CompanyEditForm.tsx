"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Company = {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string | null;
  website: string | null;
  stripeCustomerId: string | null;
};

export function CompanyEditForm({ company }: { company: Company }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: company.name,
    email: company.email,
    phone: company.phone ?? "",
    website: company.website ?? "",
  });
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    const res = await fetch(`/api/super-admin/companies/${company.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        website: form.website || null,
      }),
    });
    if (res.ok) {
      setState("ok");
      router.refresh();
      setTimeout(() => setState("idle"), 2000);
      return;
    }
    setState("error");
  }

  return (
    <form onSubmit={save} className="space-y-4 rounded-r2 border border-border bg-card p-5">
      <div>
        <h2 className="font-syne text-[14px] font-semibold">Profil global</h2>
        <p className="mt-1 text-[12px] text-text3">
          Ces informations sont partagées sur toutes ses fiches et annuaires.
        </p>
      </div>

      <F label="Nom" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
      <F label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
      <F label="Téléphone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
      <F label="Site web" type="url" value={form.website} onChange={(v) => setForm({ ...form, website: v })} />

      <div className="rounded-lg border border-border bg-bg3 px-3 py-2 text-[11.5px] text-text3">
        <div>Slug : <code className="text-text2">{company.slug}</code></div>
        {company.stripeCustomerId ? (
          <div className="mt-1">
            Stripe : <code className="text-text2">{company.stripeCustomerId}</code>
          </div>
        ) : (
          <div className="mt-1 text-text3">Pas de client Stripe</div>
        )}
      </div>

      <div className="flex items-center justify-between">
        {state === "ok" ? <span className="text-[13px] text-green">✓ Enregistré.</span> : <span />}
        {state === "error" ? <span className="text-[13px] text-red">Erreur.</span> : null}
        <button
          type="submit"
          disabled={state === "loading"}
          className="rounded-lg bg-amber px-4 py-2 text-[12.5px] font-medium text-[#0F1117] disabled:opacity-60"
        >
          {state === "loading" ? "..." : "Enregistrer"}
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.15em] text-text3">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-text outline-none focus:border-amber"
      />
    </label>
  );
}
