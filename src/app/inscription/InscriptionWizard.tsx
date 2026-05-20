"use client";

import { useMemo, useState } from "react";
import { StripePaymentForm } from "@/components/public/StripePaymentForm";

type Plan = {
  id: string;
  key: string;
  name: string;
  priceCents: number;
  features: string[];
  sortOrder: number;
};

type Category = { slug: string; label: string };

type DirectoryLite = { slug: string; name: string; primaryColor: string };

type FormData = {
  name: string;
  email: string;
  phone: string;
  categorySlug: string;
  ville: string;
};

type Intent = {
  mode: "setup" | "payment" | "none";
  clientSecret: string | null;
  subscriptionId: string;
};

export function InscriptionWizard({
  directory,
  plans,
  categories,
}: {
  directory: DirectoryLite;
  plans: Plan[];
  categories: Category[];
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const featured = plans.find((p) => p.key === "ESSENTIEL") ?? plans[1] ?? plans[0];
  const [planKey, setPlanKey] = useState<string>(featured?.key ?? "STARTER");
  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    categorySlug: categories[0]?.slug ?? "",
    ville: "",
  });
  const [intent, setIntent] = useState<Intent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPlan = useMemo(
    () => plans.find((p) => p.key === planKey) ?? plans[0]!,
    [plans, planKey],
  );
  const selectedCategory = categories.find((c) => c.slug === form.categorySlug);

  async function goToPayment() {
    setLoading(true);
    setError(null);
    try {
      const inscription = await fetch("/api/inscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          directorySlug: directory.slug,
          planKey,
          categorySlug: form.categorySlug,
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          ville: form.ville,
          villeLabel: form.ville,
        }),
      });
      if (!inscription.ok) {
        const data = (await inscription.json().catch(() => ({}))) as { error?: string };
        setError(
          data.error === "already_subscribed"
            ? "Vous avez déjà un abonnement actif sur cet annuaire."
            : "Impossible de créer votre compte.",
        );
        setLoading(false);
        return;
      }
      const { subscriptionId } = (await inscription.json()) as { subscriptionId: string };
      const sub = await fetch("/api/stripe/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId }),
      });
      if (!sub.ok) {
        setError("Impossible d'initialiser le paiement Stripe.");
        setLoading(false);
        return;
      }
      const data = (await sub.json()) as Intent;
      setIntent(data);
      setStep(3);
    } catch {
      setError("Erreur réseau, réessayez.");
    }
    setLoading(false);
  }

  const returnUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/inscription/succes`
      : "/inscription/succes";

  return (
    <>
      <Stepper step={step} />

      {step === 1 ? (
        <section className="reveal">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--mute)]">
            Étape 1 / 3
          </div>
          <h1 className="mb-8 font-syne text-[clamp(28px,4vw,42px)] font-extrabold leading-[1.05] tracking-[-0.02em]">
            Choisissez votre formule
          </h1>

          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((p) => {
              const selected = planKey === p.key;
              const isFeatured = p.key === featured?.key;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlanKey(p.key)}
                  className={[
                    "relative rounded-2xl border-2 bg-white p-6 text-left transition-all",
                    selected
                      ? "border-[color:var(--brand)] shadow-[var(--shadow-lift)]"
                      : "border-[color:var(--mist)] hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]",
                  ].join(" ")}
                >
                  {isFeatured ? (
                    <span
                      className="absolute left-1/2 top-[-12px] -translate-x-1/2 rounded-full px-3 py-[4px] font-syne text-[11px] font-bold text-[#1A1A1A]"
                      style={{ background: directory.primaryColor }}
                    >
                      POPULAIRE
                    </span>
                  ) : null}
                  <div
                    className={
                      "mb-1 flex h-6 w-6 items-center justify-center rounded-full transition " +
                      (selected
                        ? "bg-[color:var(--brand)] text-[#1A1A1A]"
                        : "border border-[color:var(--mist-2)]")
                    }
                  >
                    {selected ? "✓" : ""}
                  </div>
                  <div className="mt-2 font-syne text-[20px] font-bold">{p.name}</div>
                  <div
                    className="mt-1 font-syne text-[34px] font-extrabold leading-none"
                    style={{ color: directory.primaryColor }}
                  >
                    {(p.priceCents / 100).toLocaleString("fr-FR")}€
                    <span className="text-[14px] font-normal text-[color:var(--mute)]">/mois</span>
                  </div>
                  <ul className="mt-5 space-y-2 text-[13.5px] text-[color:var(--ink-2)]">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <span className="text-[color:var(--success)]">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          <div className="mt-10 flex justify-end">
            <button type="button" onClick={() => setStep(2)} className="btn-primary">
              Continuer →
            </button>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="reveal">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--mute)]">
            Étape 2 / 3
          </div>
          <h1 className="mb-8 font-syne text-[clamp(28px,4vw,42px)] font-extrabold leading-[1.05] tracking-[-0.02em]">
            Votre entreprise
          </h1>

          <div className="grid gap-4 rounded-2xl border border-[color:var(--mist)] bg-white p-6 shadow-[var(--shadow-soft)] md:grid-cols-2">
            <F label="Nom de l'entreprise" value={form.name} onChange={(v) => setForm({ ...form, name: v })} wide />
            <F label="Email pro" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <F label="Téléphone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />

            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[color:var(--mute)]">
                Catégorie
              </span>
              <select
                value={form.categorySlug}
                onChange={(e) => setForm({ ...form, categorySlug: e.target.value })}
                className="w-full rounded-xl border border-[color:var(--mist)] bg-white px-3 py-2.5 text-[14px] text-[color:var(--ink)] outline-none focus:border-[color:var(--accent)]"
              >
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <F label="Ville" value={form.ville} onChange={(v) => setForm({ ...form, ville: v })} wide />
          </div>

          {error ? <p className="mt-3 text-[13px] text-[#B00020]">{error}</p> : null}

          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-[13.5px] text-[color:var(--mute)] hover-underline"
            >
              ← Retour
            </button>
            <button
              type="button"
              onClick={goToPayment}
              disabled={
                loading ||
                form.name.length < 2 ||
                !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email) ||
                !form.categorySlug ||
                form.ville.length < 2
              }
              className="btn-primary disabled:opacity-60"
            >
              {loading ? "Préparation du paiement…" : "Continuer vers le paiement →"}
            </button>
          </div>
        </section>
      ) : null}

      {step === 3 && intent ? (
        <section className="reveal grid gap-6 md:grid-cols-[1fr_320px]">
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--mute)]">
              Étape 3 / 3
            </div>
            <h1 className="mb-2 font-syne text-[clamp(28px,4vw,42px)] font-extrabold leading-[1.05] tracking-[-0.02em]">
              Paiement sécurisé
            </h1>
            <p className="mb-6 text-[14.5px] text-[color:var(--mute)]">
              Aucun prélèvement pendant les 14 jours d'essai. Vos coordonnées bancaires sont
              traitées directement par Stripe.
            </p>

            <div className="rounded-2xl border border-[color:var(--mist)] bg-white p-6 shadow-[var(--shadow-soft)]">
              {intent.clientSecret ? (
                <StripePaymentForm
                  clientSecret={intent.clientSecret}
                  mode={intent.mode === "payment" ? "payment" : "setup"}
                  returnUrl={returnUrl}
                />
              ) : (
                <p className="text-[13px] text-[color:var(--mute)]">
                  Stripe n'a pas renvoyé de client secret — contactez le support.
                </p>
              )}
            </div>
          </div>

          <aside className="h-fit space-y-3 rounded-2xl border border-[color:var(--mist)] bg-white p-6 shadow-[var(--shadow-soft)]">
            <h2 className="font-syne text-[16px] font-bold">Récapitulatif</h2>
            <Row label="Annuaire">{directory.name}</Row>
            <Row label="Plan">
              {selectedPlan.name} — {(selectedPlan.priceCents / 100).toLocaleString("fr-FR")}€/mois
            </Row>
            <Row label="Entreprise">{form.name}</Row>
            <Row label="Catégorie · Ville">
              {selectedCategory?.label} · {form.ville}
            </Row>
            <Row label="Essai">14 jours gratuits</Row>
          </aside>
        </section>
      ) : null}
    </>
  );
}

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const labels = ["Formule", "Entreprise", "Paiement"];
  return (
    <ol className="mb-10 flex items-center gap-3 text-[13px]">
      {labels.map((l, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const isActive = n === step;
        const isDone = n < step;
        return (
          <li key={l} className="flex items-center gap-3">
            <span
              className={[
                "flex h-7 w-7 items-center justify-center rounded-full font-syne text-[12px] font-bold transition",
                isActive
                  ? "bg-[color:var(--accent)] text-[#1A1A1A] shadow-[0_6px_16px_rgba(245,166,35,0.35)]"
                  : isDone
                    ? "bg-[color:var(--ink)] text-white"
                    : "bg-[color:var(--cream-2)] text-[color:var(--mute)]",
              ].join(" ")}
            >
              {isDone ? "✓" : n}
            </span>
            <span
              className={
                isActive
                  ? "font-semibold text-[color:var(--ink)]"
                  : "text-[color:var(--mute)]"
              }
            >
              {l}
            </span>
            {n < 3 ? <span className="text-[color:var(--mist-2)]">———</span> : null}
          </li>
        );
      })}
    </ol>
  );
}

function F({
  label,
  value,
  onChange,
  type = "text",
  wide,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  wide?: boolean;
}) {
  return (
    <label className={`block ${wide ? "md:col-span-2" : ""}`}>
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[color:var(--mute)]">
        {label}
      </span>
      <input
        required
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-[color:var(--mist)] bg-white px-3 py-2.5 text-[14px] text-[color:var(--ink)] outline-none transition focus:border-[color:var(--accent)]"
      />
    </label>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-dashed border-[color:var(--mist)] pb-2 text-[13px] last:border-0 last:pb-0">
      <span className="text-[color:var(--mute)]">{label}</span>
      <span className="text-right font-medium text-[color:var(--ink)]">{children}</span>
    </div>
  );
}
