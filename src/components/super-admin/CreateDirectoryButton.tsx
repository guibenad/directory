"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/admin/Modal";

type Form = {
  slug: string;
  name: string;
  emailFrom: string;
  tagline: string;
  primaryColor: string;
  domains: string;
};

const INITIAL: Form = {
  slug: "",
  name: "",
  emailFrom: "",
  tagline: "",
  primaryColor: "#F5A623",
  domains: "",
};

export function CreateDirectoryButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/super-admin/directories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: form.slug.trim(),
        name: form.name.trim(),
        emailFrom: form.emailFrom.trim(),
        tagline: form.tagline.trim() || undefined,
        primaryColor: form.primaryColor,
        domains: form.domains
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(
        data.error === "slug_taken"
          ? "Ce slug est déjà utilisé."
          : "Création impossible — vérifiez les champs.",
      );
      return;
    }
    setOpen(false);
    setForm(INITIAL);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-amber px-4 py-[7px] text-[13px] font-medium text-[#0F1117]"
      >
        + Nouvel annuaire
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Créer un nouvel annuaire"
        footer={
          <>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-border2 px-4 py-2 text-[13px] text-text2 hover:text-text"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={save}
              disabled={loading || !form.slug || !form.name || !form.emailFrom}
              className="rounded-lg bg-amber px-4 py-2 text-[13px] font-medium text-[#0F1117] disabled:opacity-60"
            >
              {loading ? "Création..." : "Créer"}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <F label="Slug URL" value={form.slug} onChange={(v) => setForm({ ...form, slug: v.toLowerCase() })} hint="a-z, 0-9, tirets — sert à la résolution du sous-domaine" />
          <F label="Nom public" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <F label="Email d'envoi" type="email" value={form.emailFrom} onChange={(v) => setForm({ ...form, emailFrom: v })} />
          <F
            label="Couleur d'accent"
            type="color"
            value={form.primaryColor}
            onChange={(v) => setForm({ ...form, primaryColor: v })}
          />
          <F
            label="Baseline"
            value={form.tagline}
            onChange={(v) => setForm({ ...form, tagline: v })}
            wide
          />
          <F
            label="Domaines (séparés par virgule)"
            value={form.domains}
            onChange={(v) => setForm({ ...form, domains: v })}
            wide
            hint="Ex: localpro.fr, www.localpro.fr"
          />
        </div>
        {error ? <p className="mt-3 text-[13px] text-red">{error}</p> : null}
        <p className="mt-3 text-[12px] text-text3">
          3 plans (Starter / Essentiel / Pro) sont créés automatiquement — configurables ensuite.
        </p>
      </Modal>
    </>
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
      {hint ? <span className="mt-1 block text-[11px] normal-case tracking-normal text-text3">{hint}</span> : null}
    </label>
  );
}
