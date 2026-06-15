import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { isOfflineDemo } from "@/lib/dev/offline";
import { store, type PostRecord } from "@/lib/dev/offline-store";
import { offlinePersonCard } from "@/features/profile/data";
import type { PostView, ReplyView, MissionSummary } from "@/types/views";
import type { ReactionKind } from "@/types/app";

/** Strictly chronological — most recent first. */
function feedSort(a: { createdAt: string }, b: { createdAt: string }) {
  return a.createdAt < b.createdAt ? 1 : -1;
}

function offlineMissionSummary(id: string | null): MissionSummary | null {
  if (!id) return null;
  const m = store.missions.find((x) => x.id === id);
  return m
    ? { id: m.id, slug: m.slug, name: m.name, accentColor: m.accent_color, icon: m.icon, kind: m.kind }
    : null;
}

export function offlineBuildPost(
  p: PostRecord,
  viewerId: string,
  depth = 0,
): PostView {
  const author = offlinePersonCard(p.author_id)!;
  const rx = store.reactions.filter((r) => r.post_id === p.id);
  const counts: Partial<Record<ReactionKind, number>> = {};
  for (const r of rx) counts[r.kind] = (counts[r.kind] ?? 0) + 1;
  const reactors = rx
    .slice(-3)
    .reverse()
    .map((r) => offlinePersonCard(r.user_id))
    .filter((c): c is NonNullable<typeof c> => !!c);

  // Poll
  let poll: PostView["poll"] = null;
  if (p.poll) {
    const tally: Record<string, number> = {};
    for (const v of Object.values(p.poll.votes)) tally[v] = (tally[v] ?? 0) + 1;
    poll = {
      options: p.poll.options.map((o) => ({ id: o.id, text: o.text, votes: tally[o.id] ?? 0 })),
      totalVotes: Object.keys(p.poll.votes).length,
      myVote: p.poll.votes[viewerId] ?? null,
    };
  }

  // Repost (one level deep only)
  let repostOf: PostView | null = null;
  if (p.repost_of && depth === 0) {
    const orig = store.posts.find((x) => x.id === p.repost_of);
    if (orig) repostOf = offlineBuildPost(orig, viewerId, 1);
  }

  const authorProfile = store.profiles.find((x) => x.user_id === p.author_id);
  return {
    id: p.id,
    type: p.type,
    author,
    authorLocation: authorProfile?.location ?? null,
    authorIndustry: authorProfile?.industry ?? null,
    bodyHtml: p.body_html || inlineToHtml(p.body_text),
    bodyText: p.body_text,
    mission: offlineMissionSummary(p.mission_id),
    missionIsMember: p.mission_id
      ? store.memberships.some((m) => m.mission_id === p.mission_id && m.user_id === viewerId)
      : false,
    topics: p.topics,
    imageUrl: p.image_url,
    aiFlagged: p.ai_flagged,
    createdAt: p.created_at,
    replyCount: store.replies.filter((r) => r.post_id === p.id).length,
    reactions: {
      counts,
      mine: rx.filter((r) => r.user_id === viewerId).map((r) => r.kind),
      total: rx.length,
      reactors,
    },
    saved: store.saved.some((s) => s.user_id === viewerId && s.post_id === p.id),
    isPromptResponse: !!p.weekly_prompt_id || p.type === "prompt_response",
    promptText:
      !!p.weekly_prompt_id || p.type === "prompt_response" ? store.globalPrompt : null,
    isOwn: p.author_id === viewerId,
    edited: !!p.edited_at,
    poll,
    repostOf,
    repostCount: store.posts.filter((x) => x.repost_of === p.id).length,
  };
}

function escapeHtml(s: string) {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
}

