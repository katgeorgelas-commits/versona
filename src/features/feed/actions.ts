"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/server";
import { isOfflineDemo, OFFLINE_USERS } from "@/lib/dev/offline";
import { store, nextId, nowIso } from "@/lib/dev/offline-store";
import { aiContentScore } from "@/lib/ai/heuristic";
import { moderateContent } from "@/lib/ai/moderation";
import { getReplies } from "./data";
import { POST_MAX, REPLY_MAX, MAX_TOPICS } from "@/lib/utils";
import type { PostType, ReactionKind } from "@/types/app";

/** Lazy-load a post's replies for the expanding thread in PostCard. */
export async function loadReplies(postId: string) {
  const user = await getSessionUser();
  if (!user) return [];
  return getReplies(postId, user.id);
}

function toHtml(text: string) {
  const esc = (s: string) =>
    s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
  const inline = (s: string) =>
    s
      .replace(/(^|\s)@([a-z0-9_]{2,30})/gi, '$1<a href="/$2" class="font-medium text-accent hover:underline">@$2</a>')
      .replace(/(^|\s)#([a-z0-9_-]{1,40})/gi, '$1<a href="/topic/$2" class="font-medium text-accent hover:underline">#$2</a>')
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");

  const blocks: string[] = [];
  for (const chunk of text.split(/\n{2,}/)) {
    const lines = chunk.split("\n");
    const listItems = lines.filter((l) => /^[-•]\s/.test(l.trim()));
    if (listItems.length === lines.length && listItems.length > 0) {
      blocks.push("<ul>" + lines.map((l) => `<li>${inline(esc(l.replace(/^[-•]\s+/, "")))}</li>`).join("") + "</ul>");
    } else {
      blocks.push(`<p>${inline(esc(chunk)).replace(/\n/g, "<br/>")}</p>`);
    }
  }
  return blocks.join("");
}

function extractHashtags(text: string): string[] {
  const matches = text.match(/(^|\s)#([a-z0-9_-]{1,40})/gi) ?? [];
  return [...new Set(matches.map((m) => m.trim().replace(/^#/, "").toLowerCase()))];
}

/** Notify mentioned users (offline demo). */
function notifyMentions(body: string, postId: string, actorId: string, actorName: string) {
  const names = new Set([...body.matchAll(/@([a-z0-9_]{2,30})/gi)].map((m) => m[1].toLowerCase()));
  for (const un of names) {
    const u = OFFLINE_USERS[un];
    if (u && u.id !== actorId) {
      store.notifications.push({
        id: nextId("notif"),
        recipient_id: u.id,
        type: "mention",
        actor_id: actorId,
        summary: `${actorName} mentioned you`,
        entity_type: "post",
        entity_id: postId,
        created_at: nowIso(),
        read_at: null,
      });
    }
  }
}

const PostSchema = z.object({
  type: z.enum(["question", "discussion", "prompt_response", "update"]),
  body: z.string().trim().min(1).max(POST_MAX),
  missionSlug: z.string().optional(),
  topics: z.array(z.string().max(40)).max(MAX_TOPICS).default([]),
  weeklyPromptId: z.string().optional(),
  pollOptions: z.array(z.string().trim().min(1).max(80)).max(4).optional(),
  imageUrl: z.string().optional(),
});

export async function createPost(input: z.infer<typeof PostSchema>) {
  const user = await getSessionUser();
  if (!user) return { ok: false as const, error: "unauthenticated" };
  const parsed = PostSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid" };
  const d = parsed.data;
  const mod = moderateContent(d.body);
  if (!mod.safe) return { ok: false as const, error: "moderated", reason: mod.reason };
  const bodyTags = extractHashtags(d.body);
  d.topics = [...new Set([...d.topics, ...bodyTags])].slice(0, MAX_TOPICS);
  const ai = aiContentScore(d.body);

  if (isOfflineDemo()) {
    const mission = d.missionSlug
      ? store.missions.find((m) => m.slug === d.missionSlug)
      : d.type === "prompt_response"
        ? store.missions.find((m) => m.slug === "versona-asks")
        : null;
    const post = {
      id: nextId("post"),
      author_id: user.id,
      type: d.type as PostType,
      body_text: d.body,
      body_html: toHtml(d.body),
      mission_id: mission?.id ?? null,
      weekly_prompt_id: d.weeklyPromptId ?? null,
      topics: d.topics,
      image_url: d.imageUrl ?? null,
      ai_flagged: ai.flagged,
      created_at: nowIso(),
      poll:
        d.pollOptions && d.pollOptions.length >= 2
          ? { options: d.pollOptions.map((t, i) => ({ id: `o${i + 1}`, text: t })), votes: {} }
          : null,
    };
    store.posts.unshift(post);
    notifyMentions(d.body, post.id, user.id, user.displayName);
    revalidatePath("/feed");
    if (mission) revalidatePath(`/missions/${mission.slug}`);
    return { ok: true as const, id: post.id, aiFlagged: ai.flagged };
  }

  const db = createServiceClient();
  let missionId: string | null = null;
  if (d.missionSlug) {
    const { data: m } = await db.from("missions").select("id").eq("slug", d.missionSlug).maybeSingle();
    missionId = m?.id ?? null;
  }
  const { data, error } = await db
    .from("posts")
    .insert({
      author_id: user.id,
      type: d.type,
      body_text: d.body,
      body_html: toHtml(d.body),
      mission_id: missionId,
      weekly_prompt_id: d.weeklyPromptId ?? null,
      topics: d.topics,
      ai_flagged: ai.flagged,
      ai_score: ai.score,
      ai_flag_source: ai.flagged ? "heuristic" : null,
    })
    .select("id")
    .single();
  if (error) return { ok: false as const, error: "save_failed" };
  revalidatePath("/feed");
  if (d.missionSlug) revalidatePath(`/missions/${d.missionSlug}`);
  return { ok: true as const, id: data.id, aiFlagged: ai.flagged };
}

export async function toggleReaction(postId: string, kind: ReactionKind) {
  const user = await getSessionUser();
  if (!user) return { ok: false as const };

  if (isOfflineDemo()) {
    const i = store.reactions.findIndex(
      (r) => r.post_id === postId && r.user_id === user.id && r.kind === kind,
    );
    if (i >= 0) store.reactions.splice(i, 1);
    else {
      store.reactions.push({ post_id: postId, user_id: user.id, kind });
      const post = store.posts.find((p) => p.id === postId);
      if (post && post.author_id !== user.id) {
        store.notifications.push({
          id: nextId("notif"),
          recipient_id: post.author_id,
          type: "reaction",
          actor_id: user.id,
          summary: `${user.displayName} reacted to your post`,
          entity_type: "post",
          entity_id: postId,
          created_at: nowIso(),
          read_at: null,
        });
      }
    }
    return { ok: true as const, active: i < 0 };
  }

  const db = createServiceClient();
  const { data: existing } = await db
    .from("reactions")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .eq("kind", kind)
    .maybeSingle();
  if (existing) {
    await db.from("reactions").delete().eq("id", existing.id);
    return { ok: true as const, active: false };
  }
  await db.from("reactions").insert({ post_id: postId, user_id: user.id, kind });
  return { ok: true as const, active: true };
}

export async function toggleSave(postId: string) {
  const user = await getSessionUser();
  if (!user) return { ok: false as const };

  if (isOfflineDemo()) {
    const i = store.saved.findIndex((s) => s.user_id === user.id && s.post_id === postId);
    if (i >= 0) store.saved.splice(i, 1);
    else store.saved.push({ user_id: user.id, post_id: postId });
    revalidatePath("/saved");
    return { ok: true as const, saved: i < 0 };
  }

  const db = createServiceClient();
  const { data: existing } = await db
    .from("saved_posts")
    .select("post_id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();
  if (existing) {
    await db.from("saved_posts").delete().eq("user_id", user.id).eq("post_id", postId);
    return { ok: true as const, saved: false };
  }
  await db.from("saved_posts").insert({ user_id: user.id, post_id: postId });
  return { ok: true as const, saved: true };
}

const ReplySchema = z.object({
  postId: z.string(),
  body: z.string().trim().min(1).max(REPLY_MAX),
  parentReplyId: z.string().optional(),
});

export async function createReply(input: z.infer<typeof ReplySchema>) {
  const user = await getSessionUser();
  if (!user) return { ok: false as const, error: "unauthenticated" };
  const parsed = ReplySchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid" };
  const { postId, body, parentReplyId } = parsed.data;
  const replyMod = moderateContent(body);
  if (!replyMod.safe) return { ok: false as const, error: "moderated" };

  if (isOfflineDemo()) {
    store.replies.push({
      id: nextId("reply"),
      post_id: postId,
      author_id: user.id,
      body_text: body,
      created_at: nowIso(),
      parent_reply_id: parentReplyId ?? null,
    });
    notifyMentions(body, postId, user.id, user.displayName);
    // Notify the person you replied to (parent comment author), else the post author.
    const parent = parentReplyId ? store.replies.find((r) => r.id === parentReplyId) : null;
    const post = store.posts.find((p) => p.id === postId);
    const recipient = parent ? parent.author_id : post?.author_id;
    if (recipient && recipient !== user.id) {
      store.notifications.push({
        id: nextId("notif"),
        recipient_id: recipient,
        type: "reply",
        actor_id: user.id,
        summary: parent
          ? `${user.displayName} replied to your comment`
          : `${user.displayName} replied to your post`,
        entity_type: "post",
        entity_id: postId,
        created_at: nowIso(),
        read_at: null,
      });
    }
    revalidatePath("/feed");
    return { ok: true as const };
  }

  const db = createServiceClient();
  const esc = (s: string) =>
    s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
  const { error } = await db.from("replies").insert({
    post_id: postId,
    author_id: user.id,
    body_text: body,
    body_html: `<p>${esc(body)}</p>`,
    parent_reply_id: parentReplyId ?? null,
  });
  if (error) return { ok: false as const, error: "save_failed" };
  revalidatePath("/feed");
  return { ok: true as const };
}

/** Like (or unlike) a comment. */
export async function toggleReplyLike(replyId: string) {
  const user = await getSessionUser();
  if (!user) return { ok: false as const };
  if (isOfflineDemo()) {
    const i = store.replyLikes.findIndex((l) => l.reply_id === replyId && l.user_id === user.id);
    if (i >= 0) store.replyLikes.splice(i, 1);
    else {
      store.replyLikes.push({ reply_id: replyId, user_id: user.id });
      const reply = store.replies.find((r) => r.id === replyId);
      if (reply && reply.author_id !== user.id) {
        store.notifications.push({
          id: nextId("notif"),
          recipient_id: reply.author_id,
          type: "reaction",
          actor_id: user.id,
          summary: `${user.displayName} liked your comment`,
          entity_type: "post",
          entity_id: reply.post_id,
          created_at: nowIso(),
          read_at: null,
        });
      }
    }
    revalidatePath("/feed");
    return { ok: true as const, liked: i < 0 };
  }
  return { ok: true as const, liked: true };
}

/** Repost (optionally with a quote) — shares a post into your feed. */
export async function repost(postId: string, quote?: string) {
  const user = await getSessionUser();
  if (!user) return { ok: false as const };
  if (isOfflineDemo()) {
    const orig = store.posts.find((p) => p.id === postId);
    if (!orig) return { ok: false as const };
    store.posts.unshift({
      id: nextId("post"),
      author_id: user.id,
      type: "discussion",
      body_text: quote?.trim() || "",
      body_html: quote?.trim() ? toHtml(quote.trim()) : "",
      mission_id: null,
      weekly_prompt_id: null,
      topics: [],
      image_url: null,
      ai_flagged: false,
      created_at: nowIso(),
      repost_of: postId,
    });
    if (orig.author_id !== user.id) {
      store.notifications.push({
        id: nextId("notif"),
        recipient_id: orig.author_id,
        type: "reaction",
        actor_id: user.id,
        summary: `${user.displayName} reposted your post`,
        entity_type: "post",
        entity_id: postId,
        created_at: nowIso(),
        read_at: null,
      });
    }
    revalidatePath("/feed");
    return { ok: true as const };
  }
  const db = createServiceClient();
  await db.from("posts").insert({
    author_id: user.id,
    type: "discussion",
    body_text: quote?.trim() || "",
    body_html: quote?.trim() ? toHtml(quote.trim()) : "",
  });
  revalidatePath("/feed");
  return { ok: true as const };
}

/** Vote on a poll (one vote per user; re-voting changes it). */
export async function votePoll(postId: string, optionId: string) {
  const user = await getSessionUser();
  if (!user) return { ok: false as const };
  if (isOfflineDemo()) {
    const p = store.posts.find((x) => x.id === postId);
    if (p?.poll) p.poll.votes[user.id] = optionId;
    revalidatePath("/feed");
    return { ok: true as const };
  }
  return { ok: true as const };
}

export async function deletePost(postId: string) {
  const user = await getSessionUser();
  if (!user) return { ok: false as const };
  if (isOfflineDemo()) {
    const i = store.posts.findIndex((p) => p.id === postId && p.author_id === user.id);
    if (i >= 0) store.posts.splice(i, 1);
    revalidatePath("/feed");
    return { ok: true as const };
  }
  const db = createServiceClient();
  await db.from("posts").update({ is_removed: true }).eq("id", postId).eq("author_id", user.id);
  revalidatePath("/feed");
  return { ok: true as const };
}

export async function editPost(postId: string, body: string) {
  const user = await getSessionUser();
  if (!user) return { ok: false as const };
  const text = body.trim();
  if (!text || text.length > POST_MAX) return { ok: false as const };
  if (isOfflineDemo()) {
    const p = store.posts.find((x) => x.id === postId && x.author_id === user.id);
    if (p) {
      p.body_text = text;
      p.body_html = toHtml(text);
      p.edited_at = nowIso();
    }
    revalidatePath("/feed");
    return { ok: true as const };
  }
  const db = createServiceClient();
  await db
    .from("posts")
    .update({ body_text: text, body_html: toHtml(text) })
    .eq("id", postId)
    .eq("author_id", user.id);
  revalidatePath("/feed");
  return { ok: true as const };
}

/** Report a post for policy violation. */
export async function reportPost(postId: string, reason: string) {
  const user = await getSessionUser();
  if (!user) return { ok: false as const };
  if (isOfflineDemo()) {
    store.notifications.push({
      id: nextId("notif"),
      recipient_id: "user-admin",
      type: "system",
      actor_id: user.id,
      summary: `Report on post ${postId}: ${reason}`,
      entity_type: "post",
      entity_id: postId,
      created_at: nowIso(),
      read_at: null,
    });
    return { ok: true as const };
  }
  return { ok: true as const };
}

/** User flag for likely AI content — sets/clears the demotion flag (PRD §3.4). */
export async function flagPostAi(postId: string) {
  const user = await getSessionUser();
  if (!user) return { ok: false as const };
  if (isOfflineDemo()) {
    const post = store.posts.find((p) => p.id === postId);
    if (post) post.ai_flagged = true;
    revalidatePath("/feed");
    return { ok: true as const };
  }
  const db = createServiceClient();
  await db.from("posts").update({ ai_flagged: true, ai_flag_source: "user" }).eq("id", postId);
  revalidatePath("/feed");
  return { ok: true as const };
}
