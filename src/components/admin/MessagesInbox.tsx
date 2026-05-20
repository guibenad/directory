"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

type Message = {
  id: string;
  listingId: string;
  senderName: string;
  senderEmail: string;
  content: string;
  reply: string | null;
  isRead: boolean;
  repliedAt: string | null;
  createdAt: string;
  listing: { slug: string; company: { name: string } };
};

type Filter = "all" | "unread" | "pending";

function formatTime(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

export function MessagesInbox({ directorySlug }: { directorySlug: string }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [items, setItems] = useState<Message[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [realtimeOk, setRealtimeOk] = useState(false);
  const autoReadRef = useRef<Set<string>>(new Set());

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    params.set("directory", directorySlug);
    if (filter !== "all") params.set("filter", filter);
    const res = await fetch(`/api/messages?${params.toString()}`);
    if (!res.ok) return;
    const data = (await res.json()) as { items: Message[] };
    setItems(data.items);
    if (!selectedId && data.items[0]) setSelectedId(data.items[0].id);
  }, [filter, selectedId, directorySlug]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) {
      const id = setInterval(() => void load(), 30_000);
      return () => clearInterval(id);
    }
    const channel = supabase
      .channel(`admin-messages-${directorySlug}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Message" },
        () => void load(),
      )
      .subscribe((s) => setRealtimeOk(s === "SUBSCRIBED"));
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load, directorySlug]);

  const selected = useMemo(
    () => items.find((m) => m.id === selectedId) ?? null,
    [items, selectedId],
  );

  useEffect(() => {
    if (!selected || selected.isRead || autoReadRef.current.has(selected.id)) return;
    autoReadRef.current.add(selected.id);
    void fetch(`/api/messages/${selected.id}/read`, { method: "POST" }).then(() => {
      setItems((curr) => curr.map((m) => (m.id === selected.id ? { ...m, isRead: true } : m)));
    });
  }, [selected]);

  async function submitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || replying) return;
    setReplying(true);
    const res = await fetch(`/api/messages/${selected.id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply: replyText }),
    });
    setReplying(false);
    if (res.ok) {
      setReplyText("");
      await load();
    }
  }

  const unread = items.filter((m) => !m.isRead).length;

  return (
    <div className="grid h-[600px] grid-cols-[320px_1fr] overflow-hidden rounded-r2 border border-border bg-card">
      <aside className="flex flex-col overflow-hidden border-r border-border">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <div className="font-syne text-[14px] font-semibold">Conversations</div>
            <div className="text-[11px] text-text3">
              {realtimeOk ? "Temps réel actif" : "Polling 30 s"}
            </div>
          </div>
          <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-amber px-2 text-[11px] font-bold text-[#0F1117]">
            {unread}
          </span>
        </div>

        <div className="flex gap-2 border-b border-border px-5 py-3">
          {(["all", "unread", "pending"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={[
                "rounded-full px-3 py-[4px] text-[11.5px]",
                filter === f
                  ? "bg-amber text-[#0F1117]"
                  : "border border-border text-text2 hover:text-text",
              ].join(" ")}
            >
              {f === "all" ? "Tous" : f === "unread" ? "Non lus" : "En attente"}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-6 text-center text-[13px] text-text3">Aucune conversation.</div>
          ) : (
            items.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedId(m.id)}
                className={[
                  "block w-full border-b border-border px-5 py-4 text-left transition-colors",
                  m.id === selectedId
                    ? "border-l-[3px] border-l-amber bg-bg3"
                    : "hover:bg-bg3",
                ].join(" ")}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[13.5px] font-medium text-text">{m.senderName}</span>
                  <span className="text-[11px] text-text3">{formatTime(m.createdAt)}</span>
                </div>
                <div className="truncate text-[12.5px] text-text3">{m.content}</div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[11px] text-text3">→ {m.listing.company.name}</span>
                  {!m.isRead ? (
                    <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-amber text-[11px] font-bold text-[#0F1117]">
                      •
                    </span>
                  ) : null}
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="flex flex-col">
        {selected ? (
          <>
            <header className="flex items-center gap-3 border-b border-border px-6 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-bg font-syne text-[14px] font-semibold text-amber">
                {selected.senderName[0]?.toUpperCase() ?? "?"}
              </span>
              <div>
                <div className="text-[14px] font-medium text-text">{selected.senderName}</div>
                <div className="text-[12px] text-text3">
                  {selected.senderEmail} → {selected.listing.company.name}
                </div>
              </div>
            </header>

            <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-6">
              <div className="max-w-[70%] self-start rounded-[4px_12px_12px_12px] bg-bg3 px-[14px] py-[10px] text-[13.5px] text-text">
                {selected.content}
                <div className="mt-1 text-[11px] text-text3">{formatTime(selected.createdAt)}</div>
              </div>
              {selected.reply ? (
                <div className="max-w-[70%] self-end rounded-[12px_4px_12px_12px] bg-amber px-[14px] py-[10px] text-[13.5px] text-[#0F1117]">
                  {selected.reply}
                  {selected.repliedAt ? (
                    <div className="mt-1 text-[11px] text-[#0F1117]/70">
                      {formatTime(selected.repliedAt)}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <form onSubmit={submitReply} className="flex gap-2 border-t border-border px-6 py-4">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Répondre au nom de l'entreprise..."
                required
                minLength={2}
                className="flex-1 rounded-lg border border-border bg-bg3 px-3 py-[9px] text-[13.5px] text-text outline-none focus:border-amber"
              />
              <button
                type="submit"
                disabled={replying}
                className="rounded-lg bg-amber px-4 py-[9px] text-[13px] font-medium text-[#0F1117] disabled:opacity-60"
              >
                {replying ? "..." : "Envoyer"}
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-text3">
            Sélectionnez une conversation.
          </div>
        )}
      </section>
    </div>
  );
}
