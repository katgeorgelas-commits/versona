/**
 * App-level shared types (not the generated DB types).
 * Domain shapes the UI and AI layers pass around.
 */

export type SessionUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isAdmin: boolean;
};

export type PostType = "question" | "discussion" | "prompt_response" | "update";

export type ReactionKind = "resonates" | "needed_this" | "lets_connect" | "helpful";

export type ConnectionStatus = "pending" | "accepted" | "declined";

export type ProfileVisibility = "public" | "connections" | "private";

export type NotificationType =
  | "reply"
  | "connection_request"
  | "connection_accepted"
  | "message"
  | "weekly_prompt"
  | "profile_view"
  | "reaction"
  | "profile_gap";

/** Structured profile data the onboarding AI extracts from conversation. */
export type ExtractedProfile = {
  headlineSuggestions: string[];
  identitySnapshot: string;
  values: string[];
  workStyle: string[];
  skills: string[];
  currentFocus: string;
  currentStruggle: string;
  ambitions: string;
  suggestedMissionSlugs: string[];
};

/** One turn in the conversational onboarding transcript. */
export type OnboardingTurn = {
  role: "assistant" | "user";
  content: string;
  ts: string;
};
