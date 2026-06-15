"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/server";
import { isOfflineDemo } from "@/lib/dev/offline";
import { store, nextId, nowIso, ensureThread } from "@/lib/dev/offline-store";

/** Accept or decline an incoming connection request (PRD §3.5). */
export async function respondConnection(connectionId: string, accept: boolean) {
  const user = await getSessionUser();
  if (!user) return { ok: false as const };

  if (isOfflineDemo()) {
    const c = store.connections.find((x) => x.id === connectionId);
    if (!c || c.recipient_id !== user.id) return { ok: false as const };
    c.status = accept ? "accepted" : "declined";
    if (accept) {
      // Notify the requester + open a thread.
      store.notifications.push({
        id: nextId("notif"),
        recipient_id: c.requester_id,
        type: "connection_accepted",
        actor_id: user.id,
        summary: `${user.displayName} accepted your connection`,
        entity_type: "connection",
        entity_id: c.id,
        created_at: nowIso(),
        read_at: null,
      });
      ensureThread(c.requester_id, user.id, user.id, "accepted");
    }
    revalidatePath("/connections");
    revalidatePath("/notifications");
    return { ok: true as const, accepted: accept };
  }

  const db = createServiceClient();
  const { data: c } = await db.from("connections").select("*").eq("id", connectionId).maybeSingle();
  if (!c || c.recipient_id !== user.id) return { ok: false as const };
  await db
    .from("connections")
    .update({ status: accept ? "accepted" : "declined", responded_at: new Date().toISOString() })
    .eq("id", connectionId);
  if (accept) {
    await db.from("notifications").insert({
      recipient_id: c.requester_id,
      type: "connection_accepted",
      actor_id: user.id,
      summary: `${user.displayName} accepted your connection`,
      entity_type: "connection",
      entity_id: c.id,
    });
  }
  revalidatePath("/connections");
  revalidatePath("/notifications");
  return { ok: true as const, accepted: accept };
}
