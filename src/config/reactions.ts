import type { ReactionKind, PostType } from "@/types/app";

/**
 * Reactions go beyond "like" (PRD §3.4). Each one is a small social signal that
 * nudges toward conversation and connection rather than vanity metrics.
 */
export const REACTIONS: Record<
  ReactionKind,
  { label: string; emoji: string; description: string }
> = {
  resonates: {
    label: "This resonates",
    emoji: "💜",
    description: "This hit home for me.",
  },
  needed_this: {
    label: "I needed this",
    emoji: "🙏",
    description: "Thank you for posting this.",
  },
  lets_connect: {
    label: "Let's connect",
    emoji: "🤝",
    description: "I'd like to know you.",
  },
  helpful: {
    label: "Helpful",
    emoji: "💡",
    description: "This was useful.",
  },
};

export const REACTION_ORDER: ReactionKind[] = [
  "resonates",
  "needed_this",
  "helpful",
  "lets_connect",
];

/** Post-type presentation metadata for composer + feed badges. */
export const POST_TYPES: Record<
  PostType,
  { label: string; verb: string; icon: string; hint: string }
> = {
  question: {
    label: "Question",
    verb: "Ask",
    icon: "help-circle",
    hint: "Ask the community something you're stuck on.",
  },
  discussion: {
    label: "Discussion",
    verb: "Share",
    icon: "message-square",
    hint: "Share a thought, challenge, win, or lesson.",
  },
  prompt_response: {
    label: "Prompt response",
    verb: "Respond",
    icon: "sparkles",
    hint: "Respond to this week's mission prompt.",
  },
  update: {
    label: "Update",
    verb: "Post update",
    icon: "activity",
    hint: "What are you working on this week?",
  },
};
