"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CategoryIcon } from "@/components/public/ui/CategoryIcon";

type Category = {
  id: string;
  slug: string;
  label: string;
  icon: string | null;
  color: string | null;
};
type Plan = { id: string; name: string; key: string; priceCents: number };

type Status = "TRIAL" | "ACTIVE" | "SUSPENDED" | "CANCELLED";

export function NewListingForm({
  directorySlug,
  categories,
  plans,
}: {
  directorySlug?: string;
  categories: Category[];
  plans: Plan[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    categoryId: categories[0]?.id ?? "",
    planId: plans.find((p) => p.key === "ESSENTIEL")?.id ?? plans[0]?.id ?? "",
    companyName: "",
    companyEmail: "",
    companyPhone: "",
    companyWebsite: "",
    ville: "",
    villeLabel: "",
    description: "",
    address: "",
    status: "ACTIVE" as Status,
    isPublished: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const qs = directorySlug ? `?directory=${directorySlug}` : "";
    const res = await fetch(`/api/admin/listings${qs}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId: form.categoryId,
        planId: form.planId,
        companyName: form.companyName,
        companyEmail: form.companyEmail,
        companyPhone: form.companyPhone || undefined,
        companyWebsite: form.companyWebsite || undefined,
        ville: form.ville,
        villeLabel: form.villeLabel || form.ville,
        description: form.description || undefined,
        address: form.address || undefined,
        status: form.status,
        isPublished: form.isPublished,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Création impossible.");
      return;
    }
    router.push(`/admin/fiches${qs}`);
    router.refresh();
  }

  const selectedCategory = categories.find((c) => c.id === form.categoryId);

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-6">
      <Section title="Client">
        <div className="grid grid-cols-2 gap-3">
          <F
            label="Nom de l'entreprise"
            value={form.companyName}
            onChange={(v) => setForm({ ...form, companyName: v })}
            required
            wide
          />
          <F
            label="Email"
            type="email"
            value={form.companyEmail}
            onChange={(v) => setForm({ ...form, companyEmail: v })}
            required
          />
          <F
            label="Téléphone"
            value={form.companyPhone}
            onChange={(v) => setForm({ ...form, companyPhone: v })}
          />
          <F
            label="Site web"
            type="url"
            value={form.companyWebsite}
            onChange={(v) => setForm({ ...form, companyWebsite: v })}
            wide
          />
        </div>
        <p className="mt-2 text-[11.5px] text-text3">
          Si l'email existe déjà, la fiche sera rattachée au client existant.
        </p>
      </Section>

      <Section title="Catégorie et ville">
        <div className="grid grid-cols-[1fr_1fr] gap-3">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.15em] text-text3">
              Catégorie
            </span>
            <div className="flex items-center gap-3 rounded-lg border border-border bg-bg3 p-2">
              {selectedCategory ? (
                <CategoryIcon
                  slug={selectedCategory.slug}
                  label={selectedCategory.label}
                  icon={selectedCategory.icon}
                  color={selectedCategory.color}
                  size={40}
                />
              ) : null}
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="flex-1 border-none bg-transparent text-[14px] text-text outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <F label="Ville" value={form.ville} onChange={(v) => setForm({ ...form, ville: v })} required />
        </div>

        <F
          label="Adresse complète"
          value={form.address}
          onChange={(v) => setForm({ ...form, address: v })}
        />

        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.15em] text-text3">
            Description
          </span>
          <textarea
            rows={5}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-text outline-none focus:border-amber"
          />
        </label>
      </Section>

      <Section title="Abonnement">
        <div className="grid grid-cols-[1fr_1fr] gap-3">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.15em] text-text3">
              Plan
            </span>
            <select
              value={form.planId}
              onChange={(e) => setForm({ ...form, planId: e.target.value })}
              className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-text outline-none focus:border-amber"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {(p.priceCents / 100).toLocaleString("fr-FR")}€/mois
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.15em] text-text3">
              Statut
            </span>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
              className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-text outline-none focus:border-amber"
            >
              <option value="TRIAL">Essai</option>
              <option value="ACTIVE">Actif</option>
              <option value="SUSPENDED">Suspendu</option>
              <option value="CANCELLED">Annulé</option>
            </select>
          </label>
        </div>

        <label className="mt-2 flex items-center gap-2 text-[13px] text-text2">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
          />
          Publier la fiche dès maintenant
        </label>

        <p className="mt-2 text-[11.5px] text-text3">
          Aucun paiement Stripe n'est déclenché — le client ne recevra pas de demande de carte.
        </p>
      </Section>

      {error ? <p className="text-[13px] text-red">{error}</p> : null}

      <div className="flex justify-end border-t border-border pt-4">
        <button
          type="submit"
          disabled={
            loading ||
            !form.companyName ||
            !form.companyEmail ||
            !form.categoryId ||
            !form.planId ||
            !form.ville
          }
          className="rounded-lg bg-amber px-6 py-2 text-[13px] font-medium text-[#0F1117] disabled:opacity-60"
        >
          {loading ? "Création..." : "Créer la fiche"}
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-r2 border border-border bg-card p-5">
      <h2 className="mb-4 font-syne text-[14px] font-semibold">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function F({
  label,
  value,
  onChange,
  type = "text",
  required,
  wide,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  wide?: boolean;
}) {
  return (
    <label className={`block ${wide ? "col-span-2" : ""}`}>
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.15em] text-text3">
        {label}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-text outline-none focus:border-amber"
      />
    </label>
  );
}
