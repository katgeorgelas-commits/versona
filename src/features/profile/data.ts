import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { isOfflineDemo, OFFLINE_USERS, offlineIsActiveNow } from "@/lib/dev/offline";
import { store } from "@/lib/dev/offline-store";
import type { PersonCard, ProfileView, MissionSummary } from "@/types/views";
import type { PostType } from "@/types/app";
import { PROMPTS_BY_ID } from "@/config/prompts";

export type ContributionItem = {
  id: string;
  type: PostType;
  bodyText: string;
  missionName: string | null;
  createdAt: string;
  replyCount: number;
  reactionCount: number;
};

/** Build a PersonCard from the offline store. */
export function offlinePersonCard(userId: string): PersonCard | null {
  const u = Object.values(OFFLINE_USERS).find((x) => x.id === userId);
  if (!u) return null;
  const p = store.profiles.find((x) => x.user_id === userId);
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    headline: p?.headline ?? null,
    values: p?.values ?? [],
    lastActiveAt: null,
    online: offlineIsActiveNow(u.id),
  };
}

function offlineMissionsFor(userId: string): MissionSummary[] {
  return store.memberships
    .filter((m) => m.user_id === userId)
    .map((m) => store.missions.find((x) => x.id === m.mission_id))
    .filter(Boolean)
    .map((m) => ({
      id: m!.id,
      slug: m!.slug,
      name: m!.name,
      accentColor: m!.accent_color,
      icon: m!.icon,
      kind: m!.kind,
    }));
}

function offlineConnectionStatus(viewerId: string, targetId: string): ProfileView["connectionStatus"] {
  if (viewerId === targetId) return "none";
  const c = store.connections.find(
    (x) =>
      (x.requester_id === viewerId && x.recipient_id === targetId) ||
      (x.requester_id === targetId && x.recipient_id === viewerId),
  );
  if (!c) return "none";
  if (c.status === "accepted") return "connected";
  if (c.status === "pending") return c.recipient_id === viewerId ? "incoming" : "pending";
  return "none";
}

export async function getProfileView(
  username: string,
  viewerId: string,
): Promise<ProfileView | null> {
  if (isOfflineDemo()) {
    const u = OFFLINE_USERS[username];
    if (!u) return null;
    const p = store.profiles.find((x) => x.user_id === u.id);

    const endorsements: Record<string, number> = {};
    const endorsedByMe: string[] = [];
    for (const e of store.endorsements) {
      if (e.user_id !== u.id) continue;
      endorsements[e.skill] = (endorsements[e.skill] ?? 0) + 1;
      if (e.endorser_id === viewerId) endorsedByMe.push(e.skill);
    }
    const myPosts = new Set(store.posts.filter((x) => x.author_id === u.id).map((x) => x.id));
    const reputation = store.reactions.filter((r) => myPosts.has(r.post_id)).length;
    const connectedOf = (id: string) =>
      new Set(
        store.connections
          .filter((c) => c.status === "accepted" && (c.requester_id === id || c.recipient_id === id))
          .map((c) => (c.requester_id === id ? c.recipient_id : c.requester_id)),
      );
    const mine = connectedOf(viewerId);
    const theirs = connectedOf(u.id);
    const mutuals = [...mine].filter((x) => theirs.has(x) && x !== viewerId && x !== u.id).length;

    return {
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      headline: p?.headline ?? null,
      headlineTemplate: p?.headline_template ?? null,
      identitySnapshot: p?.identity_snapshot ?? null,
      values: p?.values ?? [],
      workStyle: p?.work_style ?? [],
      skills: p?.skills ?? [],
      currentFocus: p?.current_focus ?? null,
      currentStruggle: p?.current_struggle ?? null,
      ambitions: p?.ambitions ?? null,
      links: p?.links ?? [],
      completeness: p?.completeness ?? 0,
      careerIdentityScore: p?.career_identity_score ?? null,
      location: p?.location ?? null,
      industry: p?.industry ?? null,
      prompts: (p?.prompts ?? []).map((x) => ({ id: x.id, question: PROMPTS_BY_ID[x.id] ?? x.id, answer: x.answer })),
      experience: p?.experience ?? [],
      certifications: p?.certifications ?? [],
      signature: p?.signature ?? null,
      missions: offlineMissionsFor(u.id),
      followerCount: store.follows.filter((f) => f.following_id === u.id).length,
      followingCount: store.follows.filter((f) => f.follower_id === u.id).length,
      postCount: store.posts.filter((x) => x.author_id === u.id).length,
      endorsements,
      endorsedByMe,
      reputation,
      mutuals,
      isSelf: viewerId === u.id,
      isFollowing: store.follows.some(
        (f) => f.follower_id === viewerId && f.following_id === u.id,
      ),
      connectionStatus: offlineConnectionStatus(viewerId, u.id),
    };
  }

  // ── Supabase path ────────────────────────────────────────────────────────
  const db = createServiceClient();
  const { data: u } = await db
    .from("users")
    .select("id, username, display_name, avatar_url")
    .eq("username", username)
    .maybeSingle();
  if (!u) return null;

  const [{ data: p }, { data: mems }, followers, following, posts, conn, follow] =
    await Promise.all([
      db.from("profiles").select("*").eq("user_id", u.id).maybeSingle(),
      db
        .from("mission_members")
        .select("missions(id, slug, name, accent_color, icon)")
        .eq("user_id", u.id),
      db.from("follows").select("*", { count: "exact", head: true }).eq("following_id", u.id),
      db.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", u.id),
      db.from("posts").select("*", { count: "exact", head: true }).eq("author_id", u.id).eq("is_removed", false),
      db
        .from("connections")
        .select("*")
        .or(`and(requester_id.eq.${viewerId},recipient_id.eq.${u.id}),and(requester_id.eq.${u.id},recipient_id.eq.${viewerId})`)
        .maybeSingle(),
      db.from("follows").select("*").eq("follower_id", viewerId).eq("following_id", u.id).maybeSingle(),
    ]);

  let connectionStatus: ProfileView["connectionStatus"] = "none";
  if (conn.data) {
    if (conn.data.status === "accepted") connectionStatus = "connected";
    else if (conn.data.status === "pending")
      connectionStatus = conn.data.recipient_id === viewerId ? "incoming" : "pending";
  }

  type MemRow = {
    missions: { id: string; slug: string; name: string; accent_color: string; icon: string } | null;
  };
  const missions: MissionSummary[] = ((mems ?? []) as unknown as MemRow[])
    .map((row) => row.missions)
    .filter((m): m is NonNullable<MemRow["missions"]> => !!m)
    .map((m) => ({ id: m.id, slug: m.slug, name: m.name, accentColor: m.accent_color, icon: m.icon, kind: "mission" as const }));

  return {
    id: u.id,
    username: u.username,
    displayName: u.display_name,
    avatarUrl: u.avatar_url,
    headline: p?.headline ?? null,
    headlineTemplate: p?.headline_template ?? null,
    identitySnapshot: p?.identity_snapshot ?? null,
    values: p?.values ?? [],
    workStyle: p?.work_style ?? [],
    skills: p?.skills ?? [],
    currentFocus: p?.current_focus ?? null,
    currentStruggle: p?.current_struggle ?? null,
    ambitions: p?.ambitions ?? null,
    links: (p?.links as { label: string; url: string }[]) ?? [],
    completeness: p?.completeness ?? 0,
    careerIdentityScore: p?.career_identity_score ?? null,
    location: null,
    industry: null,
    prompts: [],
    experience: [],
    certifications: [],
    signature: null,
    missions,
    followerCount: followers.count ?? 0,
    followingCount: following.count ?? 0,
    postCount: posts.count ?? 0,
    endorsements: {},
    endorsedByMe: [],
    reputation: 0,
    mutuals: 0,
    isSelf: viewerId === u.id,
    isFollowing: !!follow.data,
    connectionStatus,
  };
}

