"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Modal } from "@/components/admin/Modal";

type CategoryOpt = { id: string; label: string };
type PlanOpt = { id: string; name: string; priceCents: number; key: string };

type DirectoryOpt = {
  id: string;
  slug: string;
  name: string;
  primaryColor: string;
  categories: CategoryOpt[];
  plans: PlanOpt[];
};

type Status = "TRIAL" | "ACTIVE" | "SUSPENDED";

export function AddToDirectoryButton({
  companyId,
  availableDirectories,
}: {
  companyId: string;
  availableDirectories: DirectoryOpt[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [directoryId, setDirectoryId] = useState<string>(availableDirectories[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState<string>(
    availableDirectories[0]?.categories[0]?.id ?? "",
  );
  const [planId, setPlanId] = useState<string>(
    availableDirectories[0]?.plans.find((p) => p.key === "ESSENTIEL")?.id ??
      availableDirectories[0]?.plans[0]?.id ??
      "",
  );
  const [ville, setVille] = useState("");
  const [villeLabel, setVilleLabel] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Status>("ACTIVE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDirectory = useMemo(
    () => availableDirectories.find((d) => d.id === directoryId),
    [availableDirectories, directoryId],
  );

  function pickDirectory(newId: string) {
    setDirectoryId(newId);
    const d = availableDirectories.find((x) => x.id === newId);
    setCategoryId(d?.categories[0]?.id ?? "");
    setPlanId(
      d?.plans.find((p) => p.key === "ESSENTIEL")?.id ?? d?.plans[0]?.id ?? "",
    );
  }

  async function save() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/super-admin/companies/${companyId}/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        directoryId,
        categoryId,
        planId,
        ville,
        villeLabel: villeLabel || undefined,
        description: description || undefined,
        status,
        isPublished: true,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(
        body.error === "already_subscribed"
          ? "Ce client est déjà abonné à cet annuaire."
          : body.error === "category_invalid" || body.error === "plan_invalid"
            ? "Catégorie ou plan invalide pour cet annuaire."
            : "Erreur, réessayez.",
      );
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (availableDirectories.length === 0) {
    return (
      <div className="rounded-r2 border border-dashed border-border bg-card p-4 text-center text-[12.5px] text-text3">
        Ce client est déjà présent dans tous les annuaires actifs.
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-dashed border-border2 px-4 py-[10px] text-[13px] text-text2 hover:border-amber hover:text-amber"
      >
        <span className="text-[16px]">+</span> Ajouter à un autre annuaire
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Ajouter ce client à un annuaire"
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
              disabled={loading || !directoryId || !categoryId || !planId || ville.length < 2}
              className="rounded-lg bg-amber px-4 py-2 text-[13px] font-medium text-[#0F1117] disabled:opacity-60"
            >
              {loading ? "Création..." : "Ajouter à l'annuaire"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.15em] text-text3">
              Annuaire cible
            </span>
            <select
              value={directoryId}
              onChange={(e) => pickDirectory(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-text outline-none focus:border-amber"
            >
              {availableDirectories.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>

          {selectedDirectory ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.15em] text-text3">
                  Catégorie
                </span>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-text outline-none focus:border-amber"
                >
                  {selectedDirectory.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.15em] text-text3">
                  Plan
                </span>
                <select
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-text outline-none focus:border-amber"
                >
                  {selectedDirectory.plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {(p.priceCents / 100).toLocaleString("fr-FR")} €/mois
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.15em] text-text3">
                Ville (slug)
              </span>
              <input
                placeholder="nice"
                value={ville}
                onChange={(e) => setVille(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-text outline-none focus:border-amber"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.15em] text-text3">
                Libellé ville (affiché)
              </span>
              <input
                placeholder="Nice"
                value={villeLabel}
                onChange={(e) => setVilleLabel(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-text outline-none focus:border-amber"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.15em] text-text3">
              Description (optionnel)
            </span>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-text outline-none focus:border-amber"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.15em] text-text3">
              Statut initial
            </span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
              className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-text outline-none focus:border-amber"
            >
              <option value="ACTIVE">Actif — fiche visible immédiatement</option>
              <option value="TRIAL">Essai — 14 jours gratuits</option>
              <option value="SUSPENDED">Suspendu — fiche masquée</option>
            </select>
          </label>

          {error ? <p className="text-[13px] text-red">{error}</p> : null}
          <p className="text-[11.5px] text-text3">
            Aucun paiement Stripe n'est déclenché — utile pour offrir une fiche ou importer un client existant.
          </p>
        </div>
      </Modal>
    </>
  );
}