function inlineToHtml(text: string) {
  const fmt = (s: string) =>
    escapeHtml(s)
      .replace(/(^|\s)@([a-z0-9_]{2,30})/gi, '$1<a href="/$2" class="font-medium text-accent hover:underline">@$2</a>')
      .replace(/(^|\s)#([a-z0-9_-]{1,40})/gi, '$1<a href="/topic/$2" class="font-medium text-accent hover:underline">#$2</a>')
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");

  const blocks: string[] = [];
  for (const chunk of text.split(/\n{2,}/)) {
    const lines = chunk.split("\n");
    const listItems = lines.filter((l) => /^[-•]\s/.test(l.trim()));
    if (listItems.length === lines.length && listItems.length > 0) {
      blocks.push("<ul>" + lines.map((l) => `<li>${fmt(l.replace(/^[-•]\s+/, ""))}</li>`).join("") + "</ul>");
    } else {
      blocks.push(`<p>${fmt(chunk).replace(/\n/g, "<br/>")}</p>`);
    }
  }
  return blocks.join("");
}

export async function getHomeFeed(viewerId: string): Promise<PostView[]> {
  if (isOfflineDemo()) {
    const myMissions = new Set(
      store.memberships.filter((m) => m.user_id === viewerId).map((m) => m.mission_id),
    );
    const iFollow = new Set(
      store.follows.filter((f) => f.follower_id === viewerId).map((f) => f.following_id),
    );
    return store.posts
      .filter(
        (p) =>
          (p.mission_id && myMissions.has(p.mission_id)) ||
          iFollow.has(p.author_id) ||
          p.author_id === viewerId,
      )
      .map((p) => offlineBuildPost(p, viewerId))
      .sort(feedSort);
  }
  return supabaseFeed(viewerId, { scope: "home" });
}

export async function getMissionFeed(
  missionId: string,
  viewerId: string,
): Promise<PostView[]> {
  if (isOfflineDemo()) {
    return store.posts
      .filter((p) => p.mission_id === missionId)
      .map((p) => offlineBuildPost(p, viewerId))
      .sort(feedSort);
  }
  return supabaseFeed(viewerId, { scope: "mission", missionId });
}

export async function getDiscoveryFeed(viewerId: string): Promise<PostView[]> {
  if (isOfflineDemo()) {
    const myMissions = new Set(
      store.memberships.filter((m) => m.user_id === viewerId).map((m) => m.mission_id),
    );
    return store.posts
      .filter((p) => !p.mission_id || !myMissions.has(p.mission_id))
      .map((p) => offlineBuildPost(p, viewerId))
      .sort(feedSort);
  }
  return supabaseFeed(viewerId, { scope: "discovery" });
}

export async function getSavedFeed(viewerId: string): Promise<PostView[]> {
  if (isOfflineDemo()) {
    const saved = new Set(
      store.saved.filter((s) => s.user_id === viewerId).map((s) => s.post_id),
    );
    return store.posts
      .filter((p) => saved.has(p.id))
      .map((p) => offlineBuildPost(p, viewerId))
      .sort(feedSort);
  }
  const db = createServiceClient();
  const { data } = await db.from("saved_posts").select("post_id").eq("user_id", viewerId);
  const ids = (data ?? []).map((r) => r.post_id);
  if (!ids.length) return [];
  return supabaseFeed(viewerId, { scope: "ids", ids });
}

export async function getGlobalPrompt(): Promise<{ text: string; responseCount: number }> {
  const text = isOfflineDemo()
    ? store.globalPrompt
    : "What's one thing you learned this week that you wish you'd known a year ago?";
  const responseCount = isOfflineDemo()
    ? store.posts.filter((p) => p.type === "prompt_response" || p.weekly_prompt_id).length
    : 0;
  return { text, responseCount };
}

export async function getPost(postId: string, viewerId: string): Promise<PostView | null> {
  if (isOfflineDemo()) {
    const p = store.posts.find((x) => x.id === postId);
    return p ? offlineBuildPost(p, viewerId) : null;
  }
  const rows = await supabaseFeed(viewerId, { scope: "ids", ids: [postId] });
  return rows[0] ?? null;
}

export async function getReplies(postId: string, viewerId: string): Promise<ReplyView[]> {
  if (isOfflineDemo()) {
    return store.replies
      .filter((r) => r.post_id === postId)
      .sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
      .map((r) => {
        const likes = store.replyLikes.filter((l) => l.reply_id === r.id);
        return {
          id: r.id,
          postId: r.post_id,
          author: offlinePersonCard(r.author_id)!,
          bodyText: r.body_text,
          createdAt: r.created_at,
          parentReplyId: r.parent_reply_id ?? null,
          likes: likes.length,
          likedByMe: likes.some((l) => l.user_id === viewerId),
          isOwn: r.author_id === viewerId,
        };
      });
  }
  const db = createServiceClient();
  const { data } = await db
    .from("replies")
    .select("id, post_id, author_id, body_text, created_at, parent_reply_id, users:author_id(username, display_name, avatar_url)")
    .eq("post_id", postId)
    .eq("is_removed", false)
    .order("created_at", { ascending: true });
  type Row = {
    id: string;
    post_id: string;
    author_id: string;
    body_text: string;
    created_at: string;
    parent_reply_id: string | null;
    users: { username: string; display_name: string; avatar_url: string | null } | null;
  };
  return ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    postId: r.post_id,
    author: {
      id: r.author_id,
      username: r.users?.username ?? "user",
      displayName: r.users?.display_name ?? "User",
      avatarUrl: r.users?.avatar_url ?? null,
      headline: null,
      values: [],
      lastActiveAt: null,
    },
    bodyText: r.body_text,
    createdAt: r.created_at,
    parentReplyId: r.parent_reply_id,
    likes: 0,
    likedByMe: false,
    isOwn: r.author_id === viewerId,
  }));
}

