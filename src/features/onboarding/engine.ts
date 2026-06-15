import type { TopicKey } from "./topics";
import { TOPIC_KEYS } from "./topics";

/**
 * Onboarding engine shared contract + prompt. Used by the API route. Kept apart
 * from React so it stays server-only and testable.
 */

export type ChatTurn = { role: "assistant" | "user"; content: string };

/** Structured profile data the engine accumulates from the conversation. */
export type OnboardingExtraction = {
  values: string[];
  work_style: string[];
  skills: string[];
  personality_signals: string[];
  current_focus: string;
  current_struggle: string;
  ambitions: string;
  suggested_mission_slugs: string[];
};

export type OnboardingTurnResult = {
  message: string;
  topics_covered: TopicKey[];
  extracted: Partial<OnboardingExtraction>;
  is_complete: boolean;
  /** Which engine produced this turn — surfaced for transparency in dev. */
  mode: "ai" | "scripted";
};

export const EMPTY_EXTRACTION: OnboardingExtraction = {
  values: [],
  work_style: [],
  skills: [],
  personality_signals: [],
  current_focus: "",
  current_struggle: "",
  ambitions: "",
  suggested_mission_slugs: [],
};

/** Warm, fixed opening — deterministic, costs no tokens. */
export const OPENING_MESSAGE =
  "Hey — I'm so glad you're here. I'm going to ask you a few things so Versona can understand who you actually are, not just what you do. No resume, no buzzwords. Just a real conversation — about 10 minutes.\n\nTo start: what's taking up most of your energy right now, work-wise?";

/** The single tool the model must call each turn (forced via tool_choice). */
export function onboardingTool(missions: { slug: string; name: string }[]) {
  return {
    name: "onboarding_turn",
    description:
      "Produce the next message to the user AND record what you've learned so far. Call this on every turn.",
    input_schema: {
      type: "object" as const,
      properties: {
        message: {
          type: "string",
          description:
            "Your next message to the user — warm, brief, one question at a time. Reflect back what you heard before asking the next thing.",
        },
        topics_covered: {
          type: "array",
          items: { type: "string", enum: TOPIC_KEYS },
          description:
            "Every topic you now have a meaningful read on, cumulatively across the whole conversation.",
        },
        extracted: {
          type: "object",
          properties: {
            values: { type: "array", items: { type: "string" }, description: "3–5 core values, single words or short phrases." },
            work_style: { type: "array", items: { type: "string" }, description: "Short phrases, e.g. 'deep focus over meetings'." },
            skills: { type: "array", items: { type: "string" }, description: "Soft + hard skills as tags. Light touch." },
            personality_signals: { type: "array", items: { type: "string" }, description: "Energy, pace, structure preference." },
            current_focus: { type: "string", description: "What they're working on now." },
            current_struggle: { type: "string", description: "What they're figuring out / stuck on." },
            ambitions: { type: "string", description: "Where they want to go." },
            suggested_mission_slugs: {
              type: "array",
              items: { type: "string", enum: missions.map((m) => m.slug) },
              description: "Mission slugs that fit this person, from the provided list only.",
            },
          },
        },
        is_complete: {
          type: "boolean",
          description:
            "True only once you have a meaningful read on most topics and have given a warm closing message.",
        },
      },
      required: ["message", "topics_covered", "is_complete"],
    },
  };
}

export function systemPrompt(missions: { slug: string; name: string }[]) {
  const missionList = missions.map((m) => `- ${m.slug}: ${m.name}`).join("\n");
  return `You are Versona's onboarding guide. Versona is a human-first professional community where people are understood, not just made employable. You are interviewing a new member through natural conversation — NEVER a form.

Your goal: across ~10–15 minutes, build a genuine read on these seven things, moving adaptively (not in rigid order):
1. work_style — how they operate, collaborate, communicate
2. values — what they care about at work and in life
3. personality — energy, pace, structure preference
4. current_reality — what they're working on and what they're figuring out
5. ambitions — where they want to go, what they want to build
6. skills — soft and hard, a LIGHT touch (never a resume dump)
7. missions — which community journeys resonate

Voice: warm, curious, human, concise. Anti-LinkedIn. One question at a time. Reflect back what you heard in a sentence before asking the next thing, so they feel understood. Never interrogate. Never use corporate jargon.

Rules:
- The user may skip any question ("skip", "pass", "rather not"). Acknowledge warmly and move on — never push.
- Keep each message short (1–3 sentences). Plain language.
- Extract conservatively and cumulatively: only record what they actually expressed.
- For missions, suggest ONLY from this list (by slug):
${missionList}
- After you have a meaningful read on most topics, set is_complete=true and give a warm closing line telling them you've put together a draft profile for them to review.
- You MUST call the onboarding_turn tool on every turn. Put your message to the user in the tool's "message" field — never write prose outside the tool.`;
}

