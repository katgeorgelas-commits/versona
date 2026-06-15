"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/server";
import { isOfflineDemo } from "@/lib/dev/offline";
import { store, nextId, nowIso } from "@/lib/dev/offline-store";

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || !user.isAdmin) return null;
  return user;
}

export async function removePost(postId: string) {
  if (!(await requireAdmin())) return { ok: false as const };
  if (isOfflineDemo()) {
    const i = store.posts.findIndex((p) => p.id === postId);
    if (i >= 0) store.posts.splice(i, 1);
    revalidatePath("/admin/posts");
    revalidatePath("/feed");
    return { ok: true as const };
  }
  const db = createServiceClient();
  await db.from("posts").update({ is_removed: true }).eq("id", postId);
  revalidatePath("/admin/posts");
  return { ok: true as const };
}

/** Set or override a mission's weekly prompt (PRD §6). */
export async function setWeeklyPrompt(missionSlug: string, prompt: string) {
  const admin = await requireAdmin();
  if (!admin) return { ok: false as const };
  const text = prompt.trim();
  if (!text) return { ok: false as const };

  if (isOfflineDemo()) {
    const m = store.missions.find((x) => x.slug === missionSlug);
    if (!m) return { ok: false as const };
    const existing = store.weeklyPrompts.find((w) => w.mission_id === m.id);
    if (existing) existing.prompt = text;
    else store.weeklyPrompts.push({ id: nextId("wp"), mission_id: m.id, prompt: text });
    revalidatePath("/admin/missions");
    revalidatePath(`/missions/${missionSlug}`);
    return { ok: true as const };
  }

  const db = createServiceClient();
  const { data: m } = await db.from("missions").select("id").eq("slug", missionSlug).maybeSingle();
  if (!m) return { ok: false as const };
  await db.from("weekly_prompts").update({ is_active: false }).eq("mission_id", m.id).eq("is_active", true);
  await db.from("weekly_prompts").insert({
    mission_id: m.id,
    prompt: text,
    source: "admin",
    created_by: admin.id,
    starts_at: nowIso(),
  });
  revalidatePath("/admin/missions");
  revalidatePath(`/missions/${missionSlug}`);
  return { ok: true as const };
}
