"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PhotoUploader } from "@/components/public/PhotoUploader";
import { GoogleSyncField } from "@/components/admin/GoogleSyncField";

type Service = {
  id?: string;
  title: string;
  items: string[];
  priceLabel: string | null;
};

type Listing = {
  id: string;
  description: string | null;
  address: string | null;
  photos: string[];
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
};

export function ListingEditForm({ listing }: { listing: Listing }) {
  const router = useRouter();
  const [form, setForm] = useState({
    description: listing.description ?? "",
    address: listing.address ?? "",
    photos: listing.photos,
    isPublished: listing.isPublished,
    whatsapp: listing.whatsapp ?? "",
    facebook: listing.facebook ?? "",
    instagram: listing.instagram ?? "",
    services: listing.services.length > 0 ? listing.services : [],
  });
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setError(null);
    const res = await fetch(`/api/mon-compte/listings/${listing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: form.description || null,
        address: form.address || null,
        photos: form.photos.filter((p) => p.trim().length > 0),
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
      }),
    });
    if (res.ok) {
      setState("ok");
      router.refresh();
      setTimeout(() => setState("idle"), 2000);
      return;
    }
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    setError(body.error ?? "Enregistrement impossible");
    setState("error");
  }

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

  return (
    <form onSubmit={save} className="space-y-6">
      <Section title="Présentation" subtitle="Description publique qui apparaît en haut de votre fiche.">
        <label className="block">
          <span className="sr-only">Description</span>
          <textarea
            rows={6}
            placeholder="Présentez votre entreprise, votre expertise, votre zone d'intervention…"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-text outline-none focus:border-amber"
          />
        </label>

        <F label="Adresse" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
      </Section>

      <Section
        title="Galerie photos"
        subtitle="Glissez-déposez vos photos. La première est utilisée comme photo principale."
      >
        <PhotoUploader
          photos={form.photos.filter(Boolean)}
          onChange={(photos) => setForm({ ...form, photos })}
        />
      </Section>

      <Section
        title="Vos services"
        subtitle="Listez vos prestations principales avec leurs options et tarifs."
      >
        {form.services.length === 0 ? (
          <p className="text-[12.5px] text-text3">
            Aucun service défini. Ajoutez votre premier service pour structurer votre offre.
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
        subtitle="Ces boutons apparaissent sur votre fiche publique."
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
            placeholder="https://facebook.com/mon-entreprise"
            value={form.facebook}
            onChange={(v) => setForm({ ...form, facebook: v })}
          />
          <SocialField
            label="Instagram"
            icon="ⓘ"
            placeholder="https://instagram.com/mon_entreprise"
            value={form.instagram}
            onChange={(v) => setForm({ ...form, instagram: v })}
          />
        </div>
      </Section>

      <Section
        title="Avis Google"
        subtitle="Importez vos avis Google Business et affichez-les sur votre fiche."
      >
        <GoogleSyncField
          listingId={listing.id}
          endpoint={`/api/mon-compte/listings/${listing.id}/google-sync`}
          current={listing.google}
        />
      </Section>

      <Section title="Statut">
        <label className="flex items-center gap-2 text-[13px] text-text2">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
          />
          Ma fiche est publiée
        </label>
      </Section>

      {state === "ok" ? (
        <div className="rounded-lg bg-green-bg px-3 py-2 text-[13px] text-green">
          ✓ Modifications enregistrées.
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg bg-red-bg px-3 py-2 text-[13px] text-red">{error}</div>
      ) : null}

      <div className="sticky bottom-4 flex justify-end">
        <button
          type="submit"
          disabled={state === "loading"}
          className="rounded-lg bg-amber px-6 py-3 text-[13px] font-medium text-[#0F1117] shadow-lg disabled:opacity-60"
        >
          {state === "loading" ? "Enregistrement..." : "Enregistrer les modifications"}
        </button>
      </div>
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
        <h2 className="font-syne text-[15px] font-semibold">{title}</h2>
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.15em] text-text3">
        {label}
      </span>
      <input
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