/**
 * Scripted fallback (no ANTHROPIC_API_KEY). Deterministic question-per-topic so
 * the flow is fully demoable without a key. Extraction is intentionally minimal —
 * it stashes the user's own words into the most relevant field so the review
 * screen has real content. Replaced by genuine AI extraction once the key is set.
 */
const SCRIPTED_STEPS: { topic: TopicKey; ask: string }[] = [
  { topic: "current_reality", ask: "What's taking up most of your energy right now, work-wise?" },
  { topic: "current_reality", ask: "And what part of that are you still figuring out?" },
  { topic: "work_style", ask: "When you're doing your best work, what does that actually look like — deep focus, lots of collaboration, something else?" },
  { topic: "values", ask: "What matters most to you in how you work? Name a couple of things." },
  { topic: "personality", ask: "Are you more structured-and-planned or flexible-and-improvised? No wrong answer." },
  { topic: "ambitions", ask: "Where do you want this to go — what would you love to be building a year from now?" },
  { topic: "skills", ask: "Last one: what are a few things you're genuinely good at? Soft or hard, whatever comes to mind." },
  { topic: "missions", ask: "Got it. I'll line you up with a few community missions that fit. Ready to see the draft profile I put together?" },
];

export function scriptedTurn(history: ChatTurn[]): OnboardingTurnResult {
  const userTurns = history.filter((t) => t.role === "user");
  const answered = userTurns.length; // how many questions they've answered
  const lastAnswer = userTurns[userTurns.length - 1]?.content?.trim() ?? "";
  const skipped = /^(skip|pass|next|rather not|prefer not)/i.test(lastAnswer);

  // Accumulate a tiny extraction from the answer just given.
  const extracted: Partial<OnboardingExtraction> = {};
  const prevStep = SCRIPTED_STEPS[answered - 1];
  if (prevStep && !skipped && lastAnswer) {
    switch (prevStep.topic) {
      case "current_reality":
        if (answered === 1) extracted.current_focus = lastAnswer;
        else extracted.current_struggle = lastAnswer;
        break;
      case "work_style":
        extracted.work_style = splitPhrases(lastAnswer);
        break;
      case "values":
        extracted.values = splitPhrases(lastAnswer);
        break;
      case "personality":
        extracted.personality_signals = splitPhrases(lastAnswer);
        break;
      case "ambitions":
        extracted.ambitions = lastAnswer;
        break;
      case "skills":
        extracted.skills = splitPhrases(lastAnswer);
        break;
    }
  }

  const covered = SCRIPTED_STEPS.slice(0, answered).map((s) => s.topic);
  const next = SCRIPTED_STEPS[answered];
  const isComplete = answered >= SCRIPTED_STEPS.length;

  return {
    message: isComplete
      ? "Perfect — I've drafted your profile from everything you shared. Take a look and make it yours."
      : next.ask,
    topics_covered: Array.from(new Set(covered)) as TopicKey[],
    extracted,
    is_complete: isComplete,
    mode: "scripted",
  };
}

function splitPhrases(text: string): string[] {
  return text
    .split(/[,;]|\band\b|\n/i)
    .map((s) => s.trim().replace(/[.!?]+$/, "").trim())
    .filter((s) => s.length > 1 && s.length < 60)
    .slice(0, 5);
}

/** Is a real Anthropic key configured (not the .env.example placeholder)? */
export function hasAnthropicKey() {
  const k = process.env.ANTHROPIC_API_KEY;
  return !!k && !k.includes("placeholder") && k.startsWith("sk-ant-");
}
