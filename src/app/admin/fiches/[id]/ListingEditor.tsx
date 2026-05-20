"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CategoryIcon } from "@/components/public/ui/CategoryIcon";
import { PhotoUploader } from "@/components/public/PhotoUploader";
import { GoogleSyncField } from "@/components/admin/GoogleSyncField";

type Category = {
  id: string;
  slug: string;
  label: string;
  icon: string | null;
  color: string | null;
};

type Plan = { id: string; name: string; key: string; priceCents: number };

type Status = "TRIAL" | "ACTIVE" | "SUSPENDED" | "CANCELLED";

type Service = {
  id?: string;
  title: string;
  items: string[];
  priceLabel: string | null;
};

type Listing = {
  id: string;
  slug: string;
  categoryId: string;
  ville: string;
  villeLabel: string | null;
  description: string | null;
  address: string | null;
  photos: string[];
  priority: number;
  isPublished: boolean;
  whatsapp: string | null;
  facebook: string | null;
  instagram: string | null;
  services: Service[];
  google: {
    placeId: string | null;
    rating: number | null;
    reviewCount: number | null;
    syncedAt: string | null;
    mapsUrl: string | null;
  };
  rating: number;
  reviewCount: number;
  createdAt: string;
};

type Company = {
  name: string;
  email: string;
  phone: string | null;
  website: string | null;
};

type Subscription = { planId: string; status: Status };

