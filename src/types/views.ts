/**
 * View models — the shapes the UI consumes. Data modules build these from either
 * Supabase or the offline demo store, so components never care about the source.
 */
import type { PostType, ReactionKind } from "./app";

export type PersonCard = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  headline: string | null;
  values: string[];
  lastActiveAt: string | null;
  online?: boolean;
};

export type ProfileView = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  headline: string | null;
  headlineTemplate: string | null;
  identitySnapshot: string | null;
  values: string[];
  workStyle: string[];
  skills: string[];
  currentFocus: string | null;
  currentStruggle: string | null;
  ambitions: string | null;
  links: { label: string; url: string }[];
  completeness: number;
  careerIdentityScore: number | null;
  // Iteration fields
  location: string | null;
  industry: string | null;
  prompts: { id: string; question: string; answer: string }[];
  experience: { id: string; kind: "work" | "education"; title: string; org: string; period: string }[];
  certifications: { id: string; name: string; issuer: string; year: string }[];
  signature: {
    slug: string; // canonical signature library entry — see src/config/signatures.ts
    personaName: string;
    personaTagline: string;
    voice: string[]; // 3–5 first-person lines the AI surfaced from this person specifically
    dimensions: { key: string; label: string; score: number; tags: string[] }[];
  } | null;
  missions: MissionSummary[];
  followerCount: number;
  followingCount: number;
  postCount: number;
  // Engagement
  endorsements: Record<string, number>; // skill -> endorsement count
  endorsedByMe: string[]; // skills the viewer has endorsed
  reputation: number; // karma — reactions received across posts
  mutuals: number; // mutual connections with the viewer
  // Viewer-relative state
  isSelf: boolean;
  isFollowing: boolean;
  connectionStatus: "none" | "pending" | "incoming" | "connected";
};

export type MissionSummary = {
  id: string;
  slug: string;
  name: string;
  accentColor: string;
  icon: string;
  kind: "mission" | "circle";
};

export type MissionView = MissionSummary & {
  brief: string;
  memberCount: number;
  isMember: boolean;
  weeklyPrompt: string | null;
  weeklyPromptId: string | null;
  newThisWeek: number; // posts in the last 7 days — drives the "heat" signal
};

/** One step of a mission's journey. */
export type StageView = {
  id: string;
  order: number;
  name: string;
  description: string;
  memberCount: number; // members currently standing on this stage
  isMine: boolean; // the viewer placed themselves here
};

/** A member who is further along the same journey than the viewer. */
export type StepAheadPerson = PersonCard & {
  stageName: string;
  stageOrder: number;
  stepsAhead: number;
};

/** The full journey view for a mission (stages + the viewer's place in it). */
export type JourneyView = {
  hasStages: boolean;
  stages: StageView[];
  myStageId: string | null;
  myStageOrder: number | null;
  peopleAhead: StepAheadPerson[];
  // Steward (admin) review surface — AI/draft stages awaiting a human's approval.
  canManage: boolean;
  draftStages: { id: string; order: number; name: string; description: string; source: string }[];
};

export type ReactionSummary = {
  counts: Partial<Record<ReactionKind, number>>;
  mine: ReactionKind[];
  total: number;
  reactors: PersonCard[]; // a few recent reactors, for social proof
};

export type PollView = {
  options: { id: string; text: string; votes: number }[];
  totalVotes: number;
  myVote: string | null;
};

export type PostView = {
  id: string;
  type: PostType;
  author: PersonCard;
  authorLocation: string | null;
  authorIndustry: string | null;
  bodyHtml: string;
  bodyText: string;
  mission: MissionSummary | null;
  missionIsMember: boolean; // viewer already a member of the post's space?
  topics: string[];
  imageUrl: string | null;
  aiFlagged: boolean;
  createdAt: string;
  replyCount: number;
  reactions: ReactionSummary;
  saved: boolean;
  isPromptResponse: boolean;
  promptText: string | null;
  // Engagement extensions
  isOwn: boolean;
  edited: boolean;
  poll: PollView | null;
  repostOf: PostView | null;
  repostCount: number;
};

export type ReplyView = {
  id: string;
  postId: string;
  author: PersonCard;
  bodyText: string;
  createdAt: string;
  parentReplyId: string | null;
  likes: number;
  likedByMe: boolean;
  isOwn: boolean;
};

export type ThreadView = {
  id: string;
  other: PersonCard;
  state: "request" | "accepted" | "blocked";
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  unread: number;
  initiatedByMe: boolean;
};

export type MessageView = {
  id: string;
  threadId: string;
  senderId: string;
  mine: boolean;
  body: string;
  createdAt: string;
  readAt: string | null;
  reactions: { emoji: string; count: number; mine: boolean }[];
};

export type NotificationView = {
  id: string;
  type: string;
  actor: PersonCard | null;
  summary: string;
  entityType: string | null;
  entityId: string | null;
  href: string | null;
  createdAt: string;
  read: boolean;
};
