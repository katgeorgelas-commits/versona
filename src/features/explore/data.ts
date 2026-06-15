import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { isOfflineDemo, OFFLINE_USERS } from "@/lib/dev/offline";
import { store } from "@/lib/dev/offline-store";
import { offlinePersonCard } from "@/features/profile/data";
import { offlineBuildPost } from "@/features/feed/data";
import type { PersonCard, PostView, MissionSummary } from "@/types/views";

export type SearchResults = {
  people: PersonCard[];
  missions: (MissionSummary & { brief: string; memberCount: number })[];
  posts: PostView[];
  topics: { tag: string; count: number }[];
};

export type Trending = {
  topics: { tag: string; count: number }[];
  posts: PostView[];
};

function topicCounts(): { tag: string; count: number }[] {
  const map = new Map<string, number>();
  for (const p of store.posts) for (const t of p.topics) map.set(t, (map.get(t) ?? 0) + 1);
  return [...map.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

export async function searchAll(q: string, viewerId: string): Promise<SearchResults> {
  const query = q.trim().toLowerCase();
  if (isOfflineDemo()) {
    if (!query) return { people: [], missions: [], posts: [], topics: [] };
    const people = Object.values(OFFLINE_USERS)
      .map((u) => offlinePersonCard(u.id)!)
      .filter(
        (c) =>
          c.displayName.toLowerCase().includes(query) ||
          c.username.toLowerCase().includes(query) ||
          (c.headline ?? "").toLowerCase().includes(query),
      );
    const missions = store.missions
      .filter((m) => m.name.toLowerCase().includes(query) || m.brief.toLowerCase().includes(query))
      .map((m) => ({
        id: m.id, slug: m.slug, name: m.name, accentColor: m.accent_color, icon: m.icon, kind: m.kind,
        brief: m.brief, memberCount: store.memberships.filter((x) => x.mission_id === m.id).length,
      }));
    const posts = store.posts
      .filter((p) => p.body_text.toLowerCase().includes(query) || p.topics.some((t) => t.includes(query)))
      .map((p) => offlineBuildPost(p, viewerId));
    const topics = topicCounts().filter((t) => t.tag.toLowerCase().includes(query));
    return { people, missions, posts, topics };
  }

  const db = createServiceClient();
  const [{ data: users }, { data: missions }, { data: posts }] = await Promise.all([
    db.from("users").select("id, username, display_name, avatar_url").or(`display_name.ilike.%${query}%,username.ilike.%${query}%`).limit(10),
    db.from("missions").select("id, slug, name, brief, accent_color, icon, member_count").ilike("name", `%${query}%`).limit(10),
    db.from("posts").select("id").ilike("body_text", `%${query}%`).limit(10),
  ]);
  return {
    people: (users ?? []).map((u) => ({ id: u.id, username: u.username, displayName: u.display_name, avatarUrl: u.avatar_url, headline: null, values: [], lastActiveAt: null })),
    missions: (missions ?? []).map((m) => ({ id: m.id, slug: m.slug, name: m.name, accentColor: m.accent_color, icon: m.icon, kind: "mission" as const, brief: m.brief, memberCount: m.member_count })),
    posts: [],
    topics: [],
  };
}

export async function getTrending(viewerId: string): Promise<Trending> {
  if (isOfflineDemo()) {
    const posts = store.posts
      .map((p) => offlineBuildPost(p, viewerId))
      .sort((a, b) => b.reactions.total + b.replyCount - (a.reactions.total + a.replyCount))
      .slice(0, 8);
    return { topics: topicCounts().slice(0, 12), posts };
  }
  return { topics: [], posts: [] };
}

export async function getTopicPosts(tag: string, viewerId: string): Promise<PostView[]> {
  const t = tag.toLowerCase();
  if (isOfflineDemo()) {
    return store.posts
      .filter((p) => p.topics.some((x) => x.toLowerCase() === t))
      .map((p) => offlineBuildPost(p, viewerId))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
  const db = createServiceClient();
  const { data } = await db.from("posts").select("id").contains("topics", [tag]).limit(50);
  void data;
  return [];
}
