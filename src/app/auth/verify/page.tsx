"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";

type State = { kind: "loading" } | { kind: "error"; message: string };

function VerifyInner() {
  const params = useSearchParams();
  const token = params.get("token");
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!token) {
      setState({ kind: "error", message: "Lien invalide." });
      return;
    }
    (async () => {
      const res = await signIn("magic", {
        token,
        redirect: false,
        callbackUrl,
      });
      if (res?.error || !res?.ok) {
        setState({ kind: "error", message: "Ce lien est invalide ou a expiré." });
        return;
      }
      window.location.href = res.url ?? callbackUrl;
    })();
  }, [token, callbackUrl]);

  if (state.kind === "loading") {
    return (
      <div className="w-full max-w-sm rounded-r2 border border-border bg-card p-8 text-center">
        <p className="font-syne text-lg font-bold">Connexion en cours…</p>
        <p className="mt-2 text-sm text-text3">Vérification de votre lien.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-4 rounded-r2 border border-border bg-card p-8 text-center">
      <h1 className="font-syne text-xl font-bold">Lien invalide</h1>
      <p className="text-sm text-text3">{state.message}</p>
      <Link
        href="/login"
        className="inline-block rounded-lg bg-amber px-4 py-2 text-sm font-medium text-[#0F1117] hover:bg-amber2"
      >
        Retour à la connexion
      </Link>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-6">
      <Suspense>
        <VerifyInner />
      </Suspense>
    </main>
  );
}