export function ListingEditor({
  listing,
  company,
  subscription,
  categories,
  plans,
  directorySlug,
}: {
  listing: Listing;
  company: Company;
  subscription: Subscription | null;
  categories: Category[];
  plans: Plan[];
  directorySlug?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    categoryId: listing.categoryId,
    ville: listing.ville,
    villeLabel: listing.villeLabel ?? "",
    description: listing.description ?? "",
    address: listing.address ?? "",
    photos: listing.photos,
    priority: listing.priority,
    isPublished: listing.isPublished,
    whatsapp: listing.whatsapp ?? "",
    facebook: listing.facebook ?? "",
    instagram: listing.instagram ?? "",
    services: listing.services,
    companyName: company.name,
    companyEmail: company.email,
    companyPhone: company.phone ?? "",
    companyWebsite: company.website ?? "",
    planId: subscription?.planId ?? plans[0]?.id ?? "",
    subscriptionStatus: subscription?.status ?? "ACTIVE",
  });
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const qs = directorySlug ? `?directory=${directorySlug}` : "";
  const selectedCategory = categories.find((c) => c.id === form.categoryId);

  // --- helpers services ---
  function addService() {
    setForm({
      ...form,
      services: [...form.services, { title: "", items: [""], priceLabel: null }],
    });
  }
  function updateService(idx: number, patch: Partial<Service>) {
    const next = [...form.services];
    next[idx] = { ...next[idx]!, ...patch };
    setForm({ ...form, services: next });
  }
  function removeService(idx: number) {
    setForm({ ...form, services: form.services.filter((_, i) => i !== idx) });
  }
  function moveService(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= form.services.length) return;
    const next = [...form.services];
    [next[idx], next[target]] = [next[target]!, next[idx]!];
    setForm({ ...form, services: next });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setError(null);
    const res = await fetch(`/api/admin/listings/${listing.id}${qs}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId: form.categoryId,
        ville: form.ville,
        villeLabel: form.villeLabel || undefined,
        description: form.description || null,
        address: form.address || null,
        photos: form.photos.filter((p) => p.trim().length > 0),
        priority: form.priority,
        isPublished: form.isPublished,
        whatsapp: form.whatsapp.trim() || null,
        facebook: form.facebook.trim() || null,
        instagram: form.instagram.trim() || null,
        services: form.services
          .filter((s) => s.title.trim().length > 0)
          .map((s, i) => ({
            title: s.title,
            items: s.items,
            priceLabel: s.priceLabel,
            sortOrder: i,
          })),
        companyName: form.companyName,
        companyEmail: form.companyEmail,
        companyPhone: form.companyPhone || null,
        companyWebsite: form.companyWebsite || null,
        planId: form.planId,
        subscriptionStatus: form.subscriptionStatus,
      }),
    });
    if (res.ok) {
      setState("ok");
      router.refresh();
      setTimeout(() => setState("idle"), 2000);
      return;
    }
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    setError(body.error ?? "Erreur d'enregistrement.");
    setState("error");
  }

  async function remove() {
    if (!confirm(`Supprimer définitivement la fiche "${company.name}" ?`)) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/listings/${listing.id}${qs}`, { method: "DELETE" });
    if (res.ok) {
      router.push(`/admin/fiches${qs}` as never);
      router.refresh();
    } else {
      setDeleting(false);
      alert("Suppression impossible.");
    }
  }

  return (
    <form onSubmit={save} className="grid gap-6 md:grid-cols-[2fr_1fr]">
      <div className="space-y-6">
        <Section title="Client">
          <div className="grid grid-cols-2 gap-3">
            <F label="Nom" value={form.companyName} onChange={(v) => setForm({ ...form, companyName: v })} wide />
            <F label="Email" value={form.companyEmail} type="email" onChange={(v) => setForm({ ...form, companyEmail: v })} />
            <F label="Téléphone" value={form.companyPhone} onChange={(v) => setForm({ ...form, companyPhone: v })} />
            <F label="Site web" type="url" value={form.companyWebsite} onChange={(v) => setForm({ ...form, companyWebsite: v })} wide />
          </div>
        </Section>

        <Section title="Fiche publique">
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
            <F label="Ville (slug)" value={form.ville} onChange={(v) => setForm({ ...form, ville: v })} />
          </div>

          <F label="Libellé ville (affiché)" value={form.villeLabel} onChange={(v) => setForm({ ...form, villeLabel: v })} />
          <F label="Adresse complète" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.15em] text-text3">
              Description
            </span>
            <textarea
              rows={6}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-text outline-none focus:border-amber"
            />
          </label>
        </Section>

        <Section title="Galerie photos">
          <PhotoUploader
            photos={form.photos.filter(Boolean)}
            onChange={(photos) => setForm({ ...form, photos })}
            uploadUrl={`/api/admin/upload?listingId=${listing.id}${directorySlug ? `&directory=${directorySlug}` : ""}`}
          />
        </Section>

        <Section
          title="Services proposés"
          subtitle="Structurez l'offre avec titre, options et tarif optionnel."
        >
          {form.services.length === 0 ? (
            <p className="text-[12.5px] text-text3">
              Aucun service défini. Ajoutez-en pour structurer l'offre.
            </p>
          ) : null}

          <div className="space-y-3">
            {form.services.map((service, idx) => (
              <div key={idx} className="rounded-r2 border border-border bg-bg3 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <input
                    placeholder="Titre du service (ex : Dépannage plomberie)"
                    value={service.title}
                    onChange={(e) => updateService(idx, { title: e.target.value })}
                    className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 font-syne text-[15px] font-semibold text-text outline-none focus:border-amber"
                  />
                  <button
                    type="button"
                    onClick={() => moveService(idx, -1)}
                    disabled={idx === 0}
                    className="text-text3 hover:text-text disabled:opacity-30"
                    title="Monter"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveService(idx, 1)}
                    disabled={idx === form.services.length - 1}
                    className="text-text3 hover:text-text disabled:opacity-30"
                    title="Descendre"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeService(idx)}
                    className="text-text3 hover:text-red"
                    title="Supprimer"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-1">
                  {service.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-text3">—</span>
                      <input
                        placeholder="Option (ex : Fuite d'eau)"
                        value={item}
                        onChange={(e) => {
                          const items = [...service.items];
                          items[i] = e.target.value;
                          updateService(idx, { items });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const items = [...service.items, ""];
                            updateService(idx, { items });
                          }
                        }}
                        className="flex-1 rounded-lg border border-border bg-bg px-3 py-1.5 text-[13px] text-text outline-none focus:border-amber"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const items = service.items.filter((_, j) => j !== i);
                          updateService(idx, { items });
                        }}
                        className="text-text3 hover:text-red"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => updateService(idx, { items: [...service.items, ""] })}
                    className="ml-5 text-[12px] text-amber hover:underline"
                  >
                    + Ajouter une option
                  </button>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.15em] text-text3">
                    Tarif (optionnel)
                  </label>
                  <input
                    placeholder="Ex : à partir de 80€ · Sur devis · 80€"
                    value={service.priceLabel ?? ""}
                    onChange={(e) =>
                      updateService(idx, { priceLabel: e.target.value || null })
                    }
                    className="flex-1 rounded-lg border border-border bg-bg px-3 py-1.5 text-[13px] text-text outline-none focus:border-amber"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addService}
            className="rounded-lg border border-border2 px-4 py-2 text-[12.5px] text-text2 hover:border-amber hover:text-amber"
          >
            + Ajouter un service
          </button>
        </Section>

        <Section
          title="Réseaux sociaux"
          subtitle="Boutons affichés sur la fiche publique."
        >
          <div className="grid gap-3 md:grid-cols-3">
            <SocialField
              label="WhatsApp"
              icon="💬"
              placeholder="+33 6 12 34 56 78"
              hint="Numéro au format international"
              value={form.whatsapp}
              onChange={(v) => setForm({ ...form, whatsapp: v })}
            />
            <SocialField
              label="Facebook"
              icon="ⓕ"
              placeholder="https://facebook.com/..."
              value={form.facebook}
              onChange={(v) => setForm({ ...form, facebook: v })}
            />
            <SocialField
              label="Instagram"
              icon="ⓘ"
              placeholder="https://instagram.com/..."
              value={form.instagram}
              onChange={(v) => setForm({ ...form, instagram: v })}
            />
          </div>
        </Section>

        <Section
          title="Avis Google"
          subtitle="Affichez la note et les 5 derniers avis Google sur la fiche publique."
        >
          <GoogleSyncField
            listingId={listing.id}
            endpoint={`/api/admin/listings/${listing.id}/google-sync${qs}`}
            current={listing.google}
          />
        </Section>
      </div>

      <aside className="space-y-4">
        <Section title="État">
          <label className="flex items-center gap-2 text-[13px] text-text2">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
            />
            Fiche publiée
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.15em] text-text3">
              Priorité d'affichage
            </span>
            <input
              type="number"
              min={0}
              max={10}
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
              className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-text outline-none focus:border-amber"
            />
          </label>

          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-bg3 px-3 py-2 text-[12px] text-text2">
            <div>
              <div className="text-text3">Note</div>
              <div className="font-syne text-[16px] font-bold text-text">
                {listing.reviewCount > 0 ? listing.rating.toFixed(1) : "—"}
              </div>
            </div>
            <div>
              <div className="text-text3">Avis</div>
              <div className="font-syne text-[16px] font-bold text-text">{listing.reviewCount}</div>
            </div>
          </div>
        </Section>

        <Section title="Abonnement">
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
              value={form.subscriptionStatus}
              onChange={(e) =>
                setForm({ ...form, subscriptionStatus: e.target.value as Status })
              }
              className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-text outline-none focus:border-amber"
            >
              <option value="TRIAL">Essai</option>
              <option value="ACTIVE">Actif</option>
              <option value="SUSPENDED">Suspendu</option>
              <option value="CANCELLED">Annulé</option>
            </select>
          </label>
        </Section>

        <div className="space-y-2">
          {state === "ok" ? (
            <div className="rounded-lg bg-green-bg px-3 py-2 text-[13px] text-green">
              ✓ Enregistré.
            </div>
          ) : null}
          {error ? (
            <div className="rounded-lg bg-red-bg px-3 py-2 text-[13px] text-red">{error}</div>
          ) : null}

          <button
            type="submit"
            disabled={state === "loading"}
            className="sticky bottom-4 w-full rounded-lg bg-amber px-5 py-3 text-[13px] font-medium text-[#0F1117] shadow-lg disabled:opacity-60"
          >
            {state === "loading" ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>

          <button
            type="button"
            onClick={remove}
            disabled={deleting}
            className="w-full rounded-lg border border-red-bg px-5 py-2 text-[12.5px] text-red hover:bg-red-bg disabled:opacity-60"
          >
            {deleting ? "..." : "Supprimer la fiche"}
          </button>
        </div>
      </aside>
    </form>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-r2 border border-border bg-card p-5">
      <header className="mb-4">
        <h2 className="font-syne text-[14px] font-semibold">{title}</h2>
        {subtitle ? <p className="mt-1 text-[12.5px] text-text3">{subtitle}</p> : null}
      </header>
      <div className="space-y-3">{children}</div>
    </section>
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
    <label className={`block ${wide ? "col-span-2" : ""}`}>
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

function SocialField({
  label,
  icon,
  placeholder,
  hint,
  value,
  onChange,
}: {
  label: string;
  icon: string;
  placeholder: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-text3">
        <span className="text-[14px]">{icon}</span> {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-text outline-none focus:border-amber"
      />
      {hint ? <span className="mt-1 block text-[11px] text-text3">{hint}</span> : null}
    </label>
  );
}
