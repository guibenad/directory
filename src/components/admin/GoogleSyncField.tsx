"use client";

import { useState } from "react";

type Props = {
  listingId: string;
  endpoint: string; // ex. "/api/admin/listings/xxx/google-sync" ou "/api/mon-compte/listings/xxx/google-sync"
  current: {
    placeId: string | null;
    rating: number | null;
    reviewCount: number | null;
    syncedAt: string | null;
    mapsUrl: string | null;
  };
};

export function GoogleSyncField({ listingId: _id, endpoint, current }: Props) {
  const [input, setInput] = useState(current.placeId ?? "");
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [last, setLast] = useState(current);

  async function sync() {
    setState("loading");
    setMessage(null);
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    });
    if (res.ok) {
      const data = (await res.json()) as {
        placeId: string;
        rating: number | null;
        reviewCount: number | null;
      };
      setState("ok");
      setLast({
        placeId: data.placeId,
        rating: data.rating,
        reviewCount: data.reviewCount,
        syncedAt: new Date().toISOString(),
        mapsUrl: last.mapsUrl,
      });
      setMessage(`✓ ${data.reviewCount ?? 0} avis synchronisés`);
      setTimeout(() => setState("idle"), 2500);
      return;
    }
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    setMessage(
      body.error === "place_id_invalid"
        ? "Place ID invalide (commence par ChIJ… ou colle l'URL Google Maps)."
        : body.error === "not_found"
          ? "Établissement introuvable sur Google."
          : `Erreur : ${body.error ?? "inconnue"}`,
    );
    setState("error");
  }

  async function clear() {
    if (!confirm("Dissocier le Google Place de cette fiche ?")) return;
    const res = await fetch(endpoint, { method: "DELETE" });
    if (res.ok) {
      setInput("");
      setLast({ placeId: null, rating: null, reviewCount: null, syncedAt: null, mapsUrl: null });
      setState("ok");
      setMessage("Dissocié.");
      setTimeout(() => setState("idle"), 2000);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-[12.5px] text-text3">
        Collez le Google Place ID de votre fiche Google Business pour afficher vos avis Google
        directement sur votre fiche. Trouvez votre Place ID avec l'outil{" "}
        <a
          href="https://developers.google.com/maps/documentation/places/web-service/place-id"
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber hover:underline"
        >
          Google Place ID Finder ↗
        </a>
        .
      </p>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4 ou URL Google Maps"
          className="flex-1 rounded-lg border border-border bg-bg3 px-3 py-2 font-mono text-[12.5px] text-text outline-none focus:border-amber"
        />
        <button
          type="button"
          onClick={sync}
          disabled={state === "loading" || input.trim().length < 10}
          className="rounded-lg bg-amber px-4 py-2 text-[13px] font-medium text-[#0F1117] disabled:opacity-60"
        >
          {state === "loading" ? "Sync..." : last.placeId ? "Rafraîchir" : "Synchroniser"}
        </button>
      </div>

      {last.placeId ? (
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-green-bg bg-green-bg/40 px-3 py-2 text-[12.5px] text-text">
          <span className="text-green">●</span>
          <span>
            <strong className="text-text">
              {last.rating !== null ? last.rating.toFixed(1) : "—"} ★
            </strong>{" "}
            · {last.reviewCount ?? 0} avis Google
          </span>
          {last.syncedAt ? (
            <span className="text-text3">
              synchro {new Date(last.syncedAt).toLocaleString("fr-FR")}
            </span>
          ) : null}
          {last.mapsUrl ? (
            <a
              href={last.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber hover:underline"
            >
              Voir sur Maps ↗
            </a>
          ) : null}
          <button
            type="button"
            onClick={clear}
            className="ml-auto text-text3 hover:text-red"
          >
            Dissocier
          </button>
        </div>
      ) : null}

      {message && state === "error" ? (
        <p className="text-[13px] text-red">{message}</p>
      ) : null}
      {message && state === "ok" ? (
        <p className="text-[13px] text-green">{message}</p>
      ) : null}
    </div>
  );
}
