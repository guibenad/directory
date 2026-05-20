"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Category = { id: string; label: string };
type Plan = { id: string; name: string; key: string };

type Listing = {
  id: string;
  slug: string;
  companyName: string;
  companyEmail: string;
  categoryLabel: string;
  categorySlug: string;
  ville: string;
  villeLabel: string | null;
  isPublished: boolean;
  priority: number;
  rating: number;
  reviewCount: number;
  messagesCount: number;
  reviewsCount: number;
  planKey: "STARTER" | "ESSENTIEL" | "PRO" | null;
  subscriptionStatus: "TRIAL" | "ACTIVE" | "SUSPENDED" | "CANCELLED" | null;
  createdAt: string;
};

type Filters = {
  q: string;
  categoryId: string;
  ville: string;
  planId: string;
  status: "" | "TRIAL" | "ACTIVE" | "SUSPENDED" | "CANCELLED";
  published: "" | "true" | "false";
};

const EMPTY: Filters = {
  q: "",
  categoryId: "",
  ville: "",
  planId: "",
  status: "",
  published: "",
};

const PLAN_COLOR: Record<string, { bg: string; fg: string }> = {
  PRO: { bg: "bg-amber-bg", fg: "text-amber" },
  ESSENTIEL: { bg: "bg-blue-bg", fg: "text-blue" },
  STARTER: { bg: "bg-bg3", fg: "text-text2" },
};

const STATUS_LABEL: Record<string, { bg: string; fg: string; label: string }> = {
  ACTIVE: { bg: "bg-green-bg", fg: "text-green", label: "Actif" },
  TRIAL: { bg: "bg-amber-bg", fg: "text-amber", label: "Essai" },
  SUSPENDED: { bg: "bg-red-bg", fg: "text-red", label: "Suspendu" },
  CANCELLED: { bg: "bg-bg3", fg: "text-text2", label: "Annulé" },
};

