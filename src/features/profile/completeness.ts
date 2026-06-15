/**
 * Profile completeness 0–100 (PRD §3.2). Drives the completeness indicator and
 * AI gap nudges. Weighted so the human-signal sections matter most. Shared by
 * onboarding (Feature 1) and the profile editor (Feature 2).
 */
export type CompletenessInput = {
  headline?: string | null;
  identity_snapshot?: string | null;
  values?: string[] | null;
  work_style?: string[] | null;
  skills?: string[] | null;
  current_focus?: string | null;
  current_struggle?: string | null;
  ambitions?: string | null;
  links?: unknown[] | null;
  missionCount?: number;
};

const WEIGHTS = {
  headline: 15,
  identity_snapshot: 15,
  values: 15,
  work_style: 15,
  skills: 10,
  current_focus: 10,
  current_struggle: 5,
  ambitions: 10,
  missions: 5,
} as const;

export function computeCompleteness(p: CompletenessInput): number {
  let score = 0;
  const has = (s?: string | null) => !!s && s.trim().length > 0;
  const hasArr = (a?: unknown[] | null) => Array.isArray(a) && a.length > 0;

  if (has(p.headline)) score += WEIGHTS.headline;
  if (has(p.identity_snapshot)) score += WEIGHTS.identity_snapshot;
  if (hasArr(p.values)) score += WEIGHTS.values;
  if (hasArr(p.work_style)) score += WEIGHTS.work_style;
  if (hasArr(p.skills)) score += WEIGHTS.skills;
  if (has(p.current_focus)) score += WEIGHTS.current_focus;
  if (has(p.current_struggle)) score += WEIGHTS.current_struggle;
  if (has(p.ambitions)) score += WEIGHTS.ambitions;
  if ((p.missionCount ?? 0) > 0) score += WEIGHTS.missions;

  return Math.min(100, score);
}