export async function getUserContributions(userId: string): Promise<ContributionItem[]> {
  if (isOfflineDemo()) {
    return store.posts
      .filter((p) => p.author_id === userId)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .map((p) => ({
        id: p.id,
        type: p.type,
        bodyText: p.body_text,
        missionName: store.missions.find((m) => m.id === p.mission_id)?.name ?? null,
        createdAt: p.created_at,
        replyCount: store.replies.filter((r) => r.post_id === p.id).length,
        reactionCount: store.reactions.filter((r) => r.post_id === p.id).length,
      }));
  }

  const db = createServiceClient();
  const { data } = await db
    .from("posts")
    .select("id, type, body_text, created_at, reply_count, reaction_count, missions(name)")
    .eq("author_id", userId)
    .eq("is_removed", false)
    .order("created_at", { ascending: false })
    .limit(20);
  type Row = {
    id: string;
    type: PostType;
    body_text: string;
    created_at: string;
    reply_count: number;
    reaction_count: number;
    missions: { name: string } | null;
  };
  return ((data ?? []) as unknown as Row[]).map((p) => ({
    id: p.id,
    type: p.type,
    bodyText: p.body_text,
    missionName: p.missions?.name ?? null,
    createdAt: p.created_at,
    replyCount: p.reply_count,
    reactionCount: p.reaction_count,
  }));
}

export async function getFollowList(
  username: string,
  kind: "followers" | "following",
  viewerId: string,
): Promise<{ displayName: string; people: PersonCard[] } | null> {
  if (isOfflineDemo()) {
    const u = OFFLINE_USERS[username];
    if (!u) return null;
    const ids =
      kind === "followers"
        ? store.follows.filter((f) => f.following_id === u.id).map((f) => f.follower_id)
        : store.follows.filter((f) => f.follower_id === u.id).map((f) => f.following_id);
    const people = ids.map((id) => offlinePersonCard(id)).filter((c): c is PersonCard => !!c);
    void viewerId;
    return { displayName: u.displayName, people };
  }
  const db = createServiceClient();
  const { data: u } = await db.from("users").select("id, display_name").eq("username", username).maybeSingle();
  if (!u) return null;
  const col = kind === "followers" ? "following_id" : "follower_id";
  const sel = kind === "followers" ? "follower_id" : "following_id";
  const { data } = await db.from("follows").select(sel).eq(col, u.id);
  const ids = ((data ?? []) as Record<string, string>[]).map((r) => r[sel]);
  const people: PersonCard[] = [];
  if (ids.length) {
    const { data: users } = await db.from("users").select("id, username, display_name, avatar_url").in("id", ids);
    for (const x of users ?? []) {
      people.push({ id: x.id, username: x.username, displayName: x.display_name, avatarUrl: x.avatar_url, headline: null, values: [], lastActiveAt: null });
    }
  }
  return { displayName: u.display_name, people };
}
