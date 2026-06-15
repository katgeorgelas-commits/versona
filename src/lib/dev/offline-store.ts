import type { PostType, ReactionKind } from "@/types/app";
import { OFFLINE_MISSIONS, OFFLINE_USERS } from "./offline";

/**
 * In-memory demo store — dev/offline only.
 *
 * A tiny in-process "database" that powers the platform when Supabase isn't
 * running, so the whole app is clickable without Docker. Writes mutate these
 * module-level arrays and persist for the life of the dev server process (a
 * single Node process in `next dev`), which is exactly what a demo needs.
 *
 * NEVER used when a real Supabase URL is configured — see isOfflineDemo().
 */

const now = Date.now();
const min = (m: number) => new Date(now - m * 60_000).toISOString();
const hr = (h: number) => min(h * 60);
const day = (d: number) => hr(d * 24);

export type MissionRecord = {
  id: string;
  slug: string;
  name: string;
  brief: string;
  accent_color: string;
  icon: string;
  display_order: number;
  kind: "mission" | "circle";
};

export type ProfileRecord = {
  user_id: string;
  headline: string | null;
  headline_template: string | null;
  identity_snapshot: string | null;
  values: string[];
  work_style: string[];
  skills: string[];
  current_focus: string | null;
  current_struggle: string | null;
  ambitions: string | null;
  links: { label: string; url: string }[];
  completeness: number;
  career_identity_score: number | null;
  // Iteration: location/industry + Hinge-style prompts + experience
  location: string | null;
  industry: string | null;
  prompts: { id: string; answer: string }[];
  experience: { id: string; kind: "work" | "education"; title: string; org: string; period: string }[];
  certifications: { id: string; name: string; issuer: string; year: string }[];
  // AI-derived "Signature" — built during onboarding from values, work style, skills,
  // and conversational answers. Strengths-only (no weakness scoring shown).
  signature?: {
    slug: string;
    personaName: string;
    personaTagline: string;
    voice: string[];
    dimensions: { key: string; label: string; score: number; tags: string[] }[];
  } | null;
};

export type PostRecord = {
  id: string;
  author_id: string;
  type: PostType;
  body_text: string;
  body_html: string;
  mission_id: string | null;
  weekly_prompt_id: string | null;
  topics: string[];
  image_url: string | null;
  ai_flagged: boolean;
  created_at: string;
  // Engagement extensions
  repost_of?: string | null; // original post id (repost / quote)
  poll?: { options: { id: string; text: string }[]; votes: Record<string, string> } | null;
  edited_at?: string | null;
  pinned?: boolean;
};

export type ReplyRecord = {
  id: string;
  post_id: string;
  author_id: string;
  body_text: string;
  created_at: string;
  parent_reply_id?: string | null;
};
export type ReplyLikeRecord = { reply_id: string; user_id: string };

export type ReactionRecord = { post_id: string; user_id: string; kind: ReactionKind };
export type EndorsementRecord = { user_id: string; skill: string; endorser_id: string };
export type MessageReactionRecord = { message_id: string; user_id: string; emoji: string };
export type MomentRecord = { id: string; author_id: string; text: string; created_at: string };
export type FollowRecord = { follower_id: string; following_id: string };
export type ConnectionRecord = {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: "pending" | "accepted" | "declined";
  note: string;
  created_at: string;
};
export type ThreadRecord = {
  id: string;
  user_a: string;
  user_b: string;
  state: "request" | "accepted" | "blocked";
  initiated_by: string;
  last_message_at: string | null;
};
export type MessageRecord = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};
export type NotificationRecord = {
  id: string;
  recipient_id: string;
  type: string;
  actor_id: string | null;
  summary: string;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
  read_at: string | null;
};
export type WeeklyPromptRecord = { id: string; mission_id: string; prompt: string };
export type MissionRequestRecord = {
  id: string;
  name: string;
  brief: string;
  kind: "mission" | "circle";
  requester_id: string;
  status: "pending" | "approved" | "declined";
  created_at: string;
};