// ── Supabase feed assembly (production path) ───────────────────────────────
type FeedScope =
  | { scope: "home" }
  | { scope: "discovery" }
  | { scope: "mission"; missionId: string }
  | { scope: "ids"; ids: string[] };

async function supabaseFeed(viewerId: string, scope: FeedScope): Promise<PostView[]> {
  const db = createServiceClient();
  let q = db
    .from("posts")
    .select(
      "*, users:author_id(username, display_name, avatar_url), missions:mission_id(id, slug, name, accent_color, icon)",
    )
    .eq("is_removed", false)
    .order("created_at", { ascending: false })
    .limit(50);

  if (scope.scope === "mission") q = q.eq("mission_id", scope.missionId);
  if (scope.scope === "ids") q = q.in("id", scope.ids);
  if (scope.scope === "home") {
    const [{ data: mems }, { data: follows }] = await Promise.all([
      db.from("mission_members").select("mission_id").eq("user_id", viewerId),
      db.from("follows").select("following_id").eq("follower_id", viewerId),
    ]);
    const missionIds = (mems ?? []).map((m) => m.mission_id);
    const authorIds = [...(follows ?? []).map((f) => f.following_id), viewerId];
    const ors: string[] = [];
    if (missionIds.length) ors.push(`mission_id.in.(${missionIds.join(",")})`);
    if (authorIds.length) ors.push(`author_id.in.(${authorIds.join(",")})`);
    if (ors.length) q = q.or(ors.join(","));
  }

  const { data } = await q;
  type Row = PostRecord & {
    users: { username: string; display_name: string; avatar_url: string | null } | null;
    missions: { id: string; slug: string; name: string; accent_color: string; icon: string } | null;
    reply_count: number;
  };
  const rows = (data ?? []) as unknown as Row[];
  const ids = rows.map((r) => r.id);

  // Reactions + saves for the viewer, in two batched queries.
  const [{ data: rx }, { data: saves }] = await Promise.all([
    db.from("reactions").select("post_id, user_id, kind").in("post_id", ids.length ? ids : ["_"]),
    db.from("saved_posts").select("post_id").eq("user_id", viewerId).in("post_id", ids.length ? ids : ["_"]),
  ]);
  const savedSet = new Set((saves ?? []).map((s) => s.post_id));

  return rows.map((r) => {
    const postRx = (rx ?? []).filter((x) => x.post_id === r.id);
    const counts: Partial<Record<ReactionKind, number>> = {};
    for (const x of postRx) counts[x.kind as ReactionKind] = (counts[x.kind as ReactionKind] ?? 0) + 1;
    return {
      id: r.id,
      type: r.type,
      author: {
        id: r.author_id,
        username: r.users?.username ?? "user",
        displayName: r.users?.display_name ?? "User",
        avatarUrl: r.users?.avatar_url ?? null,
        headline: null,
        values: [],
        lastActiveAt: null,
      },
      authorLocation: null,
      authorIndustry: null,
      bodyHtml: r.body_html,
      bodyText: r.body_text,
      mission: r.missions
        ? { id: r.missions.id, slug: r.missions.slug, name: r.missions.name, accentColor: r.missions.accent_color, icon: r.missions.icon, kind: "mission" }
        : null,
      missionIsMember: true, // home/mission scopes already filter to the viewer's spaces; refined when membership lands in the select
      topics: r.topics,
      imageUrl: r.image_url,
      aiFlagged: r.ai_flagged,
      createdAt: r.created_at,
      replyCount: r.reply_count,
      reactions: {
        counts,
        mine: postRx.filter((x) => x.user_id === viewerId).map((x) => x.kind as ReactionKind),
        total: postRx.length,
        reactors: [],
      },
      saved: savedSet.has(r.id),
      isPromptResponse: !!r.weekly_prompt_id || r.type === "prompt_response",
      promptText:
        !!r.weekly_prompt_id || r.type === "prompt_response"
          ? "What's one thing you learned this week that you wish you'd known a year ago?"
          : null,
      isOwn: r.author_id === viewerId,
      edited: false,
      poll: null,
      repostOf: null,
      repostCount: 0,
    };
  });
}
