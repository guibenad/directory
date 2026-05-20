"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/admin/Modal";
import { IconPicker } from "@/components/admin/IconPicker";
import { CategoryIcon } from "@/components/public/ui/CategoryIcon";

type Category = {
  id: string;
  slug: string;
  label: string;
  icon: string | null;
  color: string | null;
  sortOrder: number;
  listingsCount: number;
  seoPagesCount: number;
  /** Retourné par l'API POST uniquement (nombre de pages générées à la création) */
  seoPagesCreated?: number;
};

type FormData = {
  slug: string;
  label: string;
  icon: string | null;
  color: string | null;
  sortOrder: number;
};

const EMPTY: FormData = { slug: "", label: "", icon: null, color: null, sortOrder: 0 };

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function CategoryManager({
  initial,
  directorySlug,
}: {
  initial: Category[];
  directorySlug?: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);

  const qs = directorySlug ? `?directory=${directorySlug}` : "";

  async function remove(c: Category) {
    const hasListings = c.listingsCount > 0;
    const parts: string[] = [`Supprimer la catégorie "${c.label}" ?`];
    if (hasListings) {
      parts.push(
        `\n\n❌ ${c.listingsCount} fiche${c.listingsCount > 1 ? "s sont rattachées" : " est rattachée"} à cette catégorie.`,
        `\nMigrez ou supprimez d'abord ces fiches, puis réessayez.`,
      );
      alert(parts.join(""));
      return;
    }
    if (c.seoPagesCount > 0) {
      parts.push(
        `\n\n⚠️  ${c.seoPagesCount.toLocaleString("fr-FR")} page${c.seoPagesCount > 1 ? "s" : ""} SEO seront aussi supprimée${c.seoPagesCount > 1 ? "s" : ""}.`,
      );
    }
    parts.push("\n\nCette action est irréversible.");

    if (!confirm(parts.join(""))) return;

    const res = await fetch(`/api/admin/categories/${c.id}${qs}`, { method: "DELETE" });
    if (res.status === 409) {
      alert("Impossible : des fiches sont rattachées à cette catégorie.");
      return;
    }
    if (res.ok) {
      setItems(items.filter((i) => i.id !== c.id));
      router.refresh();
    } else {
      alert("Suppression impossible.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-syne text-[16px] font-semibold">Catégories</h2>
          <p className="mt-1 text-[12.5px] text-text3">
            {items.length} catégories · chacune a son icône et sa couleur
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="rounded-lg bg-amber px-4 py-[7px] text-[13px] font-medium text-[#0F1117]"
        >
          + Nouvelle catégorie
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {items.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-4 rounded-r2 border border-border bg-card p-4"
          >
            <CategoryIcon
              slug={c.slug}
              label={c.label}
              icon={c.icon}
              color={c.color}
              size={48}
            />
            <div className="flex-1">
              <div className="font-syne text-[15px] font-semibold text-text">{c.label}</div>
              <div className="text-[12px] text-text3">
                /{c.slug} · {c.listingsCount} fiches · {c.seoPagesCount} pages SEO
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 text-[12px]">
              <button
                type="button"
                onClick={() => setEditing(c)}
                className="text-amber hover:underline"
              >
                Éditer
              </button>
              <button
                type="button"
                onClick={() => remove(c)}
                className={
                  c.listingsCount > 0
                    ? "text-text3 hover:text-red"
                    : "text-red hover:underline"
                }
              >
                Supprimer{c.listingsCount > 0 ? ` (${c.listingsCount} fiches)` : ""}
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 ? (
          <div className="col-span-full rounded-r2 border border-dashed border-border bg-card p-12 text-center text-text3">
            Aucune catégorie. Créez la première avec le bouton en haut.
          </div>
        ) : null}
      </div>

      <CategoryModal
        open={creating}
        title="Nouvelle catégorie"
        qs={qs}
        onClose={() => setCreating(false)}
        onSaved={(c) => {
          setItems([
            ...items,
            { ...c, listingsCount: 0, seoPagesCount: c.seoPagesCreated ?? 0 },
          ]);
          setCreating(false);
          if (c.seoPagesCreated && c.seoPagesCreated > 0) {
            alert(`✓ Catégorie créée · ${c.seoPagesCreated.toLocaleString("fr-FR")} pages SEO générées automatiquement`);
          }
          router.refresh();
        }}
      />

      <CategoryModal
        open={!!editing}
        title={`Éditer — ${editing?.label ?? ""}`}
        initialData={editing}
        qs={qs}
        onClose={() => setEditing(null)}
        onSaved={(c) => {
          setItems(items.map((i) => (i.id === c.id ? { ...i, ...c } : i)));
          setEditing(null);
          router.refresh();
        }}
      />
    </div>
  );
}

function CategoryModal({
  open,
  title,
  qs,
  onClose,
  onSaved,
  initialData,
}: {
  open: boolean;
  title: string;
  qs: string;
  onClose: () => void;
  onSaved: (c: Category) => void;
  initialData?: Category | null;
}) {
  const [form, setForm] = useState<FormData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form on open
  if (open && initialData && form.slug !== initialData.slug) {
    setForm({
      slug: initialData.slug,
      label: initialData.label,
      icon: initialData.icon,
      color: initialData.color,
      sortOrder: initialData.sortOrder,
    });
  }
  if (open && !initialData && form !== EMPTY && form.slug === "" && form.label === "") {
    // ok, fresh
  }

  async function save() {
    setLoading(true);
    setError(null);
    const isEdit = !!initialData;
    const url = isEdit
      ? `/api/admin/categories/${initialData.id}${qs}`
      : `/api/admin/categories${qs}`;
    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(
        body.error === "slug_taken"
          ? "Ce slug est déjà utilisé."
          : "Enregistrement impossible.",
      );
      return;
    }
    const saved = (await res.json()) as Category;
    onSaved(saved);
    setForm(EMPTY);
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        onClose();
        setForm(EMPTY);
        setError(null);
      }}
      title={title}
      footer={
        <>
          <button
            type="button"
            onClick={() => {
              onClose();
              setForm(EMPTY);
              setError(null);
            }}
            className="rounded-lg border border-border2 px-4 py-2 text-[13px] text-text2 hover:text-text"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={save}
            disabled={loading || form.slug.length < 2 || form.label.length < 2}
            className="rounded-lg bg-amber px-4 py-2 text-[13px] font-medium text-[#0F1117] disabled:opacity-60"
          >
            {loading ? "Enregistrement..." : "Enregistrer"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-[12px] uppercase tracking-wide text-text3">
            Libellé
            <input
              value={form.label}
              onChange={(e) =>
                setForm({
                  ...form,
                  label: e.target.value,
                  slug: form.slug === slugify(initialData?.label ?? "") || form.slug === ""
                    ? slugify(e.target.value)
                    : form.slug,
                })
              }
              className="mt-1 w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-text outline-none focus:border-amber"
            />
          </label>
          <label className="block text-[12px] uppercase tracking-wide text-text3">
            Slug URL
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
              className="mt-1 w-full rounded-lg border border-border bg-bg3 px-3 py-2 font-mono text-[13px] text-text outline-none focus:border-amber"
            />
          </label>
        </div>

        <IconPicker
          slug={form.slug}
          label={form.label}
          icon={form.icon}
          color={form.color}
          onChange={(patch) => setForm({ ...form, ...patch })}
        />

        <label className="block text-[12px] uppercase tracking-wide text-text3">
          Ordre d'affichage
          <input
            type="number"
            min={0}
            max={999}
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
            className="mt-1 w-24 rounded-lg border border-border bg-bg3 px-3 py-2 text-text outline-none focus:border-amber"
          />
        </label>

        {error ? <p className="text-[13px] text-red">{error}</p> : null}
      </div>
    </Modal>
  );
}
