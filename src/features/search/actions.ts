"use server";

import { getSessionUser } from "@/lib/auth/session";
import { isOfflineDemo, OFFLINE_USERS } from "@/lib/dev/offline";
import { store } from "@/lib/dev/offline-store";
import { createServiceClient } from "@/lib/supabase/server";

export type SuggestionItem =
  | { kind: "person"; username: string; displayName: string; avatarUrl: string | null }
  | { kind: "space"; slug: string; name: string; spaceKind: "mission" | "circle"; icon: string }
  | { kind: "topic"; tag: string; count: number };

export async function searchSuggestions(raw: string): Promise<SuggestionItem[]> {
  const user = await getSessionUser();
  if (!user) return [];
  const q = raw.trim().toLowerCase();
  if (!q) return [];

  if (isOfflineDemo()) {
    const results: SuggestionItem[] = [];

    const isPeopleTrigger = q.startsWith("@");
    const term = isPeopleTrigger ? q.slice(1) : q;

    if (!term) return [];

    const people = Object.values(OFFLINE_USERS)
      .filter(
        (u) =>
          u.id !== user.id &&
          (u.username.toLowerCase().includes(term) || u.displayName.toLowerCase().includes(term)),
      )
      .slice(0, isPeopleTrigger ? 6 : 3)
      .map((u): SuggestionItem => ({ kind: "person", username: u.username, displayName: u.displayName, avatarUrl: u.avatarUrl }));
    results.push(...people);

    if (!isPeopleTrigger) {
      const spaces = store.missions
        .filter((m) => m.name.toLowerCase().includes(term) || m.slug.toLowerCase().includes(term))
        .slice(0, 3)
        .map((m): SuggestionItem => ({ kind: "space", slug: m.slug, name: m.name, spaceKind: m.kind, icon: m.icon }));
      results.push(...spaces);

      const tagMap = new Map<string, number>();
      for (const p of store.posts) for (const t of p.topics) tagMap.set(t, (tagMap.get(t) ?? 0) + 1);
      const topics = [...tagMap.entries()]
        .filter(([tag]) => tag.toLowerCase().includes(term))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([tag, count]): SuggestionItem => ({ kind: "topic", tag, count }));
      results.push(...topics);
    }

    return results;
  }

  const db = createServiceClient();
  const results: SuggestionItem[] = [];
  const isPeopleTrigger = q.startsWith("@");
  const term = isPeopleTrigger ? q.slice(1) : q;
  if (!term) return [];

  const { data: users } = await db
    .from("users")
    .select("username, display_name, avatar_url")
    .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
    .neq("id", user.id)
    .limit(isPeopleTrigger ? 6 : 3);
  for (const u of users ?? []) {
    results.push({ kind: "person", username: u.username, displayName: u.display_name, avatarUrl: u.avatar_url });
  }

  if (!isPeopleTrigger) {
    const { data: missions } = await db
      .from("missions")
      .select("slug, name, icon")
      .ilike("name", `%${term}%`)
      .limit(3);
    for (const m of missions ?? []) {
      results.push({ kind: "space", slug: m.slug, name: m.name, spaceKind: "mission", icon: m.icon });
    }
  }

  return results;
}
