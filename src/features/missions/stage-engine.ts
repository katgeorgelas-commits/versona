import "server-only";

/**
 * Mission-journey stage drafting. Given a mission's name + brief, produce a
 * first-pass set of journey stages for a human to review. The AI never
 * publishes — it only drafts; a steward approves before members ever see them.
 *
 * Kept apart from React/actions so the prompt + scripted fallback stay
 * server-only and testable, mirroring features/onboarding/engine.ts.
 */

export type DraftedStage = { name: string; description: string };

/** Is a real Anthropic key configured (not the .env.example placeholder)? */
export function hasAnthropicKey() {
  const k = process.env.ANTHROPIC_API_KEY;
  return !!k && !k.includes("placeholder") && k.startsWith("sk-ant-");
}

/** The single tool the model must call — returns the drafted stages. */
export const stageTool = {
  name: "draft_journey_stages",
  description:
    "Produce an ordered set of journey stages for this mission, from the very beginning to the end of the arc.",
  input_schema: {
    type: "object" as const,
    properties: {
      stages: {
        type: "array",
        minItems: 3,
        maxItems: 6,
        description: "The journey stages, in order from first to last.",
        items: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Short, human, present-tense stage name (2–4 words), e.g. 'Validating the idea'.",
            },
            description: {
              type: "string",
              description: "One warm, concrete sentence describing what this stage feels like and what the person is doing.",
            },
          },
          required: ["name", "description"],
        },
      },
    },
    required: ["stages"],
  },
};

export function stageSystemPrompt() {
  return `You are Versona's mission-journey designer. Versona is a human-first professional community organized around "missions" — shared journeys people move through together (not job titles or résumés).

Your job: given a mission's name and description, draft the ORDERED stages of that journey — the steps a real person moves through from the very start to the far end of the arc.

Principles:
- 3–6 stages. Each is a distinct, recognizable step someone could honestly say "I'm here."
- Order them as a genuine progression: beginning → messy middle → arrival → (optionally) paying it forward.
- Names are short, warm, present-tense, human (e.g. "Building the bridge", "First users"). Never corporate jargon, never numbered.
- Descriptions are ONE concrete sentence about what that stage actually feels like and what the person is doing.
- Write so a member three steps ahead and a member just starting both see themselves clearly.
- You MUST call the draft_journey_stages tool. Do not write prose outside the tool.`;
}

export function stageUserPrompt(name: string, brief: string) {
  return `Mission name: ${name}\nMission description: ${brief}\n\nDraft the journey stages for this mission.`;
}

/**
 * Scripted fallback (no ANTHROPIC_API_KEY) — a sensible generic arc so stage
 * drafting is fully demoable without a key. Replaced by real AI drafting once
 * the key is set. Still goes through the same human-approval gate.
 */
export function scriptedStages(): DraftedStage[] {
  return [
    { name: "Just starting out", description: "New to this. Getting oriented and working out the very first move." },
    { name: "Finding my footing", description: "Past the beginning — building habits and learning how this world actually works." },
    { name: "In the thick of it", description: "Doing the real work, hitting the hard parts, and pushing through them." },
    { name: "Hitting my stride", description: "It's clicking. The momentum is real and the path ahead is clearer." },
    { name: "Paying it forward", description: "Through the hardest part, now helping the people a few steps behind." },
  ];
}
