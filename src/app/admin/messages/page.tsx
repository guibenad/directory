import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveAdminDirectory } from "@/lib/scope";
import { MessagesInbox } from "@/components/admin/MessagesInbox";

export const dynamic = "force-dynamic";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams?: { directory?: string };
}) {
  const scope = await resolveAdminDirectory(searchParams);
  if (!scope) notFound();
  const { directory } = scope;

  const [total, unread] = await Promise.all([
    prisma.message.count({ where: { directoryId: directory.id } }),
    prisma.message.count({ where: { directoryId: directory.id, isRead: false } }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-syne text-[22px] font-bold">Messages — {directory.name}</h1>
        <p className="mt-1 text-[13.5px] text-text3">
          {unread} non lus · {total} au total
        </p>
      </div>
      <MessagesInbox directorySlug={directory.slug} />
    </div>
  );
}
