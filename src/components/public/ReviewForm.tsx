"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReviewForm({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [authorName, setAuthorName] = useState("");
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setError(null);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, authorName, rating, comment: comment || undefined }),
    });
    if (res.ok) {
      setState("ok");
      setAuthorName("");
      setComment("");
      setRating(5);
      router.refresh();
      return;
    }
    setError(res.status === 429 ? "Trop d'avis — réessayez plus tard." : "Publication impossible.");
    setState("error");
  }

  if (state === "ok") {
    return (
      <div className="rounded-xl border border-[#C6E4CF] bg-[#EEF7EE] p-5 text-[14px] text-[#2E8B57]">
        ✅ Merci pour votre avis.
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-[color:var(--mist)] bg-white p-6 shadow-[var(--shadow-soft)]"
    >
      <h3 className="mb-4 font-syne text-[18px] font-bold">Laisser un avis</h3>

      <div className="mb-4 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
            className={
              "text-[28px] transition-transform hover:scale-110 " +
              (n <= rating ? "text-[color:var(--accent)]" : "text-[color:var(--mist-2)]")
            }
          >
            ★
          </button>
        ))}
        <span className="ml-3 text-[13px] text-[color:var(--mute)]">{rating} / 5</span>
      </div>

      <label className="mb-3 block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[color:var(--mute)]">
          Votre nom
        </span>
        <input
          required
          minLength={2}
          maxLength={80}
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          className="w-full rounded-xl border border-[color:var(--mist)] bg-white px-3 py-2.5 text-[14px] outline-none focus:border-[color:var(--accent)]"
        />
      </label>

      <label className="mb-4 block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[color:var(--mute)]">
          Commentaire (optionnel)
        </span>
        <textarea
          rows={3}
          maxLength={1500}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full rounded-xl border border-[color:var(--mist)] bg-white px-3 py-2.5 text-[14px] outline-none focus:border-[color:var(--accent)]"
        />
      </label>

      {error ? <p className="mb-3 text-[13px] text-[#B00020]">{error}</p> : null}

      <button type="submit" disabled={state === "loading"} className="btn-ink w-full">
        {state === "loading" ? "Publication…" : "Publier mon avis"}
      </button>
    </form>
  );
}