export function ListingsTable({
  categories,
  plans,
  directorySlug,
}: {
  categories: Category[];
  plans: Plan[];
  directorySlug?: string;
}) {
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [debouncedQ, setDebouncedQ] = useState("");
  const [debouncedVille, setDebouncedVille] = useState("");
  const [items, setItems] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const perPage = 25;
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(filters.q), 300);
    return () => clearTimeout(t);
  }, [filters.q]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedVille(filters.ville), 300);
    return () => clearTimeout(t);
  }, [filters.ville]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, debouncedVille, filters.categoryId, filters.planId, filters.status, filters.published]);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (directorySlug) p.set("directory", directorySlug);
    p.set("page", String(page));
    p.set("perPage", String(perPage));
    if (debouncedQ) p.set("q", debouncedQ);
    if (filters.categoryId) p.set("categoryId", filters.categoryId);
    if (debouncedVille) p.set("ville", debouncedVille);
    if (filters.planId) p.set("planId", filters.planId);
    if (filters.status) p.set("status", filters.status);
    if (filters.published) p.set("published", filters.published);
    return p.toString();
  }, [
    directorySlug,
    page,
    perPage,
    debouncedQ,
    debouncedVille,
    filters.categoryId,
    filters.planId,
    filters.status,
    filters.published,
  ]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/listings?${qs}`);
    if (res.ok) {
      const data = (await res.json()) as {
        items: Listing[];
        pagination: { total: number };
      };
      setItems(data.items);
      setTotal(data.pagination.total);
    }
    setLoading(false);
  }, [qs]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const hasFilters =
    filters.q !== "" ||
    filters.categoryId !== "" ||
    filters.ville !== "" ||
    filters.planId !== "" ||
    filters.status !== "" ||
    filters.published !== "";

  const linkQs = directorySlug ? `?directory=${directorySlug}` : "";

  return (
    <div className="overflow-hidden rounded-r2 border border-border bg-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-6 py-4">
        <input
          placeholder="🔍 Rechercher (nom, email, slug)..."
          value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          className="w-[240px] rounded-lg border border-border bg-bg3 px-3 py-[7px] text-[13px] text-text outline-none placeholder:text-text3 focus:border-amber"
        />

        <Select
          value={filters.categoryId}
          onChange={(v) => setFilters({ ...filters, categoryId: v })}
          placeholder="Toutes catégories"
          options={categories.map((c) => ({ value: c.id, label: c.label }))}
        />

        <input
          placeholder="Ville..."
          value={filters.ville}
          onChange={(e) => setFilters({ ...filters, ville: e.target.value })}
          className="w-[140px] rounded-lg border border-border bg-bg3 px-3 py-[7px] text-[13px] text-text outline-none placeholder:text-text3 focus:border-amber"
        />

        <Select
          value={filters.planId}
          onChange={(v) => setFilters({ ...filters, planId: v })}
          placeholder="Tous plans"
          options={plans.map((p) => ({ value: p.id, label: p.name }))}
        />

        <Select
          value={filters.status}
          onChange={(v) => setFilters({ ...filters, status: v as Filters["status"] })}
          placeholder="Tous statuts"
          options={[
            { value: "ACTIVE", label: "Actif" },
            { value: "TRIAL", label: "Essai" },
            { value: "SUSPENDED", label: "Suspendu" },
            { value: "CANCELLED", label: "Annulé" },
          ]}
        />

        <Select
          value={filters.published}
          onChange={(v) => setFilters({ ...filters, published: v as Filters["published"] })}
          placeholder="Publié / brouillon"
          options={[
            { value: "true", label: "Publié" },
            { value: "false", label: "Brouillon" },
          ]}
        />

        {hasFilters ? (
          <button
            type="button"
            onClick={() => setFilters(EMPTY)}
            className="text-[12px] text-text3 hover:text-text"
          >
            Réinitialiser
          </button>
        ) : null}

        <div className="ml-auto text-[12px] text-text3">
          {loading ? "Chargement..." : `${total.toLocaleString("fr-FR")} résultat${total > 1 ? "s" : ""}`}
        </div>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr>
            {["Fiche", "Catégorie · Ville", "Client", "Plan", "Statut", "Messages", "Avis", "Publication", ""].map(
              (h) => (
                <th
                  key={h}
                  className="border-b border-border px-6 py-[10px] text-left text-[11.5px] font-medium uppercase tracking-[0.7px] text-text3"
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((l) => {
            const editHref = `/admin/fiches/${l.id}${linkQs}` as never;
            const plan = l.planKey ? PLAN_COLOR[l.planKey] : null;
            const statusBadge = l.subscriptionStatus ? STATUS_LABEL[l.subscriptionStatus] : null;
            return (
              <tr key={l.id} className="group border-b border-border last:border-0 hover:bg-bg3">
                <td className="px-6 py-[14px]">
                  <Link href={editHref} className="flex items-center gap-[10px] hover:text-amber">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-bg font-syne text-[14px] font-semibold text-amber">
                      {l.companyName
                        .split(" ")
                        .slice(0, 2)
                        .map((p) => p[0]?.toUpperCase() ?? "")
                        .join("")}
                    </span>
                    <div>
                      <div className="text-[14px] font-medium text-text group-hover:text-amber">
                        {l.companyName}
                      </div>
                      <div className="text-[12px] text-text3">/{l.slug}</div>
                    </div>
                  </Link>
                </td>
                <td className="px-6 py-[14px] text-[13.5px]">
                  <span className="text-text">{l.categoryLabel}</span>{" "}
                  <span className="text-text3">· {l.villeLabel ?? l.ville}</span>
                </td>
                <td className="px-6 py-[14px] text-[13px] text-text2">{l.companyEmail}</td>
                <td className="px-6 py-[14px]">
                  {l.planKey && plan ? (
                    <span
                      className={`inline-flex rounded-md px-[10px] py-[4px] text-[12px] font-medium ${plan.bg} ${plan.fg}`}
                    >
                      {l.planKey}
                    </span>
                  ) : (
                    <span className="text-[12px] text-text3">—</span>
                  )}
                </td>
                <td className="px-6 py-[14px]">
                  {statusBadge ? (
                    <span
                      className={`inline-flex rounded-md px-[10px] py-[4px] text-[12px] font-medium ${statusBadge.bg} ${statusBadge.fg}`}
                    >
                      {statusBadge.label}
                    </span>
                  ) : (
                    <span className="text-[12px] text-text3">—</span>
                  )}
                </td>
                <td className="px-6 py-[14px] text-[13px] text-text2">{l.messagesCount}</td>
                <td className="px-6 py-[14px] text-[13px] text-text2">{l.reviewsCount}</td>
                <td className="px-6 py-[14px]">
                  <span
                    className={[
                      "inline-flex rounded-md px-[10px] py-[4px] text-[12px] font-medium",
                      l.isPublished ? "bg-green-bg text-green" : "bg-bg3 text-text2",
                    ].join(" ")}
                  >
                    {l.isPublished ? "Publiée" : "Brouillon"}
                  </span>
                </td>
                <td className="px-6 py-[14px] text-right text-[12.5px]">
                  <Link
                    href={editHref}
                    className="text-amber opacity-0 transition-opacity group-hover:opacity-100 hover:underline"
                  >
                    Éditer →
                  </Link>
                </td>
              </tr>
            );
          })}
          {items.length === 0 && !loading ? (
            <tr>
              <td colSpan={9} className="px-6 py-12 text-center text-text3">
                Aucune fiche ne correspond à ces filtres.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <div className="flex items-center justify-between border-t border-border px-6 py-3 text-[12px] text-text3">
        <span>
          Page {page} / {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="rounded-md border border-border px-3 py-1 disabled:opacity-40"
          >
            ← Précédent
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            className="rounded-md border border-border px-3 py-1 disabled:opacity-40"
          >
            Suivant →
          </button>
        </div>
      </div>
    </div>
  );
}

function Select({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-border bg-bg3 px-3 py-[7px] text-[13px] text-text outline-none focus:border-amber"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