/**
 * Mission journey layer — only missions (not circles) have stages.
 * Stages are the named steps of a journey ("Validating the idea" → "Ready to
 * scale"). They start life as `draft` (AI- or steward-authored) and become
 * `published` only after a human approves them — the AI never publishes copy.
 */
export type StageRecord = {
  id: string;
  mission_id: string;
  position: number; // 1-based order along the journey
  name: string;
  description: string;
  status: "published" | "draft";
  source: "curated" | "ai" | "scripted" | "member";
};
/** Where a member has placed themselves on a mission's journey (one per mission). */
export type MemberStageRecord = { mission_id: string; user_id: string; stage_id: string };

const U = OFFLINE_USERS;

type StoreShape = {
  missions: MissionRecord[];
  profiles: ProfileRecord[];
  memberships: { mission_id: string; user_id: string }[];
  follows: FollowRecord[];
  connections: ConnectionRecord[];
  posts: PostRecord[];
  replies: ReplyRecord[];
  replyLikes: ReplyLikeRecord[];
  reactions: ReactionRecord[];
  saved: { user_id: string; post_id: string }[];
  threads: ThreadRecord[];
  messages: MessageRecord[];
  messageReactions: MessageReactionRecord[];
  notifications: NotificationRecord[];
  weeklyPrompts: WeeklyPromptRecord[];
  globalPrompt: string; // one community-wide weekly prompt for the home feed
  missionRequests: MissionRequestRecord[];
  stages: StageRecord[];
  memberStages: MemberStageRecord[];
  endorsements: EndorsementRecord[];
  moments: MomentRecord[];
  seq: number;
};

