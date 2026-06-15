import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { isOfflineDemo } from "@/lib/dev/offline";
import { store, type NotificationRecord } from "@/lib/dev/offline-store";
import { offlinePersonCard } from "@/features/profile/data";
import type { NotificationView, PersonCard } from "@/types/views";

function hrefFor(n: { type: string; entity_type: string | null; entity_id: string | null }): string | null {
  switch (n.type) {
    case "connection_request":
    case "connection_accepted":
      return "/connections";
    case "message":
      return "/messages";
    case "reply":
    case "reaction":
    case "mention":
      return n.entity_type === "post" && n.entity_id ? `/post/${n.entity_id}` : "/feed";
    case "weekly_prompt":
      return "/missions";
    default:
      return null;
  }
}

function toView(n: NotificationRecord, actor: PersonCard | null): NotificationView {
  return {
    id: n.id,
    type: n.type,
    actor,
    summary: n.summary,
    entityType: n.entity_type,
    entityId: n.entity_id,
    href: hrefFor(n),
    createdAt: n.created_at,
    read: !!n.read_at,
  };
}

export async function getNotifications(viewerId: string): Promise<NotificationView[]> {
  if (isOfflineDemo()) {
    return store.notifications
      .filter((n) => n.recipient_id === viewerId)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .map((n) => toView(n, n.actor_id ? offlinePersonCard(n.actor_id) : null));
  }
  const db = createServiceClient();
  const { data } = await db
    .from("notifications")
    .select("*, actor:actor_id(id, username, display_name, avatar_url)")
    .eq("recipient_id", viewerId)
    .order("created_at", { ascending: false })
    .limit(50);
  type Row = NotificationRecord & {
    actor: { id: string; username: string; display_name: string; avatar_url: string | null } | null;
  };
  return ((data ?? []) as unknown as Row[]).map((n) =>
    toView(
      n,
      n.actor
        ? {
            id: n.actor.id,
            username: n.actor.username,
            displayName: n.actor.display_name,
            avatarUrl: n.actor.avatar_url,
            headline: null,
            values: [],
            lastActiveAt: null,
          }
        : null,
    ),
  );
}

export async function getUnreadCount(viewerId: string): Promise<number> {
  if (isOfflineDemo()) {
    return store.notifications.filter((n) => n.recipient_id === viewerId && !n.read_at).length;
  }
  const db = createServiceClient();
  const { count } = await db
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("recipient_id", viewerId)
    .is("read_at", null);
  return count ?? 0;
}
