"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

type Mode = "password" | "magic";

function LoginForm() {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";
  const [mode, setMode] = useState<Mode>("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmitPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    setLoading(false);
    if (res?.error) {
      setError("Identifiants invalides.");
      return;
    }
    window.location.href = res?.url ?? callbackUrl;
  }

  async function onSubmitMagic(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/magic-link", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, callbackUrl }),
    });
    setLoading(false);
    if (res.status === 429) {
      setError("Trop de demandes. Réessayez dans quelques minutes.");
      return;
    }
    if (!res.ok) {
      setError("Une erreur est survenue. Réessayez.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm space-y-4 rounded-r2 border border-border bg-card p-8 text-center">
        <h1 className="font-syne text-xl font-bold">Vérifiez vos emails</h1>
        <p className="text-sm text-text3">
          Si un compte existe pour <strong className="text-text">{email}</strong>, un lien de
          connexion vient d'être envoyé. Il expire dans 15 minutes.
        </p>
        <button
          onClick={() => {
            setSent(false);
            setEmail("");
          }}
          className="text-sm text-amber hover:underline"
        >
          Utiliser une autre adresse
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={mode === "password" ? onSubmitPassword : onSubmitMagic}
      className="w-full max-w-sm space-y-4 rounded-r2 border border-border bg-card p-8"
    >
      <div>
        <h1 className="font-syne text-2xl font-bold">Connexion</h1>
        <p className="mt-1 text-sm text-text3">
          {mode === "magic"
            ? "Recevez un lien de connexion par email."
            : "Connexion admin par mot de passe."}
        </p>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs uppercase tracking-wide text-text3">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-text outline-none focus:border-amber"
          autoComplete="email"
        />
      </label>

      {mode === "password" ? (
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-wide text-text3">Mot de passe</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-text outline-none focus:border-amber"
            autoComplete="current-password"
          />
        </label>
      ) : null}

      {error ? <p className="text-sm text-red">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-amber py-2 font-medium text-[#0F1117] hover:bg-amber2 disabled:opacity-60"
      >
        {loading
          ? mode === "magic"
            ? "Envoi…"
            : "Connexion…"
          : mode === "magic"
            ? "Recevoir un lien"
            : "Se connecter"}
      </button>

      <button
        type="button"
        onClick={() => {
          setError(null);
          setMode(mode === "magic" ? "password" : "magic");
        }}
        className="block w-full text-center text-xs text-text3 hover:text-amber"
      >
        {mode === "magic"
          ? "Utiliser un mot de passe (admin)"
          : "← Me connecter par email"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-6">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
