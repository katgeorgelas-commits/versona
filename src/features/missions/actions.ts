"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";
import { isOfflineDemo } from "@/lib/dev/offline";
import { store, nextId, nowIso } from "@/lib/dev/offline-store";

export async function setMembership(slug: string, join: boolean) {
  const user = await getSessionUser();
  if (!user) return { ok: false as const };

  if (isOfflineDemo()) {
    const m = store.missions.find((x) => x.slug === slug);
    if (!m) return { ok: false as const };
    const idx = store.memberships.findIndex(
      (x) => x.mission_id === m.id && x.user_id === user.id,
    );
    if (join && idx < 0) store.memberships.push({ mission_id: m.id, user_id: user.id });
    if (!join && idx >= 0) store.memberships.splice(idx, 1);
    revalidatePath("/missions");
    revalidatePath(`/missions/${slug}`);
    revalidatePath("/feed");
    return { ok: true as const, member: join };
  }

  const db = createServiceClient();
  const { data: m } = await db.from("missions").select("id").eq("slug", slug).maybeSingle();
  if (!m) return { ok: false as const };
  if (join) {
    await db.from("mission_members").upsert(
      { mission_id: m.id, user_id: user.id },
      { onConflict: "mission_id,user_id" },
    );
  } else {
    await db.from("mission_members").delete().eq("mission_id", m.id).eq("user_id", user.id);
  }
  revalidatePath("/missions");
  revalidatePath(`/missions/${slug}`);
  revalidatePath("/feed");
  return { ok: true as const, member: join };
}

const RequestSchema = z.object({
  name: z.string().trim().min(3).max(60),
  brief: z.string().trim().min(10).max(280),
  kind: z.enum(["mission", "circle"]).default("mission"),
});

/** Member requests a new mission/circle — Versona admin must approve. */
export async function requestMission(input: z.infer<typeof RequestSchema>) {
  const user = await getSessionUser();
  if (!user) return { ok: false as const, error: "unauthenticated" };
  const parsed = RequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid" };
  if (isOfflineDemo()) {
    store.missionRequests.unshift({
      id: nextId("mreq"),
      name: parsed.data.name,
      brief: parsed.data.brief,
      kind: parsed.data.kind,
      requester_id: user.id,
      status: "pending",
      created_at: nowIso(),
    });
    return { ok: true as const };
  }
  return { ok: true as const };
}

/** Admin: approve a mission request (creates the mission) or decline it. */
export async function resolveMissionRequest(requestId: string, approve: boolean) {
  const user = await getSessionUser();
  if (!user || !user.isAdmin) return { ok: false as const };
  if (isOfflineDemo()) {
    const req = store.missionRequests.find((r) => r.id === requestId);
    if (!req) return { ok: false as const };
    req.status = approve ? "approved" : "declined";
    if (approve) {
      const slug = req.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
      const order = store.missions.length + 1;
      store.missions.push({
        id: nextId("mission"),
        slug,
        name: req.name,
        brief: req.brief,
        accent_color: "#6d28d9",
        icon: "compass",
        display_order: order,
        kind: req.kind,
      });
      store.notifications.push({
        id: nextId("notif"),
        recipient_id: req.requester_id,
        type: "weekly_prompt",
        actor_id: user.id,
        summary: `Your ${req.kind} "${req.name}" was approved 🎉`,
        entity_type: "mission",
        entity_id: null,
        created_at: nowIso(),
        read_at: null,
      });
    }
    revalidatePath("/admin/requests");
    revalidatePath("/missions");
    return { ok: true as const, approved: approve };
  }
  return { ok: true as const, approved: approve };
}
