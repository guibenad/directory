"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReplyForm({ messageId }: { messageId: string }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/messages/${messageId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply: value }),
    });
    setLoading(false);
    if (res.ok) {
      setValue("");
      router.refresh();
      return;
    }
    setError("Envoi impossible.");
  }

  return (
    <form onSubmit={submit} className="mt-4 flex gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Répondre..."
        className="flex-1 rounded-lg border border-border bg-bg3 px-3 py-[9px] text-[13.5px] text-text outline-none focus:border-amber"
        required
        minLength={2}
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-amber px-4 py-[9px] text-[13px] font-medium text-[#0F1117] disabled:opacity-60"
      >
        {loading ? "..." : "Répondre"}
      </button>
      {error ? <span className="text-[13px] text-red">{error}</span> : null}
    </form>
  );
}
