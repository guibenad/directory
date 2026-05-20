"use client";

import { useState } from "react";

export function BillingPortalButton() {
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    setLoading(true);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    if (!res.ok) {
      alert("Impossible d'ouvrir le portail de facturation.");
      setLoading(false);
      return;
    }
    const { url } = (await res.json()) as { url: string };
    window.location.href = url;
  }

  return (
    <button
      type="button"
      onClick={openPortal}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg border border-border2 px-4 py-[7px] text-[13px] text-text2 hover:border-amber hover:text-amber disabled:opacity-60"
    >
      {loading ? "Redirection..." : "Gérer facturation & paiements (Stripe)"}
    </button>
  );
}
