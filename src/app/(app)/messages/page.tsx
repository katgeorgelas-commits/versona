import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getThreads } from "@/features/messaging/data";
import { Avatar } from "@/components/ui/avatar";
import { timeAgo } from "@/lib/utils";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export default async function MessagesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  const threads = await getThreads(user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Breadcrumbs items={[{ label: "Messages" }]} />
      <h1 className="font-display text-2xl font-bold">Messages</h1>
      {threads.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No conversations yet. Connect with someone, then start a chat.
        </div>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {threads.map((t) => (
            <Link
              key={t.id}
              href={`/messages/${t.id}`}
              className="flex items-center gap-3 p-3 hover:bg-muted"
            >
              <Avatar name={t.other.displayName} src={t.other.avatarUrl} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{t.other.displayName}</span>
                  {t.lastMessageAt && (
                    <span className="text-xs text-muted-foreground">{timeAgo(t.lastMessageAt)}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <p className="line-clamp-1 flex-1 text-sm text-muted-foreground">
                    {t.state === "request" && t.initiatedByMe && "Request sent · "}
                    {t.lastMessagePreview ?? "No messages yet"}
                  </p>
                  {t.unread > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-medium text-white">
                      {t.unread}
                    </span>
                  )}
                </div>
              </div>
              {t.state === "request" && !t.initiatedByMe && (
                <span className="rounded-sm bg-accent-light px-2 py-0.5 text-[11px] font-medium text-accent">
                  Request
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