function build(): StoreShape {
  const missions: MissionRecord[] = OFFLINE_MISSIONS.map((m, i) => ({
    id: `mission-${i + 1}`,
    slug: m.slug,
    name: m.name,
    brief: m.brief,
    accent_color: m.accent_color,
    icon: m.icon,
    display_order: i + 1,
    kind: m.kind,
  }));
  const bySlug = (s: string) => missions.find((m) => m.slug === s)!.id;

  const profiles: ProfileRecord[] = [
    {
      user_id: U.maya.id,
      headline: "Currently launching my first startup, struggling with customer acquisition",
      headline_template: "currently-struggling",
      identity_snapshot:
        "Maya is a former federal analyst turned founder who cares deeply about doing honest work that helps people. She moves fast, thinks in systems, and is happiest building alongside people she trusts.",
      values: ["Honesty", "Impact", "Autonomy", "Craft"],
      work_style: ["Deep focus over meetings", "Thrives in ambiguity", "Direct communicator"],
      skills: ["Product strategy", "Data analysis", "Storytelling", "Early-stage GTM"],
      current_focus: "Getting my first 100 users for a tool that helps displaced workers find their footing.",
      current_struggle: "Figuring out customer acquisition without a marketing budget.",
      ambitions: "Build a company that proves human-first hiring can win.",
      links: [{ label: "My project", url: "https://example.com" }],
      completeness: 90,
      career_identity_score: null,
      location: "Washington, DC",
      industry: "Technology / Startups",
      prompts: [
        { id: "proud_of", answer: "Walked away from a stable federal job to build something that actually helps displaced workers." },
        { id: "looking_to_meet", answer: "Early founders who've cracked customer acquisition with no budget." },
        { id: "energized_by", answer: "Turning a messy real-world problem into a simple product people love." },
      ],
      experience: [
        { id: "x1", kind: "work", title: "Founder", org: "Versona (early-stage)", period: "2025 — now" },
        { id: "x2", kind: "work", title: "Senior Analyst", org: "U.S. Federal Agency", period: "2019 — 2025" },
        { id: "x3", kind: "education", title: "B.A. Economics", org: "University of Virginia", period: "2015 — 2019" },
      ],
      certifications: [
        { id: "c1", name: "Google Analytics Certified", issuer: "Google", year: "2023" },
      ],
      signature: {
        slug: "architect",
        personaName: "The Architect",
        personaTagline: "Builds clarity out of ambiguity. Moves fast, asks the right questions, and prefers shipping to talking.",
        voice: [
          "I'll listen, but I'm going to push back if I think we're solving the wrong problem.",
          "Give me a messy problem and a few days of quiet — that's when I do my best work.",
          "I prefer one honest 'this won't work' over five meetings of polite hedging.",
          "Founders I respect ship things that look ugly on day one and right by day thirty.",
        ],
        dimensions: [
          { key: "craft", label: "Craft", score: 88, tags: ["Product strategy", "Storytelling"] },
          { key: "autonomy", label: "Autonomy", score: 92, tags: ["Thrives in ambiguity", "Deep focus over meetings"] },
          { key: "directness", label: "Directness", score: 84, tags: ["Direct communicator", "Honesty"] },
          { key: "systems", label: "Systems Thinking", score: 80, tags: ["Data analysis", "Early-stage GTM"] },
          { key: "drive", label: "Drive", score: 90, tags: ["Impact", "Founder energy"] },
          { key: "collaboration", label: "Collaboration", score: 62, tags: ["Trusted partner mode"] },
        ],
      },
    },
    {
      user_id: U.dev.id,
      headline: "In transition from agency design to product, looking for people who've made the jump",
      headline_template: "building-looking",
      identity_snapshot:
        "Dev is a designer moving from agency work into product. Curious, collaborative, and a little restless — he learns by shipping and wants teammates who push his thinking.",
      values: ["Growth", "Curiosity", "Collaboration"],
      work_style: ["Async-first", "Structured communicator", "Energized by feedback"],
      skills: ["UX design", "Design systems", "Prototyping", "Figma"],
      current_focus: "Learning product thinking and rebuilding my portfolio around outcomes.",
      current_struggle: "Imposter syndrome around the business side of product.",
      ambitions: "Become a product designer at a mission-driven team.",
      links: [],
      completeness: 75,
      career_identity_score: null,
      location: "Arlington, VA",
      industry: "Design / Product",
      prompts: [
        { id: "learning", answer: "Product thinking — how to argue for design decisions with outcomes, not aesthetics." },
        { id: "outside_work", answer: "Bouldering, film photography, and over-engineering my coffee setup." },
      ],
      experience: [
        { id: "x1", kind: "work", title: "Product Designer (in transition)", org: "Freelance", period: "2024 — now" },
        { id: "x2", kind: "work", title: "Visual Designer", org: "Brand Agency", period: "2020 — 2024" },
      ],
      certifications: [
        { id: "c1", name: "Figma Professional Certificate", issuer: "Figma", year: "2024" },
        { id: "c2", name: "Interaction Design Foundation", issuer: "IxDF", year: "2023" },
      ],
      signature: {
        slug: "apprentice",
        personaName: "The Apprentice",
        personaTagline: "Learns by shipping and welcomes the rewrite. Strongest when paired with people who push his thinking.",
        voice: [
          "Tell me what's wrong with my work — I learn faster than I take it personally.",
          "I'll ship a v0.1 before you finish the spec doc, and I'll happily throw it away.",
          "My best work happens in pairs. Think out loud with me.",
          "Six months from now I'll be doing things I can't do today. That's the point.",
        ],
        dimensions: [
          { key: "growth", label: "Growth Mindset", score: 94, tags: ["Growth", "Curiosity", "Energized by feedback"] },
          { key: "craft", label: "Craft", score: 78, tags: ["UX design", "Design systems", "Prototyping"] },
          { key: "communication", label: "Communication", score: 82, tags: ["Structured communicator", "Async-first"] },
          { key: "collaboration", label: "Collaboration", score: 86, tags: ["Collaboration", "Generous reviewer"] },
          { key: "adaptability", label: "Adaptability", score: 80, tags: ["In transition", "Cross-discipline"] },
          { key: "drive", label: "Drive", score: 70, tags: ["Building portfolio momentum"] },
        ],
      },
    },
    {
      user_id: U.sasha.id,
      headline: "Building in public — a newsletter for career switchers, 400 subscribers and growing",
      headline_template: "building-looking",
      identity_snapshot:
        "Sasha is a writer and community-builder who turned her own career pivot into a public project. Warm, consistent, and generous with what she learns.",
      values: ["Generosity", "Consistency", "Community"],
      work_style: ["Lives in public", "Morning maker", "Encouraging communicator"],
      skills: ["Writing", "Community building", "Newsletter growth", "Public speaking"],
      current_focus: "Growing my newsletter and turning it into a real community.",
      current_struggle: "Staying consistent without burning out.",
      ambitions: "Turn my audience into a sustainable independent business.",
      links: [{ label: "Newsletter", url: "https://example.com/news" }],
      completeness: 85,
      career_identity_score: null,
      location: "Remote (DMV)",
      industry: "Media / Writing",
      prompts: [
        { id: "can_help", answer: "Going from zero to your first 100 newsletter subscribers." },
        { id: "care_about", answer: "Making career change feel less lonely and less mysterious." },
        { id: "advice", answer: "“Consistency beats brilliance.” The post you almost don't send is usually the one that lands." },
      ],
      experience: [
        { id: "x1", kind: "work", title: "Writer & Community Builder", org: "The Switch (newsletter)", period: "2023 — now" },
        { id: "x2", kind: "work", title: "Marketing Manager", org: "SaaS Co.", period: "2018 — 2023" },
      ],
      certifications: [],
      signature: {
        slug: "connector",
        personaName: "The Connector",
        personaTagline: "Turns her own journey into a public path others can follow. Steady, generous, and consistent.",
        voice: [
          "I show up consistently. Mornings are sacred — that's when the real work happens.",
          "I'd rather make ten people feel deeply seen than impress a thousand.",
          "If we build together, I'll bring you in publicly. Credit travels with me.",
          "The post you almost don't send is usually the one that lands.",
        ],
        dimensions: [
          { key: "consistency", label: "Consistency", score: 92, tags: ["Consistency", "Morning maker"] },
          { key: "communication", label: "Communication", score: 90, tags: ["Writing", "Public speaking"] },
          { key: "community", label: "Community", score: 95, tags: ["Community", "Community building", "Encouraging communicator"] },
          { key: "generosity", label: "Generosity", score: 88, tags: ["Generosity", "Lives in public"] },
          { key: "growth", label: "Growth Mindset", score: 76, tags: ["Newsletter growth"] },
          { key: "drive", label: "Drive", score: 80, tags: ["Independent business builder"] },
        ],
      },
    },
    {
      user_id: U.admin.id,
      headline: "Versona team",
      headline_template: null,
      identity_snapshot: "The team behind Versona.",
      values: [],
      work_style: [],
      skills: [],
      current_focus: null,
      current_struggle: null,
      ambitions: null,
      links: [],
      completeness: 30,
      career_identity_score: null,
      location: null,
      industry: null,
      prompts: [],
      experience: [],
      certifications: [],
    },
  ];

  const memberships = [
    { mission_id: bySlug("launching-my-first-business"), user_id: U.maya.id },
    { mission_id: bySlug("launching-my-first-business"), user_id: U.dev.id },
    { mission_id: bySlug("launching-my-first-business"), user_id: U.sasha.id },
    { mission_id: bySlug("building-in-public"), user_id: U.maya.id },
    { mission_id: bySlug("finding-my-people"), user_id: U.maya.id },
    { mission_id: bySlug("career-transition"), user_id: U.dev.id },
    { mission_id: bySlug("career-transition"), user_id: U.sasha.id },
    { mission_id: bySlug("breaking-into-tech"), user_id: U.dev.id },
    { mission_id: bySlug("first-90-days"), user_id: U.dev.id },
    { mission_id: bySlug("building-in-public"), user_id: U.sasha.id },
    { mission_id: bySlug("freelancing-full-time"), user_id: U.sasha.id },
    { mission_id: bySlug("finding-my-people"), user_id: U.sasha.id },
    // Auto-enroll everyone in Versona Asks
    { mission_id: bySlug("versona-asks"), user_id: U.maya.id },
    { mission_id: bySlug("versona-asks"), user_id: U.dev.id },
    { mission_id: bySlug("versona-asks"), user_id: U.sasha.id },
    { mission_id: bySlug("versona-asks"), user_id: U.admin.id },
  ];

  // ── Mission journey stages (published) + where each member stands ──────────
  // Two missions ship with a curated journey so the "stages" + "people a few
  // steps ahead" experience is demoable out of the box. Other missions have no
  // stages yet — an admin can draft them with AI from the mission page.
  const launching = bySlug("launching-my-first-business");
  const transition = bySlug("career-transition");

  const stageSeed: { mission_id: string; names: [string, string][] }[] = [
    {
      mission_id: launching,
      names: [
        ["Validating the idea", "Pressure-testing the problem before building. Talking to real people, not writing code yet."],
        ["Building the MVP", "Heads-down making the first version real. Scrappy, ugly, and shippable beats perfect."],
        ["First users", "Getting it in front of actual humans and learning what truly matters to them."],
        ["Early traction", "A handful of users who'd be upset if it vanished. Finding what's repeatable."],
        ["Ready to scale", "The loop works. Now it's doing more of what's working, faster and on purpose."],
      ],
    },
    {
      mission_id: transition,
      names: [
        ["Realizing it's time", "Naming the itch. Admitting the current path isn't the one anymore."],
        ["Exploring directions", "Researching fields, talking to people, figuring out what's actually possible."],
        ["Building the bridge", "Closing the gap — skills, portfolio, network — toward the new thing."],
        ["Making the leap", "Interviewing, applying, negotiating. One foot already in the new world."],
        ["Landed & growing", "In the new role or field. Finding footing and helping the next person across."],
      ],
    },
  ];

  const stages: StageRecord[] = [];
  stageSeed.forEach((m, mi) => {
    m.names.forEach(([name, description], i) => {
      stages.push({
        id: `stage-${mi + 1}-${i + 1}`,
        mission_id: m.mission_id,
        position: i + 1,
        name,
        description,
        status: "published",
        source: "curated",
      });
    });
  });
  const stageOf = (missionId: string, pos: number) =>
    stages.find((s) => s.mission_id === missionId && s.position === pos)!.id;

  // Placements spread members across the arc so "a few steps ahead" has signal.
  // launching: dev @1, maya @2 (default demo viewer), sasha @4.
  // transition: dev @3, sasha @5.
  const memberStages: MemberStageRecord[] = [
    { mission_id: launching, user_id: U.dev.id, stage_id: stageOf(launching, 1) },
    { mission_id: launching, user_id: U.maya.id, stage_id: stageOf(launching, 2) },
    { mission_id: launching, user_id: U.sasha.id, stage_id: stageOf(launching, 4) },
    { mission_id: transition, user_id: U.dev.id, stage_id: stageOf(transition, 3) },
    { mission_id: transition, user_id: U.sasha.id, stage_id: stageOf(transition, 5) },
  ];

  const weeklyPrompts: WeeklyPromptRecord[] = missions.map((m, i) => ({
    id: `wp-${i + 1}`,
    mission_id: m.id,
    prompt:
      "What's the one thing you're stuck on this week that someone here might have already solved?",
  }));

  const posts: PostRecord[] = [
    {
      id: "post-1",
      author_id: U.maya.id,
      type: "question",
      body_text:
        "How did you get your first 100 users with zero ad budget? I keep hearing 'do things that don't scale' but I'd love specifics from people who've actually done it. #growth #early-stage",
      body_html: "",
      mission_id: bySlug("launching-my-first-business"),
      weekly_prompt_id: weeklyPrompts.find((w) => w.mission_id === bySlug("launching-my-first-business"))!.id,
      topics: ["growth", "early-stage"],
      image_url: null,
      ai_flagged: false,
      created_at: hr(3),
    },
    {
      id: "post-2",
      author_id: U.sasha.id,
      type: "discussion",
      body_text:
        "Week 14 of building in public: hit 400 subscribers. The thing nobody tells you — consistency beats brilliance. My best-performing issue was the one I almost didn't send. #writing #audience",
      body_html: "",
      mission_id: bySlug("building-in-public"),
      weekly_prompt_id: null,
      topics: ["writing", "audience"],
      image_url: null,
      ai_flagged: false,
      created_at: hr(6),
    },
    {
      id: "post-3",
      author_id: U.dev.id,
      type: "question",
      body_text:
        "For folks who moved from agency to product design — how did you reframe your portfolio? Mine is all pretty screens and I know that's not what product teams want to see. #design #portfolio",
      body_html: "",
      mission_id: bySlug("career-transition"),
      weekly_prompt_id: null,
      topics: ["design", "portfolio"],
      image_url: null,
      ai_flagged: false,
      created_at: hr(10),
    },
    {
      id: "post-4",
      author_id: U.sasha.id,
      type: "update",
      body_text:
        "This week I'm experimenting with a weekly office-hours call for my readers. Trying to turn an audience into an actual #community. Wish me luck.",
      body_html: "",
      mission_id: bySlug("finding-my-people"),
      weekly_prompt_id: null,
      topics: ["community"],
      image_url: null,
      ai_flagged: false,
      created_at: day(1),
    },
    {
      id: "post-5",
      author_id: U.dev.id,
      type: "discussion",
      body_text:
        "Reminder to anyone breaking into tech: the gap between 'tutorial done' and 'I built a real thing' is where all the #learning is. Ship the messy version.",
      body_html: "",
      mission_id: bySlug("breaking-into-tech"),
      weekly_prompt_id: null,
      topics: ["learning"],
      image_url: null,
      ai_flagged: false,
      created_at: day(2),
    },
    {
      id: "post-6",
      author_id: U.maya.id,
      type: "discussion",
      body_text:
        "Leaving a stable government job to build something was the scariest decision I've made. Six months in, no regrets — but the loneliness is real. Grateful for spaces like this. #founder-life",
      body_html: "",
      mission_id: bySlug("launching-my-first-business"),
      weekly_prompt_id: null,
      topics: ["founder-life"],
      image_url: null,
      ai_flagged: false,
      created_at: day(3),
    },
    {
      id: "post-7",
      author_id: U.sasha.id,
      type: "question",
      body_text: "Quick gut-check for everyone building an audience: what actually moved the needle most for you? #audience #growth",
      body_html: "",
      mission_id: bySlug("building-in-public"),
      weekly_prompt_id: null,
      topics: ["audience", "growth"],
      image_url: null,
      ai_flagged: false,
      created_at: hr(8),
      poll: {
        options: [
          { id: "o1", text: "Consistency / showing up daily" },
          { id: "o2", text: "One viral post" },
          { id: "o3", text: "Engaging in others' comments" },
          { id: "o4", text: "Collaborations / cross-promo" },
        ],
        votes: { [U.maya.id]: "o1", [U.dev.id]: "o3", [U.admin.id]: "o1" },
      },
    },
    {
      id: "post-8",
      author_id: U.maya.id,
      type: "discussion",
      body_text: "This is exactly the mindset shift I needed this week 👇",
      body_html: "",
      mission_id: null,
      weekly_prompt_id: null,
      topics: [],
      image_url: null,
      ai_flagged: false,
      created_at: hr(4),
      repost_of: "post-2",
    },
  ];

  const reactions: ReactionRecord[] = [
    { post_id: "post-1", user_id: U.sasha.id, kind: "helpful" },
    { post_id: "post-1", user_id: U.dev.id, kind: "needed_this" },
    { post_id: "post-2", user_id: U.maya.id, kind: "resonates" },
    { post_id: "post-2", user_id: U.dev.id, kind: "needed_this" },
    { post_id: "post-2", user_id: U.admin.id, kind: "helpful" },
    { post_id: "post-6", user_id: U.sasha.id, kind: "resonates" },
    { post_id: "post-6", user_id: U.dev.id, kind: "resonates" },
    { post_id: "post-6", user_id: U.admin.id, kind: "needed_this" },
  ];

  const replies: ReplyRecord[] = [
    {
      id: "reply-1",
      post_id: "post-1",
      author_id: U.sasha.id,
      body_text:
        "I DM'd 50 people who complained about the exact problem I solved, one at a time. 12 replied, 4 became my first real users. Painfully manual, totally worth it.",
      created_at: hr(2),
    },
    {
      id: "reply-2",
      post_id: "post-1",
      author_id: U.maya.id,
      body_text: "@sasha this is gold — how did you find the people complaining? Cold search?",
      created_at: hr(1.5),
      parent_reply_id: "reply-1",
    },
    {
      id: "reply-3",
      post_id: "post-1",
      author_id: U.dev.id,
      body_text: "Following this — I'm about to hit the same wall with my portfolio launch.",
      created_at: hr(1),
    },
  ];

  const replyLikes: ReplyLikeRecord[] = [
    { reply_id: "reply-1", user_id: U.maya.id },
    { reply_id: "reply-1", user_id: U.dev.id },
  ];

  const follows: FollowRecord[] = [
    { follower_id: U.maya.id, following_id: U.sasha.id },
    { follower_id: U.dev.id, following_id: U.maya.id },
  ];

  const connections: ConnectionRecord[] = [
    {
      id: "conn-1",
      requester_id: U.sasha.id,
      recipient_id: U.maya.id,
      status: "accepted",
      note: "Loved your post about leaving govt work — I made a similar leap. Would love to compare notes.",
      created_at: day(2),
    },
    {
      id: "conn-2",
      requester_id: U.dev.id,
      recipient_id: U.maya.id,
      status: "pending",
      note: "Hi Maya! I'm moving into product and your systems-thinking really resonates. Open to connecting?",
      created_at: hr(5),
    },
  ];

  const threads: ThreadRecord[] = [
    {
      id: "thread-1",
      user_a: U.maya.id < U.sasha.id ? U.maya.id : U.sasha.id,
      user_b: U.maya.id < U.sasha.id ? U.sasha.id : U.maya.id,
      state: "accepted",
      initiated_by: U.sasha.id,
      last_message_at: hr(1),
    },
  ];

  const messages: MessageRecord[] = [
    { id: "msg-1", thread_id: "thread-1", sender_id: U.sasha.id, body: "Hey Maya! Your post hit home. How are you finding the founder loneliness lately?", created_at: hr(2), read_at: hr(1) },
    { id: "msg-2", thread_id: "thread-1", sender_id: U.maya.id, body: "Honestly some days are rough, but communities like this help a lot. How's the newsletter going?", created_at: hr(1.5), read_at: hr(1) },
    { id: "msg-3", thread_id: "thread-1", sender_id: U.sasha.id, body: "Growing slowly but steadily! We should do a swap sometime.", created_at: hr(1), read_at: null },
  ];

  const notifications: NotificationRecord[] = [
    { id: "notif-1", recipient_id: U.maya.id, type: "connection_request", actor_id: U.dev.id, summary: "Dev Patel wants to connect", entity_type: "connection", entity_id: "conn-2", created_at: hr(5), read_at: null },
    { id: "notif-2", recipient_id: U.maya.id, type: "reaction", actor_id: U.sasha.id, summary: "Sasha Romano reacted to your post", entity_type: "post", entity_id: "post-6", created_at: hr(4), read_at: null },
    { id: "notif-3", recipient_id: U.maya.id, type: "reply", actor_id: U.sasha.id, summary: "Sasha Romano replied to your question", entity_type: "post", entity_id: "post-1", created_at: hr(2), read_at: hr(1) },
    { id: "notif-4", recipient_id: U.maya.id, type: "message", actor_id: U.sasha.id, summary: "New message from Sasha Romano", entity_type: "thread", entity_id: "thread-1", created_at: hr(1), read_at: null },
  ];

  const endorsements: EndorsementRecord[] = [
    { user_id: U.maya.id, skill: "Product strategy", endorser_id: U.sasha.id },
    { user_id: U.maya.id, skill: "Product strategy", endorser_id: U.dev.id },
    { user_id: U.maya.id, skill: "Storytelling", endorser_id: U.sasha.id },
    { user_id: U.sasha.id, skill: "Writing", endorser_id: U.maya.id },
    { user_id: U.dev.id, skill: "UX design", endorser_id: U.maya.id },
  ];

  const moments: MomentRecord[] = [
    { id: "moment-1", author_id: U.sasha.id, text: "Shipped issue #14 of the newsletter 🚀", created_at: hr(3) },
    { id: "moment-2", author_id: U.dev.id, text: "First product design interview booked!", created_at: hr(6) },
  ];

  const messageReactions: MessageReactionRecord[] = [
    { message_id: "msg-1", user_id: U.maya.id, emoji: "❤️" },
  ];

  return {
    missions,
    profiles,
    memberships,
    follows,
    connections,
    posts,
    replies,
    replyLikes,
    reactions,
    saved: [],
    threads,
    messages,
    messageReactions,
    notifications,
    weeklyPrompts,
    globalPrompt: "What's one thing you learned this week that you wish you'd known a year ago?",
    missionRequests: [
      { id: "mreq-1", name: "Working Parents in Tech", brief: "For parents balancing a tech career with family — schedules, guilt, logistics, and wins.", kind: "circle", requester_id: U.sasha.id, status: "pending", created_at: day(1) },
    ],
    stages,
    memberStages,
    endorsements,
    moments,
    seq: 1000,
  };
}

