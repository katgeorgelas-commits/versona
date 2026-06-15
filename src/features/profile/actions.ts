"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/server";
import { isOfflineDemo, OFFLINE_USERS } from "@/lib/dev/offline";
import { store, nextId, nowIso } from "@/lib/dev/offline-store";
import { computeCompleteness } from "./completeness";

const ProfileSchema = z.object({
  headline: z.string().max(200).optional().default(""),
  identitySnapshot: z.string().max(600).optional().default(""),
  values: z.array(z.string().max(60)).max(8).default([]),
  workStyle: z.array(z.string().max(80)).max(8).default([]),
  skills: z.array(z.string().max(60)).max(15).default([]),
  currentFocus: z.string().max(500).optional().default(""),
  currentStruggle: z.string().max(500).optional().default(""),
  ambitions: z.string().max(500).optional().default(""),
  links: z
    .array(z.object({ label: z.string().max(60), url: z.string().url().max(300) }))
    .max(8)
    .default([]),
  location: z.string().max(80).optional().default(""),
  industry: z.string().max(80).optional().default(""),
  prompts: z
    .array(z.object({ id: z.string(), answer: z.string().max(280) }))
    .max(3)
    .default([]),
  experience: z
    .array(z.object({
      id: z.string(),
      kind: z.enum(["work", "education"]),
      title: z.string().max(100),
      org: z.string().max(100),
      period: z.string().max(40),
    }))
    .max(12)
    .default([]),
  certifications: z
    .array(z.object({
      id: z.string(),
      name: z.string().max(120),
      issuer: z.string().max(100),
      year: z.string().max(10),
    }))
    .max(10)
    .default([]),
});
export type UpdateProfileInput = z.infer<typeof ProfileSchema>;

export async function updateProfile(input: UpdateProfileInput) {
  const user = await getSessionUser();
  if (!user) return { ok: false as const, error: "unauthenticated" };
  const parsed = ProfileSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid" };
  const d = parsed.data;

  const completeness = computeCompleteness({
    headline: d.headline,
    identity_snapshot: d.identitySnapshot,
    values: d.values,
    work_style: d.workStyle,
    skills: d.skills,
    current_focus: d.currentFocus,
    current_struggle: d.currentStruggle,
    ambitions: d.ambitions,
    links: d.links,
    missionCount: undefined,
  });

  if (isOfflineDemo()) {
    const p = store.profiles.find((x) => x.user_id === user.id);
    const next = {
      user_id: user.id,
      headline: d.headline || null,
      headline_template: p?.headline_template ?? null,
      identity_snapshot: d.identitySnapshot || null,
      values: d.values,
      work_style: d.workStyle,
      skills: d.skills,
      current_focus: d.currentFocus || null,
      current_struggle: d.currentStruggle || null,
      ambitions: d.ambitions || null,
      links: d.links,
      completeness,
      career_identity_score: p?.career_identity_score ?? null,
      location: d.location || null,
      industry: d.industry || null,
      prompts: d.prompts.filter((x) => x.answer.trim()),
      experience: d.experience.filter((x) => x.title.trim() && x.org.trim()),
      certifications: d.certifications.filter((x) => x.name.trim()),
    };
    if (p) Object.assign(p, next);
    else store.profiles.push(next);
    revalidatePath(`/${user.username}`);
    return { ok: true as const };
  }

  const db = createServiceClient();
  const { error } = await db.from("profiles").upsert(
    {
      user_id: user.id,
      headline: d.headline || null,
      identity_snapshot: d.identitySnapshot || null,
      identity_snapshot_edited: true,
      values: d.values,
      work_style: d.workStyle,
      skills: d.skills,
      current_focus: d.currentFocus || null,
      current_struggle: d.currentStruggle || null,
      ambitions: d.ambitions || null,
      links: d.links,
      completeness,
    },
    { onConflict: "user_id" },
  );
  if (error) return { ok: false as const, error: "save_failed" };
  revalidatePath(`/${user.username}`);
  return { ok: true as const };
}

export async function toggleFollow(targetId: string) {
  const user = await getSessionUser();
  if (!user || user.id === targetId) return { ok: false as const };

  if (isOfflineDemo()) {
    const i = store.follows.findIndex(
      (f) => f.follower_id === user.id && f.following_id === targetId,
    );
    if (i >= 0) store.follows.splice(i, 1);
    else store.follows.push({ follower_id: user.id, following_id: targetId });
    revalidatePathForUser(targetId);
    return { ok: true as const, following: i < 0 };
  }

  const db = createServiceClient();
  const { data: existing } = await db
    .from("follows")
    .select("follower_id")
    .eq("follower_id", user.id)
    .eq("following_id", targetId)
    .maybeSingle();
  if (existing) {
    await db.from("follows").delete().eq("follower_id", user.id).eq("following_id", targetId);
    return { ok: true as const, following: false };
  }
  await db.from("follows").insert({ follower_id: user.id, following_id: targetId });
  return { ok: true as const, following: true };
}

const ConnectSchema = z.object({
  targetId: z.string(),
  note: z.string().trim().min(1, "A note is required").max(500),
});

