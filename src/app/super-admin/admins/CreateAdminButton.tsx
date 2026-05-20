"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/admin/Modal";

type Directory = { id: string; name: string; slug: string };

export function CreateAdminButton({ directories }: { directories: Directory[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "DIRECTORY_ADMIN" as "SUPER_ADMIN" | "DIRECTORY_ADMIN",
    directoryId: directories[0]?.id ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/super-admin/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        directoryId: form.role === "SUPER_ADMIN" ? null : form.directoryId,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(
        data.error === "email_taken"
          ? "Cet email est déjà utilisé."
          : "Création impossible.",
      );
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-amber px-4 py-[7px] text-[13px] font-medium text-[#0F1117]"
      >
        + Nouvel admin
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Créer un administrateur"
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
              disabled={
                loading ||
                !form.name ||
                !form.email ||
                form.password.length < 8 ||
                (form.role === "DIRECTORY_ADMIN" && !form.directoryId)
              }
              className="rounded-lg bg-amber px-4 py-2 text-[13px] font-medium text-[#0F1117] disabled:opacity-60"
            >
              {loading ? "Création..." : "Créer"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block text-[12px] uppercase tracking-wide text-text3">
            Rôle
            <select
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as typeof form.role })
              }
              className="mt-1 w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-text outline-none focus:border-amber"
            >
              <option value="DIRECTORY_ADMIN">Admin d'un annuaire</option>
              <option value="SUPER_ADMIN">Super admin (tous annuaires)</option>
            </select>
          </label>

          {form.role === "DIRECTORY_ADMIN" ? (
            <label className="block text-[12px] uppercase tracking-wide text-text3">
              Annuaire
              <select
                value={form.directoryId}
                onChange={(e) => setForm({ ...form, directoryId: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-text outline-none focus:border-amber"
              >
                {directories.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <F label="Nom" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <F label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <F label="Mot de passe (8 car. min)" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
        </div>
        {error ? <p className="mt-3 text-[13px] text-red">{error}</p> : null}
      </Modal>
    </>
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
    <label className="block text-[12px] uppercase tracking-wide text-text3">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-text outline-none focus:border-amber"
      />
    </label>
  );
}
