import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-server";
import { ReplyForm } from "./ReplyForm";

export const dynamic = "force-dynamic";

function formatTime(d: Date): string {
  return d.toLocaleString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

export default async function CompanyMessagesPage() {
  const session = await requireSession();
  if (!session?.user.companyId) notFound();

  const messages = await prisma.message.findMany({
    where: { listing: { companyId: session.user.companyId } },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      listing: { include: { directory: { select: { name: true, primaryColor: true } } } },
    },
  });

  return (
    <div>
      <h1 className="mb-6 font-syne text-[22px] font-bold">Mes messages</h1>

      {messages.length === 0 ? (
        <div className="rounded-r2 border border-border bg-card p-12 text-center text-text3">
          Aucun message reçu.
        </div>
      ) : (
        <ul className="space-y-4">
          {messages.map((m) => (
            <li key={m.id} className="rounded-r2 border border-border bg-card p-5">
              <header className="mb-3 flex items-center justify-between text-[13px]">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: m.listing.directory.primaryColor }}
                  />
                  <span className="text-text3">{m.listing.directory.name}</span>
                  <span className="text-text3">·</span>
                  <strong className="text-text">{m.senderName}</strong>
                  <span className="text-text3">{m.senderEmail}</span>
                </div>
                <span className="text-text3">{formatTime(m.createdAt)}</span>
              </header>
              <p className="whitespace-pre-line text-[14px] text-text">{m.content}</p>

              {m.reply ? (
                <div className="mt-4 rounded-lg bg-amber-bg px-4 py-3 text-[13.5px] text-amber">
                  <div className="mb-1 text-[11px] uppercase tracking-wide text-amber2">
                    Votre réponse · {m.repliedAt ? formatTime(m.repliedAt) : ""}
                  </div>
                  {m.reply}
                </div>
              ) : (
                <ReplyForm messageId={m.id} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
