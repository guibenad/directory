"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  company: {
    name: string;
    email: string;
    phone: string | null;
    website: string | null;
  };
};

export function CompanyProfileForm({ company }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: company.name,
    phone: company.phone ?? "",
    website: company.website ?? "",
  });
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    const res = await fetch("/api/mon-compte/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        phone: form.phone || undefined,
        website: form.website || undefined,
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
      <F label="Nom" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
      <F label="Email (non modifiable)" value={company.email} onChange={() => {}} readonly />
      <F label="Téléphone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
      <F label="Site web" type="url" value={form.website} onChange={(v) => setForm({ ...form, website: v })} />

      <div className="flex items-center justify-between">
        {state === "ok" ? <span className="text-[13px] text-green">✓ Enregistré.</span> : <span />}
        {state === "error" ? <span className="text-[13px] text-red">Erreur.</span> : null}
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
  required,
  readonly,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  readonly?: boolean;
}) {
  return (
    <label className="block text-[12px] uppercase tracking-wide text-text3">
      {label}
      <input
        type={type}
        required={required}
        readOnly={readonly}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-text outline-none focus:border-amber disabled:opacity-60"
      />
    </label>
  );
}
