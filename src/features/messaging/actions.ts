"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/server";
import { isOfflineDemo } from "@/lib/dev/offline";
import { store, nextId, nowIso, ensureThread } from "@/lib/dev/offline-store";
import { getThread, getThreads } from "./data";
import { MESSAGE_REQUESTS_PER_DAY } from "@/lib/utils";

/** Load a thread + its messages for the docked chat (client-invoked). */
export async function loadThread(threadId: string) {
  const user = await getSessionUser();
  if (!user) return null;
  return getThread(threadId, user.id);
}

/** Refresh the dock's thread list. */
export async function loadThreads() {
  const user = await getSessionUser();
  if (!user) return [];
  return getThreads(user.id);
}

function offlineConnected(a: string, b: string) {
  return store.connections.some(
    (c) =>
      c.status === "accepted" &&
      ((c.requester_id === a && c.recipient_id === b) ||
        (c.requester_id === b && c.recipient_id === a)),
  );
}

const StartSchema = z.object({
  targetId: z.string(),
  body: z.string().trim().min(1).max(4000),
});

/**
 * Start (or continue) a conversation. Connected users get an accepted thread;
 * non-connections create a rate-limited message REQUEST the recipient must accept
 * (PRD §3.5 — max 5/day, no cold-outreach spam).
 */
export async function startConversation(input: z.infer<typeof StartSchema>) {
  const user = await getSessionUser();
  if (!user) return { ok: false as const, error: "unauthenticated" };
  const parsed = StartSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid" };
  const { targetId, body } = parsed.data;
  if (targetId === user.id) return { ok: false as const, error: "invalid" };

  if (isOfflineDemo()) {
    const connected = offlineConnected(user.id, targetId);
    if (!connected) {
      const todayRequests = store.threads.filter(
        (t) => t.initiated_by === user.id && t.state === "request",
      ).length;
      if (todayRequests >= MESSAGE_REQUESTS_PER_DAY) {
        return { ok: false as const, error: "rate_limited" };
      }
    }
    const t = ensureThread(user.id, targetId, user.id, connected ? "accepted" : "request");
    store.messages.push({
      id: nextId("msg"),
      thread_id: t.id,
      sender_id: user.id,
      body,
      created_at: nowIso(),
      read_at: null,
    });
    t.last_message_at = nowIso();
    store.notifications.push({
      id: nextId("notif"),
      recipient_id: targetId,
      type: "message",
      actor_id: user.id,
      summary: connected
        ? `New message from ${user.displayName}`
        : `${user.displayName} sent you a message request`,
      entity_type: "thread",
      entity_id: t.id,
      created_at: nowIso(),
      read_at: null,
    });
    revalidatePath("/messages");
    return { ok: true as const, threadId: t.id };
  }

  const db = createServiceClient();
  const { data: connected } = await db.rpc("are_connected", { a: user.id, b: targetId });
  if (!connected) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await db
      .from("message_request_log")
      .select("*", { count: "exact", head: true })
      .eq("sender_id", user.id)
      .gte("created_at", since);
    if ((count ?? 0) >= MESSAGE_REQUESTS_PER_DAY) {
      return { ok: false as const, error: "rate_limited" };
    }
    await db.from("message_request_log").insert({ sender_id: user.id, recipient_id: targetId });
  }

  const [ua, ub] = user.id < targetId ? [user.id, targetId] : [targetId, user.id];
  const { data: t } = await db
    .from("threads")
    .upsert(
      { user_a: ua, user_b: ub, initiated_by: user.id, state: connected ? "accepted" : "request" },
      { onConflict: "user_a,user_b" },
    )
    .select("id")
    .single();
  if (!t) return { ok: false as const, error: "save_failed" };
  await db.from("messages").insert({ thread_id: t.id, sender_id: user.id, body });
  await db.from("notifications").insert({
    recipient_id: targetId,
    type: "message",
    actor_id: user.id,
    summary: connected ? `New message from ${user.displayName}` : `${user.displayName} sent you a message request`,
    entity_type: "thread",
    entity_id: t.id,
  });
  revalidatePath("/messages");
  return { ok: true as const, threadId: t.id };
}

export async function sendMessage(threadId: string, body: string) {
  const user = await getSessionUser();
  if (!user) return { ok: false as const };
  const text = body.trim();
  if (!text || text.length > 4000) return { ok: false as const };

  if (isOfflineDemo()) {
    const t = store.threads.find((x) => x.id === threadId);
    if (!t || (t.user_a !== user.id && t.user_b !== user.id)) return { ok: false as const };
    store.messages.push({
      id: nextId("msg"),
      thread_id: threadId,
      sender_id: user.id,
      body: text,
      created_at: nowIso(),
      read_at: null,
    });
    t.last_message_at = nowIso();
    const recipient = t.user_a === user.id ? t.user_b : t.user_a;
    store.notifications.push({
      id: nextId("notif"),
      recipient_id: recipient,
      type: "message",
      actor_id: user.id,
      summary: `New message from ${user.displayName}`,
      entity_type: "thread",
      entity_id: threadId,
      created_at: nowIso(),
      read_at: null,
    });
    revalidatePath("/messages");
    revalidatePath(`/messages/${threadId}`);
    return { ok: true as const };
  }

  const db = createServiceClient();
  const { data: t } = await db.from("threads").select("*").eq("id", threadId).maybeSingle();
  if (!t || (t.user_a !== user.id && t.user_b !== user.id)) return { ok: false as const };
  await db.from("messages").insert({ thread_id: threadId, sender_id: user.id, body: text });
  revalidatePath(`/messages/${threadId}`);
  return { ok: true as const };
}

export async function acceptThread(threadId: string) {
  const user = await getSessionUser();
  if (!user) return { ok: false as const };
  if (isOfflineDemo()) {
    const t = store.threads.find((x) => x.id === threadId);
    if (t && (t.user_a === user.id || t.user_b === user.id)) t.state = "accepted";
    revalidatePath(`/messages/${threadId}`);
    return { ok: true as const };
  }
  const db = createServiceClient();
  await db.from("threads").update({ state: "accepted" }).eq("id", threadId);
  revalidatePath(`/messages/${threadId}`);
  return { ok: true as const };
}

/** React to a message with an emoji (toggle). */
export async function toggleMessageReaction(messageId: string, emoji: string) {
  const user = await getSessionUser();
  if (!user) return { ok: false as const };
  if (isOfflineDemo()) {
    const i = store.messageReactions.findIndex(
      (r) => r.message_id === messageId && r.user_id === user.id && r.emoji === emoji,
    );
    if (i >= 0) store.messageReactions.splice(i, 1);
    else store.messageReactions.push({ message_id: messageId, user_id: user.id, emoji });
    return { ok: true as const, active: i < 0 };
  }
  return { ok: true as const };
}

export async function markThreadRead(threadId: string) {
  const user = await getSessionUser();
  if (!user) return { ok: false as const };
  if (isOfflineDemo()) {
    for (const m of store.messages) {
      if (m.thread_id === threadId && m.sender_id !== user.id && !m.read_at) m.read_at = nowIso();
    }
    return { ok: true as const };
  }
  const db = createServiceClient();
  await db
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("thread_id", threadId)
    .neq("sender_id", user.id)
    .is("read_at", null);
  return { ok: true as const };
}
