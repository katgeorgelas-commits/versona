"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { isOfflineDemo } from "@/lib/dev/offline";
import { store, nextId, nowIso } from "@/lib/dev/offline-store";

/** Post an ephemeral moment (Stories-style). */
export async function createMoment(text: string) {
  const user = await getSessionUser();
  if (!user) return { ok: false as const };
  const body = text.trim();
  if (!body || body.length > 140) return { ok: false as const };
  if (isOfflineDemo()) {
    store.moments.unshift({ id: nextId("moment"), author_id: user.id, text: body, created_at: nowIso() });
    revalidatePath("/feed");
    return { ok: true as const };
  }
  return { ok: true as const };
}
