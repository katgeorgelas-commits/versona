"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { isOfflineDemo } from "@/lib/dev/offline";
import { store, nextId } from "@/lib/dev/offline-store";
import { spacePath } from "@/lib/utils";
import { anthropic, VERSONA_MODEL } from "@/lib/anthropic/client";
import {
  hasAnthropicKey,
  scriptedStages,
  stageSystemPrompt,
  stageTool,
  stageUserPrompt,
  type DraftedStage,
} from "./stage-engine";

function revalidateMission(slug: string) {
  revalidatePath(spacePath("mission", slug));
}

/** Member self-placement on a mission's journey. Passing null clears it. */
export async function setMyStage(slug: string, stageId: string | null) {
  const user = await getSessionUser();
  if (!user) return { ok: false as const };
  if (!isOfflineDemo()) return { ok: true as const };

  const mission = store.missions.find((m) => m.slug === slug);
  if (!mission || mission.kind !== "mission") return { ok: false as const };

  // Must be a member to place yourself.
  const isMember = store.memberships.some(
    (m) => m.mission_id === mission.id && m.user_id === user.id,
  );
  if (!isMember) return { ok: false as const, error: "not_member" };

  // Stage, if provided, must belong to this mission and be published.
  if (stageId) {
    const ok = store.stages.some(
      (s) => s.id === stageId && s.mission_id === mission.id && s.status === "published",
    );
    if (!ok) return { ok: false as const };
  }

  const idx = store.memberStages.findIndex(
    (m) => m.mission_id === mission.id && m.user_id === user.id,
  );
  if (idx >= 0) store.memberStages.splice(idx, 1);
  if (stageId) {
    store.memberStages.push({ mission_id: mission.id, user_id: user.id, stage_id: stageId });
  }
  revalidateMission(slug);
  return { ok: true as const, stageId };
}

/**
 * Steward action: draft a journey for a mission with AI (or the scripted
 * fallback when no key). Drafts land in `draft` status — nothing is shown to
 * members until a human publishes. Re-drafting replaces any pending draft.
 */
export async function draftStagesWithAI(slug: string) {
  const user = await getSessionUser();
  if (!user || !user.isAdmin) return { ok: false as const, error: "forbidden" };
  if (!isOfflineDemo()) return { ok: true as const, source: "scripted" as const, count: 0 };

  const mission = store.missions.find((m) => m.slug === slug);
  if (!mission || mission.kind !== "mission") return { ok: false as const, error: "not_a_mission" };

  let drafted: DraftedStage[];
  let source: "ai" | "scripted";

  if (hasAnthropicKey()) {
    try {
      const res = await anthropic.messages.create({
        model: VERSONA_MODEL,
        max_tokens: 1024,
        system: stageSystemPrompt(),
        tools: [stageTool],
        tool_choice: { type: "tool", name: "draft_journey_stages" },
        messages: [{ role: "user", content: stageUserPrompt(mission.name, mission.brief) }],
      });
      const toolUse = res.content.find(
        (b): b is Extract<typeof b, { type: "tool_use" }> => b.type === "tool_use",
      );
      const out = toolUse?.input as { stages?: DraftedStage[] } | undefined;
      drafted = (out?.stages ?? []).filter((s) => s?.name && s?.description);
      source = "ai";
      if (drafted.length < 3) {
        drafted = scriptedStages();
        source = "scripted";
      }
    } catch (err) {
      console.error("[stages] anthropic error", err);
      drafted = scriptedStages();
      source = "scripted";
    }
  } else {
    drafted = scriptedStages();
    source = "scripted";
  }

  // Replace any existing pending draft for this mission.
  store.stages = store.stages.filter(
    (s) => !(s.mission_id === mission.id && s.status === "draft"),
  );
  drafted.forEach((d, i) => {
    store.stages.push({
      id: nextId("stage"),
      mission_id: mission.id,
      position: i + 1,
      name: d.name.trim().slice(0, 60),
      description: d.description.trim().slice(0, 240),
      status: "draft",
      source,
    });
  });

  revalidateMission(slug);
  return { ok: true as const, source, count: drafted.length };
}

/** Steward action: publish the pending draft as the mission's live journey. */
export async function publishDraftStages(slug: string) {
  const user = await getSessionUser();
  if (!user || !user.isAdmin) return { ok: false as const, error: "forbidden" };
  if (!isOfflineDemo()) return { ok: true as const };

  const mission = store.missions.find((m) => m.slug === slug);
  if (!mission) return { ok: false as const };

  const drafts = store.stages.filter(
    (s) => s.mission_id === mission.id && s.status === "draft",
  );
  if (drafts.length === 0) return { ok: false as const, error: "no_draft" };

  // Publishing a new journey replaces the old one; clear stale placements.
  const removedPublished = store.stages.filter(
    (s) => s.mission_id === mission.id && s.status === "published",
  );
  if (removedPublished.length > 0) {
    store.stages = store.stages.filter(
      (s) => !(s.mission_id === mission.id && s.status === "published"),
    );
    store.memberStages = store.memberStages.filter((m) => m.mission_id !== mission.id);
  }
  drafts
    .sort((a, b) => a.position - b.position)
    .forEach((s, i) => {
      s.status = "published";
      s.position = i + 1;
    });

  revalidateMission(slug);
  return { ok: true as const, count: drafts.length };
}

/** Steward action: discard the pending draft without publishing. */
export async function discardDraftStages(slug: string) {
  const user = await getSessionUser();
  if (!user || !user.isAdmin) return { ok: false as const, error: "forbidden" };
  if (!isOfflineDemo()) return { ok: true as const };

  const mission = store.missions.find((m) => m.slug === slug);
  if (!mission) return { ok: false as const };
  store.stages = store.stages.filter(
    (s) => !(s.mission_id === mission.id && s.status === "draft"),
  );
  revalidateMission(slug);
  return { ok: true as const };
}
