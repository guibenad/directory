"use client";

import { useState } from "react";

export function ContactForm({ listingId }: { listingId: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setErrorMessage(null);
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, senderName: name, senderEmail: email, content }),
    });
    if (res.ok) {
      setState("ok");
      setName("");
      setEmail("");
      setContent("");
      return;
    }
    if (res.status === 429) {
      setErrorMessage("Vous avez envoyé trop de messages — réessayez dans une heure.");
    } else {
      setErrorMessage("Impossible d'envoyer votre message.");
    }
    setState("error");
  }

  if (state === "ok") {
    return (
      <div className="rounded-xl border border-[#C6E4CF] bg-[#EEF7EE] p-5 text-[14px] text-[#2E8B57]">
        ✅ Votre message est parti — le pro vous répondra à {email} sous peu.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Input
        label="Nom"
        required
        minLength={2}
        value={name}
        onChange={setName}
      />
      <Input
        label="Email"
        type="email"
        required
        value={email}
        onChange={setEmail}
      />
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[color:var(--mute)]">
          Votre besoin
        </span>
        <textarea
          required
          minLength={5}
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Décrivez votre projet…"
          className="w-full rounded-xl border border-[color:var(--mist)] bg-white px-3 py-2.5 text-[14px] text-[color:var(--ink)] outline-none transition focus:border-[color:var(--accent)]"
        />
      </label>

      {errorMessage ? <p className="text-[13px] text-[#B00020]">{errorMessage}</p> : null}

      <button type="submit" disabled={state === "loading"} className="btn-primary w-full">
        {state === "loading" ? "Envoi…" : "Envoyer gratuitement"}
      </button>

      <p className="text-center text-[11.5px] text-[color:var(--mute-2)]">
        Gratuit · Sans engagement · Réponse sous 24h
      </p>
    </form>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required,
  minLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[color:var(--mute)]">
        {label}
      </span>
      <input
        type={type}
        required={required}
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-[color:var(--mist)] bg-white px-3 py-2.5 text-[14px] text-[color:var(--ink)] outline-none transition focus:border-[color:var(--accent)]"
      />
    </label>
  );
}
