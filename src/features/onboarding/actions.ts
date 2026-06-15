"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { isOfflineDemo } from "@/lib/dev/offline";
import { computeCompleteness } from "@/features/profile/completeness";
import type { ChatTurn } from "./engine";

/**
 * Persists the reviewed onboarding result (PRD §3.1 → §3.2). Writes structured
 * profile fields, stores the raw transcript + extraction in ai_profiles, joins
 * the chosen missions, and stamps onboarding_completed_at. The user has already
 * reviewed and edited everything here — AI never finalizes public copy alone.
 */
const SaveSchema = z.object({
  headline: z.string().max(200).optional().default(""),
  headlineTemplate: z.string().optional(),
  identitySnapshot: z.string().max(600).optional().default(""),
  values: z.array(z.string().max(60)).max(8).default([]),
  workStyle: z.array(z.string().max(80)).max(8).default([]),
  skills: z.array(z.string().max(60)).max(15).default([]),
  currentFocus: z.string().max(500).optional().default(""),
  currentStruggle: z.string().max(500).optional().default(""),
  ambitions: z.string().max(500).optional().default(""),
  missionSlugs: z.array(z.string()).max(12).default([]),
  transcript: z
    .array(z.object({ role: z.enum(["assistant", "user"]), content: z.string() }))
    .default([]),
});

export type SaveOnboardingInput = z.infer<typeof SaveSchema>;

export async function saveOnboarding(input: SaveOnboardingInput) {
  const user = await getSessionUser();
  if (!user) return { ok: false as const, error: "unauthenticated" };

  const parsed = SaveSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid_input" };
  const d = parsed.data;

  // Offline demo: skip persistence, let the UI complete its happy path.
  if (isOfflineDemo()) {
    return { ok: true as const, username: user.username };
  }

  const db = createServiceClient();

  // Resolve chosen mission slugs → ids.
  let missionIds: string[] = [];
  if (d.missionSlugs.length) {
    const { data: missions } = await db
      .from("missions")
      .select("id, slug")
      .in("slug", d.missionSlugs);
    missionIds = (missions ?? []).map((m) => m.id);
  }

  const completeness = computeCompleteness({
    headline: d.headline,
    identity_snapshot: d.identitySnapshot,
    values: d.values,
    work_style: d.workStyle,
    skills: d.skills,
    current_focus: d.currentFocus,
    current_struggle: d.currentStruggle,
    ambitions: d.ambitions,
    missionCount: missionIds.length,
  });

  // Upsert the public profile.
  const { error: profileErr } = await db.from("profiles").upsert(
    {
      user_id: user.id,
      headline: d.headline || null,
      headline_template: d.headlineTemplate ?? null,
      identity_snapshot: d.identitySnapshot || null,
      values: d.values,
      work_style: d.workStyle,
      skills: d.skills,
      current_focus: d.currentFocus || null,
      current_struggle: d.currentStruggle || null,
      ambitions: d.ambitions || null,
      completeness,
      onboarding_completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (profileErr) {
    console.error("[saveOnboarding] profile", profileErr);
    return { ok: false as const, error: "save_failed" };
  }

  // Store the private AI working memory (transcript + extraction).
  await db.from("ai_profiles").upsert(
    {
      user_id: user.id,
      onboarding_transcript: d.transcript as unknown as ChatTurn[],
      extracted: {
        values: d.values,
        work_style: d.workStyle,
        skills: d.skills,
        current_focus: d.currentFocus,
        current_struggle: d.currentStruggle,
        ambitions: d.ambitions,
        suggested_mission_slugs: d.missionSlugs,
      },
    },
    { onConflict: "user_id" },
  );

  // Join chosen missions (idempotent).
  if (missionIds.length) {
    await db
      .from("mission_members")
      .upsert(
        missionIds.map((mission_id) => ({ mission_id, user_id: user.id })),
        { onConflict: "mission_id,user_id" },
      );
  }

  revalidatePath(`/${user.username}`);
  revalidatePath("/feed");
  return { ok: true as const, username: user.username };
}
