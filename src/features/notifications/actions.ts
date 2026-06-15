"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/server";
import { isOfflineDemo } from "@/lib/dev/offline";
import { store, nowIso } from "@/lib/dev/offline-store";

export async function markAllRead() {
  const user = await getSessionUser();
  if (!user) return { ok: false as const };
  if (isOfflineDemo()) {
    for (const n of store.notifications) {
      if (n.recipient_id === user.id && !n.read_at) n.read_at = nowIso();
    }
    revalidatePath("/notifications");
    return { ok: true as const };
  }
  const db = createServiceClient();
  await db
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", user.id)
    .is("read_at", null);
  revalidatePath("/notifications");
  return { ok: true as const };
}

export async function markRead(notificationId: string) {
  const user = await getSessionUser();
  if (!user) return { ok: false as const };
  if (isOfflineDemo()) {
    const n = store.notifications.find((x) => x.id === notificationId && x.recipient_id === user.id);
    if (n && !n.read_at) n.read_at = nowIso();
    return { ok: true as const };
  }
  const db = createServiceClient();
  await db
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("recipient_id", user.id);
  return { ok: true as const };
}
