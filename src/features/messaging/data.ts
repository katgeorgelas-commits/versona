import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { isOfflineDemo } from "@/lib/dev/offline";
import { store, type ThreadRecord, type MessageRecord } from "@/lib/dev/offline-store";
import { offlinePersonCard } from "@/features/profile/data";
import type { ThreadView, MessageView, PersonCard } from "@/types/views";

function otherId(t: ThreadRecord, viewerId: string) {
  return t.user_a === viewerId ? t.user_b : t.user_a;
}

function offlineThreadView(t: ThreadRecord, viewerId: string): ThreadView | null {
  const other = offlinePersonCard(otherId(t, viewerId));
  if (!other) return null;
  const msgs = store.messages.filter((m) => m.thread_id === t.id);
  const last = msgs[msgs.length - 1];
  return {
    id: t.id,
    other,
    state: t.state,
    lastMessageAt: t.last_message_at,
    lastMessagePreview: last?.body ?? null,
    unread: msgs.filter((m) => m.sender_id !== viewerId && !m.read_at).length,
    initiatedByMe: t.initiated_by === viewerId,
  };
}

export async function getThreads(viewerId: string): Promise<ThreadView[]> {
  if (isOfflineDemo()) {
    return store.threads
      .filter((t) => t.user_a === viewerId || t.user_b === viewerId)
      .map((t) => offlineThreadView(t, viewerId))
      .filter((t): t is ThreadView => !!t)
      .sort((a, b) => ((a.lastMessageAt ?? "") < (b.lastMessageAt ?? "") ? 1 : -1));
  }
  const db = createServiceClient();
  const { data } = await db
    .from("threads")
    .select("*")
    .or(`user_a.eq.${viewerId},user_b.eq.${viewerId}`)
    .order("last_message_at", { ascending: false, nullsFirst: false });
  const threads = (data ?? []) as ThreadRecord[];
  const out: ThreadView[] = [];
  for (const t of threads) {
    const oid = otherId(t, viewerId);
    const { data: u } = await db
      .from("users")
      .select("id, username, display_name, avatar_url")
      .eq("id", oid)
      .maybeSingle();
    if (!u) continue;
    const { data: msgs } = await db
      .from("messages")
      .select("body, sender_id, read_at, created_at")
      .eq("thread_id", t.id)
      .order("created_at", { ascending: false })
      .limit(20);
    const list = msgs ?? [];
    out.push({
      id: t.id,
      other: cardOf(u),
      state: t.state,
      lastMessageAt: t.last_message_at,
      lastMessagePreview: list[0]?.body ?? null,
      unread: list.filter((m) => m.sender_id !== viewerId && !m.read_at).length,
      initiatedByMe: t.initiated_by === viewerId,
    });
  }
  return out;
}

export async function getThread(
  threadId: string,
  viewerId: string,
): Promise<{ thread: ThreadView; messages: MessageView[] } | null> {
  if (isOfflineDemo()) {
    const t = store.threads.find((x) => x.id === threadId);
    if (!t || (t.user_a !== viewerId && t.user_b !== viewerId)) return null;
    const view = offlineThreadView(t, viewerId);
    if (!view) return null;
    const messages = store.messages
      .filter((m) => m.thread_id === threadId)
      .sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
      .map((m) => toMessageView(m, viewerId));
    return { thread: view, messages };
  }
  const db = createServiceClient();
  const { data: t } = await db.from("threads").select("*").eq("id", threadId).maybeSingle();
  if (!t || (t.user_a !== viewerId && t.user_b !== viewerId)) return null;
  const oid = otherId(t as ThreadRecord, viewerId);
  const { data: u } = await db
    .from("users")
    .select("id, username, display_name, avatar_url")
    .eq("id", oid)
    .maybeSingle();
  const { data: msgs } = await db
    .from("messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  const list = (msgs ?? []) as MessageRecord[];
  return {
    thread: {
      id: t.id,
      other: u ? cardOf(u) : emptyCard(oid),
      state: t.state,
      lastMessageAt: t.last_message_at,
      lastMessagePreview: list[list.length - 1]?.body ?? null,
      unread: 0,
      initiatedByMe: t.initiated_by === viewerId,
    },
    messages: list.map((m) => toMessageView(m, viewerId)),
  };
}

function toMessageView(m: MessageRecord, viewerId: string): MessageView {
  const rx = store.messageReactions.filter((r) => r.message_id === m.id);
  const byEmoji = new Map<string, { count: number; mine: boolean }>();
  for (const r of rx) {
    const cur = byEmoji.get(r.emoji) ?? { count: 0, mine: false };
    cur.count += 1;
    if (r.user_id === viewerId) cur.mine = true;
    byEmoji.set(r.emoji, cur);
  }
  return {
    id: m.id,
    threadId: m.thread_id,
    senderId: m.sender_id,
    mine: m.sender_id === viewerId,
    body: m.body,
    createdAt: m.created_at,
    readAt: m.read_at,
    reactions: [...byEmoji.entries()].map(([emoji, v]) => ({ emoji, count: v.count, mine: v.mine })),
  };
}

type RawUser = { id: string; username: string; display_name: string; avatar_url: string | null };
function cardOf(u: RawUser): PersonCard {
  return {
    id: u.id,
    username: u.username,
    displayName: u.display_name,
    avatarUrl: u.avatar_url,
    headline: null,
    values: [],
    lastActiveAt: null,
  };
}
function emptyCard(id: string): PersonCard {
  return { id, username: "user", displayName: "User", avatarUrl: null, headline: null, values: [], lastActiveAt: null };
}
