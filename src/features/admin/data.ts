import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { isOfflineDemo, OFFLINE_USERS } from "@/lib/dev/offline";
import { store } from "@/lib/dev/offline-store";

export type AdminStats = {
  users: number;
  posts: number;
  missions: number;
  connections: number;
  messages: number;
  postsToday: number;
};

export type AdminUserRow = {
  id: string;
  username: string;
  displayName: string;
  isAdmin: boolean;
  postCount: number;
};

export type AdminPostRow = {
  id: string;
  author: string;
  bodyText: string;
  missionName: string | null;
  aiFlagged: boolean;
  createdAt: string;
};

export type AdminMissionRow = {
  id: string;
  slug: string;
  name: string;
  memberCount: number;
  weeklyPrompt: string | null;
};

function within24h(iso: string) {
  return Date.now() - new Date(iso).getTime() < 24 * 60 * 60 * 1000;
}

export async function getAdminStats(): Promise<AdminStats> {
  if (isOfflineDemo()) {
    return {
      users: Object.keys(OFFLINE_USERS).length,
      posts: store.posts.length,
      missions: store.missions.length,
      connections: store.connections.filter((c) => c.status === "accepted").length,
      messages: store.messages.length,
      postsToday: store.posts.filter((p) => within24h(p.created_at)).length,
    };
  }
  const db = createServiceClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [users, posts, missions, connections, messages, postsToday] = await Promise.all([
    db.from("users").select("*", { count: "exact", head: true }),
    db.from("posts").select("*", { count: "exact", head: true }).eq("is_removed", false),
    db.from("missions").select("*", { count: "exact", head: true }),
    db.from("connections").select("*", { count: "exact", head: true }).eq("status", "accepted"),
    db.from("messages").select("*", { count: "exact", head: true }),
    db.from("posts").select("*", { count: "exact", head: true }).gte("created_at", since),
  ]);
  return {
    users: users.count ?? 0,
    posts: posts.count ?? 0,
    missions: missions.count ?? 0,
    connections: connections.count ?? 0,
    messages: messages.count ?? 0,
    postsToday: postsToday.count ?? 0,
  };
}

export async function listUsers(): Promise<AdminUserRow[]> {
  if (isOfflineDemo()) {
    return Object.values(OFFLINE_USERS).map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      isAdmin: u.isAdmin,
      postCount: store.posts.filter((p) => p.author_id === u.id).length,
    }));
  }
  const db = createServiceClient();
  const { data } = await db
    .from("users")
    .select("id, username, display_name, is_admin")
    .order("created_at", { ascending: false })
    .limit(200);
  return (data ?? []).map((u) => ({
    id: u.id,
    username: u.username,
    displayName: u.display_name,
    isAdmin: u.is_admin,
    postCount: 0,
  }));
}

export async function listPosts(): Promise<AdminPostRow[]> {
  if (isOfflineDemo()) {
    return store.posts
      .slice()
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .map((p) => ({
        id: p.id,
        author:
          Object.values(OFFLINE_USERS).find((u) => u.id === p.author_id)?.displayName ?? "Unknown",
        bodyText: p.body_text,
        missionName: store.missions.find((m) => m.id === p.mission_id)?.name ?? null,
        aiFlagged: p.ai_flagged,
        createdAt: p.created_at,
      }));
  }
  const db = createServiceClient();
  const { data } = await db
    .from("posts")
    .select("id, body_text, ai_flagged, created_at, users:author_id(display_name), missions:mission_id(name)")
    .eq("is_removed", false)
    .order("created_at", { ascending: false })
    .limit(100);
  type Row = {
    id: string;
    body_text: string;
    ai_flagged: boolean;
    created_at: string;
    users: { display_name: string } | null;
    missions: { name: string } | null;
  };
  return ((data ?? []) as unknown as Row[]).map((p) => ({
    id: p.id,
    author: p.users?.display_name ?? "Unknown",
    bodyText: p.body_text,
    missionName: p.missions?.name ?? null,
    aiFlagged: p.ai_flagged,
    createdAt: p.created_at,
  }));
}

export async function listMissions(): Promise<AdminMissionRow[]> {
  if (isOfflineDemo()) {
    return store.missions
      .slice()
      .sort((a, b) => a.display_order - b.display_order)
      .map((m) => ({
        id: m.id,
        slug: m.slug,
        name: m.name,
        memberCount: store.memberships.filter((x) => x.mission_id === m.id).length,
        weeklyPrompt: store.weeklyPrompts.find((w) => w.mission_id === m.id)?.prompt ?? null,
      }));
  }
  const db = createServiceClient();
  const { data } = await db.from("missions").select("id, slug, name, member_count").order("display_order");
  const { data: prompts } = await db.from("weekly_prompts").select("mission_id, prompt").eq("is_active", true);
  return (data ?? []).map((m) => ({
    id: m.id,
    slug: m.slug,
    name: m.name,
    memberCount: m.member_count,
    weeklyPrompt: (prompts ?? []).find((p) => p.mission_id === m.id)?.prompt ?? null,
  }));
}

export type AdminRequestRow = {
  id: string;
  name: string;
  brief: string;
  kind: "mission" | "circle";
  requester: string;
  createdAt: string;
};

export async function listMissionRequests(): Promise<AdminRequestRow[]> {
  if (isOfflineDemo()) {
    return store.missionRequests
      .filter((r) => r.status === "pending")
      .map((r) => ({
        id: r.id,
        name: r.name,
        brief: r.brief,
        kind: r.kind,
        requester:
          Object.values(OFFLINE_USERS).find((u) => u.id === r.requester_id)?.displayName ?? "Member",
        createdAt: r.created_at,
      }));
  }
  return [];
}