/**
 * Singleton across hot reloads in dev (globalThis cache) so writes survive
 * Fast Refresh while you click around.
 */
const g = globalThis as unknown as { __versonaStore?: StoreShape };
export const store: StoreShape = g.__versonaStore ?? (g.__versonaStore = build());

/**
 * Backfill new profile fields on cached stores from prior dev sessions, so
 * adding a field (e.g. `signature`) doesn't require restarting the dev server.
 * Pulls the canonical seed and copies any newly added field that's missing.
 */
(function backfillProfileFields() {
  const fresh = build().profiles;
  for (const p of store.profiles) {
    const seed = fresh.find((f) => f.user_id === p.user_id);
    if (!seed) continue;
    // Replace older signature shape (missing slug/voice) wholesale with the fresh seed.
    const sig = p.signature;
    if (!sig || typeof (sig as { slug?: unknown }).slug !== "string") {
      p.signature = seed.signature ?? null;
    }
  }
})();

export function nextId(prefix: string) {
  store.seq += 1;
  return `${prefix}-${store.seq}`;
}

export function nowIso() {
  return new Date().toISOString();
}

/** Open (or upgrade) the canonical 2-party thread between a and b. */
export function ensureThread(
  a: string,
  b: string,
  initiatedBy: string,
  state: "request" | "accepted",
): ThreadRecord {
  const [user_a, user_b] = a < b ? [a, b] : [b, a];
  let t = store.threads.find((x) => x.user_a === user_a && x.user_b === user_b);
  if (!t) {
    t = {
      id: nextId("thread"),
      user_a,
      user_b,
      state,
      initiated_by: initiatedBy,
      last_message_at: null,
    };
    store.threads.push(t);
  } else if (state === "accepted") {
    t.state = "accepted";
  }
  return t;
}
