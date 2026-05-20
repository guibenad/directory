"use client";

import { useEffect, useState } from "react";
import { loadStripe, type Stripe, type StripeElementsOptions } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

type Mode = "setup" | "payment";

let stripePromise: Promise<Stripe | null> | null = null;
function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const pk = process.env.NEXT_PUBLIC_STRIPE_PK;
    stripePromise = pk ? loadStripe(pk) : Promise.resolve(null);
  }
  return stripePromise;
}

type Props = {
  clientSecret: string;
  mode: Mode;
  returnUrl: string;
};

export function StripePaymentForm({ clientSecret, mode, returnUrl }: Props) {
  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: "stripe",
      variables: {
        colorPrimary: "#F5A623",
        colorBackground: "#FFFFFF",
        colorText: "#1A1A1A",
        fontFamily: "DM Sans, system-ui, sans-serif",
        borderRadius: "10px",
      },
    },
  };

  return (
    <Elements options={options} stripe={getStripe()}>
      <InnerForm mode={mode} returnUrl={returnUrl} />
    </Elements>
  );
}

function InnerForm({ mode, returnUrl }: { mode: Mode; returnUrl: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (stripe && elements) setReady(true);
  }, [stripe, elements]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    const common = { elements, confirmParams: { return_url: returnUrl } } as const;

    const result =
      mode === "setup"
        ? await stripe.confirmSetup(common)
        : await stripe.confirmPayment(common);

    if (result.error) {
      setError(result.error.message ?? "Paiement refusé.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PaymentElement />
      {error ? <p className="text-[13px] text-[#B00020]">{error}</p> : null}
      <button
        type="submit"
        disabled={!ready || loading}
        className="w-full rounded-[10px] bg-[#F5A623] px-7 py-[14px] font-syne text-[15px] font-bold text-[#1A1A1A] disabled:opacity-60"
      >
        {loading ? "Validation..." : "Confirmer et démarrer l'essai"}
      </button>
      <p className="text-center text-[12px] text-[#777]">
        Paiement sécurisé par Stripe · 14 jours gratuits · annulation à tout moment
      </p>
    </form>
  );
}
