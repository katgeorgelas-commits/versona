"use server";

import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { isOfflineDemo } from "@/lib/dev/offline";
import { store, nextId, nowIso } from "@/lib/dev/offline-store";

const FeedbackSchema = z.object({
  category: z.enum(["feature", "bug", "idea", "other"]),
  subject: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(2000),
});

export async function submitFeedback(input: z.infer<typeof FeedbackSchema>) {
  const user = await getSessionUser();
  if (!user) return { ok: false as const, error: "unauthenticated" };
  const parsed = FeedbackSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid" };
  const d = parsed.data;

  if (isOfflineDemo()) {
    store.notifications.push({
      id: nextId("notif"),
      recipient_id: "user-admin",
      type: "system",
      actor_id: user.id,
      summary: `[${d.category}] ${d.subject}`,
      entity_type: null,
      entity_id: null,
      created_at: nowIso(),
      read_at: null,
    });
    return { ok: true as const };
  }

  return { ok: true as const };
}
