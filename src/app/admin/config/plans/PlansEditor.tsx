"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Plan = {
  id: string;
  key: string;
  name: string;
  priceCents: number;
  priority: number;
  stripePriceId: string | null;
  features: string[];
  trialDays: number;
  sortOrder: number;
  subscribersCount: number;
};

export function PlansEditor({
  plans,
  directorySlug,
}: {
  plans: Plan[];
  directorySlug?: string;
}) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<string, Plan>>(
    Object.fromEntries(plans.map((p) => [p.id, p])),
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [savedFor, setSavedFor] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<Record<string, string>>({});
  const qs = directorySlug ? `?directory=${directorySlug}` : "";

  function update(id: string, patch: Partial<Plan>) {
    setDrafts({ ...drafts, [id]: { ...drafts[id]!, ...patch } });
  }

  async function save(id: string) {
    setSaving(id);
    setSavedFor(null);
    const p = drafts[id]!;
    const res = await fetch(`/api/admin/plans/${id}${qs}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: p.name,
        priceCents: p.priceCents,
        priority: p.priority,
        stripePriceId: p.stripePriceId || null,
        features: p.features,
        trialDays: p.trialDays,
        sortOrder: p.sortOrder,
      }),
    });
    setSaving(null);
    if (res.ok) {
      setSavedFor(id);
      setTimeout(() => setSavedFor(null), 2000);
      router.refresh();
    }
  }

  async function syncStripe(id: string) {
    setSyncing(id);
    setSyncError((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    const res = await fetch(`/api/admin/plans/${id}/sync-stripe${qs}`, { method: "POST" });
    setSyncing(null);
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { message?: string } | null;
      setSyncError((prev) => ({ ...prev, [id]: data?.message ?? "Échec de la synchro Stripe" }));
      return;
    }
    const data = (await res.json()) as { stripePriceId: string };
    update(id, { stripePriceId: data.stripePriceId });
    setSavedFor(id);
    setTimeout(() => setSavedFor(null), 2000);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-syne text-[16px] font-semibold">Plans d'abonnement</h2>
        <p className="mt-1 text-[12.5px] text-text3">
          Éditez les tarifs, la liste des avantages et liez un prix Stripe. Les changements de
          prix n'impactent pas les abonnements existants.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((initial) => {
          const p = drafts[initial.id]!;
          return (
            <div
              key={p.id}
              className="flex flex-col gap-3 rounded-r2 border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-text3">{p.key}</div>
                  <input
                    value={p.name}
                    onChange={(e) => update(p.id, { name: e.target.value })}
                    className="mt-1 w-full border-b border-transparent bg-transparent font-syne text-[22px] font-bold text-text outline-none focus:border-amber"
                  />
                </div>
                <span className="rounded-md bg-bg3 px-[8px] py-[2px] text-[11px] text-text3">
                  {p.subscribersCount} abonné{p.subscribersCount > 1 ? "s" : ""}
                </span>
              </div>

              <div>
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.15em] text-text3">
                  Prix mensuel (€)
                </span>
                <div className="flex items-baseline gap-1">
                  <input
                    type="number"
                    min={0}
                    step="0.5"
                    value={p.priceCents / 100}
                    onChange={(e) =>
                      update(p.id, { priceCents: Math.round(Number(e.target.value) * 100) })
                    }
                    className="w-24 rounded-lg border border-border bg-bg3 px-3 py-2 font-syne text-[24px] font-bold text-amber outline-none focus:border-amber"
                  />
                  <span className="text-[14px] text-text2">€/mois</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="block text-[11px] uppercase tracking-wide text-text3">
                  Priorité
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={p.priority}
                    onChange={(e) => update(p.id, { priority: Number(e.target.value) })}
                    className="mt-1 w-full rounded-lg border border-border bg-bg3 px-2 py-1.5 text-text outline-none focus:border-amber"
                  />
                </label>
                <label className="block text-[11px] uppercase tracking-wide text-text3">
                  Jours d'essai
                  <input
                    type="number"
                    min={0}
                    max={90}
                    value={p.trialDays}
                    onChange={(e) => update(p.id, { trialDays: Number(e.target.value) })}
                    className="mt-1 w-full rounded-lg border border-border bg-bg3 px-2 py-1.5 text-text outline-none focus:border-amber"
                  />
                </label>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wide text-text3">
                    Stripe Price ID
                  </span>
                  <button
                    type="button"
                    onClick={() => syncStripe(p.id)}
                    disabled={syncing === p.id}
                    className="rounded-md border border-border px-2 py-0.5 text-[10.5px] text-text2 hover:border-amber hover:text-amber disabled:opacity-60"
                  >
                    {syncing === p.id ? "Sync…" : p.stripePriceId ? "↻ Resync" : "↻ Sync Stripe"}
                  </button>
                </div>
                <input
                  value={p.stripePriceId ?? ""}
                  onChange={(e) => update(p.id, { stripePriceId: e.target.value })}
                  placeholder="price_..."
                  className="w-full rounded-lg border border-border bg-bg3 px-2 py-1.5 font-mono text-[12px] text-text outline-none focus:border-amber"
                />
                {syncError[p.id] ? (
                  <p className="mt-1 text-[11px] text-red">{syncError[p.id]}</p>
                ) : null}
              </div>

              <div>
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.15em] text-text3">
                  Avantages
                </span>
                <div className="space-y-1">
                  {p.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={f}
                        onChange={(e) => {
                          const next = [...p.features];
                          next[i] = e.target.value;
                          update(p.id, { features: next });
                        }}
                        className="flex-1 rounded-lg border border-border bg-bg3 px-2 py-1 text-[13px] text-text outline-none focus:border-amber"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = p.features.filter((_, j) => j !== i);
                          update(p.id, { features: next });
                        }}
                        className="text-text3 hover:text-red"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => update(p.id, { features: [...p.features, ""] })}
                    className="text-[12px] text-amber hover:underline"
                  >
                    + Ajouter un avantage
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                {savedFor === p.id ? (
                  <span className="text-[12px] text-green">✓ Enregistré</span>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => save(p.id)}
                  disabled={saving === p.id}
                  className="rounded-lg bg-amber px-4 py-1.5 text-[12.5px] font-medium text-[#0F1117] disabled:opacity-60"
                >
                  {saving === p.id ? "..." : "Enregistrer"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
