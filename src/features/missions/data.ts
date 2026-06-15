import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { isOfflineDemo } from "@/lib/dev/offline";
import { store } from "@/lib/dev/offline-store";
import type { MissionView } from "@/types/views";

function offlineView(missionId: string, viewerId: string): MissionView | null {
  const m = store.missions.find((x) => x.id === missionId);
  if (!m) return null;
  const prompt = store.weeklyPrompts.find((w) => w.mission_id === m.id);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  return {
    id: m.id,
    slug: m.slug,
    name: m.name,
    brief: m.brief,
    accentColor: m.accent_color,
    icon: m.icon,
    kind: m.kind,
    memberCount: store.memberships.filter((x) => x.mission_id === m.id).length,
    isMember: store.memberships.some((x) => x.mission_id === m.id && x.user_id === viewerId),
    weeklyPrompt: prompt?.prompt ?? null,
    weeklyPromptId: prompt?.id ?? null,
    newThisWeek: store.posts.filter((p) => p.mission_id === m.id && p.created_at >= weekAgo).length,
  };
}

export async function getMissions(viewerId: string): Promise<MissionView[]> {
  if (isOfflineDemo()) {
    return store.missions
      .slice()
      .sort((a, b) => a.display_order - b.display_order)
      .map((m) => offlineView(m.id, viewerId)!)
      .filter(Boolean);
  }
  const db = createServiceClient();
  const [{ data: missions }, { data: mems }, { data: prompts }] = await Promise.all([
    db.from("missions").select("*").eq("is_active", true).order("display_order"),
    db.from("mission_members").select("mission_id").eq("user_id", viewerId),
    db.from("weekly_prompts").select("id, mission_id, prompt").eq("is_active", true),
  ]);
  const myset = new Set((mems ?? []).map((m) => m.mission_id));
  return (missions ?? []).map((m) => {
    const p = (prompts ?? []).find((w) => w.mission_id === m.id);
    return {
      id: m.id,
      slug: m.slug,
      name: m.name,
      brief: m.brief,
      accentColor: m.accent_color,
      icon: m.icon,
      kind: "mission",
      memberCount: m.member_count,
      isMember: myset.has(m.id),
      weeklyPrompt: p?.prompt ?? null,
      weeklyPromptId: p?.id ?? null,
      newThisWeek: 0,
    };
  });
}

export async function getMission(
  slug: string,
  viewerId: string,
): Promise<MissionView | null> {
  if (isOfflineDemo()) {
    const m = store.missions.find((x) => x.slug === slug);
    return m ? offlineView(m.id, viewerId) : null;
  }
  const db = createServiceClient();
  const { data: m } = await db.from("missions").select("*").eq("slug", slug).maybeSingle();
  if (!m) return null;
  const [{ data: mem }, { data: prompt }] = await Promise.all([
    db.from("mission_members").select("user_id").eq("mission_id", m.id).eq("user_id", viewerId).maybeSingle(),
    db.from("weekly_prompts").select("id, prompt").eq("mission_id", m.id).eq("is_active", true).maybeSingle(),
  ]);
  return {
    id: m.id,
    slug: m.slug,
    name: m.name,
    brief: m.brief,
    accentColor: m.accent_color,
    icon: m.icon,
    kind: "mission",
    memberCount: m.member_count,
    isMember: !!mem,
    weeklyPrompt: prompt?.prompt ?? null,
    weeklyPromptId: prompt?.id ?? null,
    newThisWeek: 0,
  };
}
