import "server-only";
import { isOfflineDemo } from "@/lib/dev/offline";
import { store } from "@/lib/dev/offline-store";
import { offlinePersonCard } from "@/features/profile/data";
import type { JourneyView, StageView, StepAheadPerson } from "@/types/views";

const EMPTY: JourneyView = {
  hasStages: false,
  stages: [],
  myStageId: null,
  myStageOrder: null,
  peopleAhead: [],
  canManage: false,
  draftStages: [],
};

/**
 * The journey layer for a single mission: published stages, where the viewer
 * stands, who's a few steps ahead, and (for stewards) any AI/draft stages
 * awaiting approval. Circles never call this — they have no journey.
 */
export async function getJourney(
  missionId: string,
  viewerId: string,
  isAdmin: boolean,
): Promise<JourneyView> {
  if (isOfflineDemo()) {
    const published = store.stages
      .filter((s) => s.mission_id === missionId && s.status === "published")
      .sort((a, b) => a.position - b.position);

    const myPlacement = store.memberStages.find(
      (m) => m.mission_id === missionId && m.user_id === viewerId,
    );
    const myStageId = myPlacement?.stage_id ?? null;
    const myStage = published.find((s) => s.id === myStageId);
    const myStageOrder = myStage?.position ?? null;

    const stages: StageView[] = published.map((s) => ({
      id: s.id,
      order: s.position,
      name: s.name,
      description: s.description,
      memberCount: store.memberStages.filter(
        (m) => m.mission_id === missionId && m.stage_id === s.id,
      ).length,
      isMine: s.id === myStageId,
    }));

    // "A few steps ahead": members further along than the viewer, nearest first.
    let peopleAhead: StepAheadPerson[] = [];
    if (myStageOrder != null) {
      const byPos = new Map(published.map((s) => [s.id, s]));
      peopleAhead = store.memberStages
        .filter((m) => m.mission_id === missionId && m.user_id !== viewerId)
        .map((m) => ({ m, stage: byPos.get(m.stage_id) }))
        .filter((x): x is { m: typeof x.m; stage: NonNullable<typeof x.stage> } =>
          !!x.stage && x.stage.position > myStageOrder,
        )
        .sort((a, b) => a.stage.position - b.stage.position)
        .map(({ m, stage }) => {
          const card = offlinePersonCard(m.user_id);
          if (!card) return null;
          return {
            ...card,
            stageName: stage.name,
            stageOrder: stage.position,
            stepsAhead: stage.position - myStageOrder,
          };
        })
        .filter((x): x is StepAheadPerson => x !== null);
    }

    const draftStages = isAdmin
      ? store.stages
          .filter((s) => s.mission_id === missionId && s.status === "draft")
          .sort((a, b) => a.position - b.position)
          .map((s) => ({ id: s.id, order: s.position, name: s.name, description: s.description, source: s.source }))
      : [];

    return {
      hasStages: published.length > 0,
      stages,
      myStageId,
      myStageOrder,
      peopleAhead,
      canManage: isAdmin,
      draftStages,
    };
  }

  // Supabase path: the mission_stages / mission_stage_members tables ship with
  // the journey migration (not yet applied — no live DB here). Until then the
  // online build renders no journey rather than guessing a schema.
  return { ...EMPTY, canManage: isAdmin };
}

/** Per-mission journey summary for the viewer — drives the Community page. */
export type MyStageSummary = { total: number; mine: { order: number; name: string } | null };

export async function getMyStageMap(
  viewerId: string,
): Promise<Record<string, MyStageSummary>> {
  if (!isOfflineDemo()) return {};
  const out: Record<string, MyStageSummary> = {};
  for (const m of store.missions) {
    if (m.kind !== "mission") continue;
    const published = store.stages.filter((s) => s.mission_id === m.id && s.status === "published");
    if (published.length === 0) continue;
    const placement = store.memberStages.find(
      (ms) => ms.mission_id === m.id && ms.user_id === viewerId,
    );
    const stage = placement && published.find((s) => s.id === placement.stage_id);
    out[m.id] = {
      total: published.length,
      mine: stage ? { order: stage.position, name: stage.name } : null,
    };
  }
  return out;
}
