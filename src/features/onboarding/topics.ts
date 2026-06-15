/**
 * The seven things onboarding tries to understand (PRD §3.1). Order is a
 * suggestion, not a script — the AI moves adaptively. Coverage of these drives
 * the progress indicator.
 */
export const ONBOARDING_TOPICS = [
  {
    key: "work_style",
    label: "Work style",
    hint: "How you operate, collaborate, communicate",
  },
  {
    key: "values",
    label: "Values",
    hint: "What you care about at work and in life",
  },
  {
    key: "personality",
    label: "Personality",
    hint: "Your energy, pace, structure preference",
  },
  {
    key: "current_reality",
    label: "Current reality",
    hint: "What you're working on and figuring out",
  },
  {
    key: "ambitions",
    label: "Ambitions",
    hint: "Where you want to go, what you want to build",
  },
  {
    key: "skills",
    label: "Skills",
    hint: "Soft and hard — a light touch, not a resume",
  },
  {
    key: "missions",
    label: "Missions",
    hint: "Which community journeys resonate",
  },
] as const;

export type TopicKey = (typeof ONBOARDING_TOPICS)[number]["key"];

export const TOPIC_KEYS = ONBOARDING_TOPICS.map((t) => t.key) as TopicKey[];

/** Progress is fraction of topics the conversation has meaningfully covered. */
export function onboardingProgress(covered: string[]) {
  const valid = new Set(TOPIC_KEYS as string[]);
  const hit = new Set(covered.filter((c) => valid.has(c)));
  return Math.round((hit.size / TOPIC_KEYS.length) * 100);
}