export async function requestConnection(input: z.infer<typeof ConnectSchema>) {
  const user = await getSessionUser();
  if (!user) return { ok: false as const, error: "unauthenticated" };
  const parsed = ConnectSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "note_required" };
  const { targetId, note } = parsed.data;
  if (targetId === user.id) return { ok: false as const, error: "invalid" };

  if (isOfflineDemo()) {
    const exists = store.connections.find(
      (c) =>
        (c.requester_id === user.id && c.recipient_id === targetId) ||
        (c.requester_id === targetId && c.recipient_id === user.id),
    );
    if (exists) return { ok: false as const, error: "exists" };
    store.connections.push({
      id: nextId("conn"),
      requester_id: user.id,
      recipient_id: targetId,
      status: "pending",
      note,
      created_at: nowIso(),
    });
    store.notifications.push({
      id: nextId("notif"),
      recipient_id: targetId,
      type: "connection_request",
      actor_id: user.id,
      summary: `${user.displayName} wants to connect`,
      entity_type: "connection",
      entity_id: null,
      created_at: nowIso(),
      read_at: null,
    });
    revalidatePathForUser(targetId);
    return { ok: true as const };
  }

  const db = createServiceClient();
  const { error } = await db
    .from("connections")
    .insert({ requester_id: user.id, recipient_id: targetId, note });
  if (error) return { ok: false as const, error: "exists" };
  await db.from("notifications").insert({
    recipient_id: targetId,
    type: "connection_request",
    actor_id: user.id,
    summary: `${user.displayName} wants to connect`,
    entity_type: "connection",
  });
  return { ok: true as const };
}

/** Fetch followers or following list — callable from client for modal. */
export async function getFollowListAction(
  username: string,
  kind: "followers" | "following",
) {
  const user = await getSessionUser();
  if (!user) return { people: [] as { id: string; username: string; displayName: string; avatarUrl: string | null }[] };
  if (isOfflineDemo()) {
    const u = OFFLINE_USERS[username];
    if (!u) return { people: [] };
    const ids =
      kind === "followers"
        ? store.follows.filter((f) => f.following_id === u.id).map((f) => f.follower_id)
        : store.follows.filter((f) => f.follower_id === u.id).map((f) => f.following_id);
    const people = ids
      .map((id) => {
        const ux = Object.values(OFFLINE_USERS).find((x) => x.id === id);
        return ux ? { id: ux.id, username: ux.username, displayName: ux.displayName, avatarUrl: ux.avatarUrl } : null;
      })
      .filter(Boolean) as { id: string; username: string; displayName: string; avatarUrl: string | null }[];
    return { people };
  }
  const db = createServiceClient();
  const { data: u } = await db.from("users").select("id").eq("username", username).maybeSingle();
  if (!u) return { people: [] };
  const col = kind === "followers" ? "following_id" : "follower_id";
  const sel = kind === "followers" ? "follower_id" : "following_id";
  const { data } = await db.from("follows").select(sel).eq(col, u.id);
  const ids = ((data ?? []) as Record<string, string>[]).map((r) => r[sel]);
  if (!ids.length) return { people: [] };
  const { data: users } = await db.from("users").select("id, username, display_name, avatar_url").in("id", ids);
  return {
    people: (users ?? []).map((x) => ({
      id: x.id, username: x.username, displayName: x.display_name, avatarUrl: x.avatar_url,
    })),
  };
}

function revalidatePathForUser(userId: string) {
  const u = Object.values(OFFLINE_USERS).find((x) => x.id === userId);
  if (u) revalidatePath(`/${u.username}`);
}

export async function updateAvatar(dataUrl: string) {
  const user = await getSessionUser();
  if (!user) return { ok: false as const };
  if (isOfflineDemo()) {
    const u = Object.values(OFFLINE_USERS).find((x) => x.id === user.id);
    if (u) {
      (u as { avatarUrl: string | null }).avatarUrl = dataUrl;
    }
    revalidatePath(`/${user.username}`);
    revalidatePath("/feed");
    return { ok: true as const };
  }
  return { ok: true as const };
}

export async function updateCoverImage(dataUrl: string) {
  const user = await getSessionUser();
  if (!user) return { ok: false as const };
  if (isOfflineDemo()) {
    const p = store.profiles.find((x) => x.user_id === user.id);
    if (p) (p as Record<string, unknown>).cover_url = dataUrl;
    revalidatePath(`/${user.username}`);
    return { ok: true as const };
  }
  return { ok: true as const };
}

/** Endorse (or un-endorse) a skill on someone's profile. */
export async function endorseSkill(userId: string, skill: string) {
  const user = await getSessionUser();
  if (!user || user.id === userId) return { ok: false as const };
  if (isOfflineDemo()) {
    const i = store.endorsements.findIndex(
      (e) => e.user_id === userId && e.skill === skill && e.endorser_id === user.id,
    );
    if (i >= 0) store.endorsements.splice(i, 1);
    else {
      store.endorsements.push({ user_id: userId, skill, endorser_id: user.id });
      store.notifications.push({
        id: nextId("notif"),
        recipient_id: userId,
        type: "reaction",
        actor_id: user.id,
        summary: `${user.displayName} endorsed you for ${skill}`,
        entity_type: "profile",
        entity_id: null,
        created_at: nowIso(),
        read_at: null,
      });
    }
    revalidatePathForUser(userId);
    return { ok: true as const, endorsed: i < 0 };
  }
  return { ok: true as const, endorsed: true };
}
