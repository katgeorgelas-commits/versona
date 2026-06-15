/**
 * Profile prompts (Hinge-style) — applicable to everyone, not just founders.
 * Users pick 2–3 and write a short answer to showcase who they are.
 */
export type ProfilePrompt = { id: string; question: string };

export const PROFILE_PROMPTS: ProfilePrompt[] = [
  { id: "learning", question: "Right now I'm learning…" },
  { id: "proud_of", question: "A win I'm proud of…" },
  { id: "looking_to_meet", question: "I'd love to connect with people who…" },
  { id: "outside_work", question: "Outside of work, I'm into…" },
  { id: "can_help", question: "I can help others with…" },
  { id: "figuring_out", question: "Something I'm figuring out…" },
  { id: "care_about", question: "A cause or topic I care about…" },
  { id: "energized_by", question: "The work that energizes me most…" },
  { id: "aspiration", question: "Where I'm headed next…" },
  { id: "hot_take", question: "My (professional) hot take…" },
  { id: "advice", question: "Best advice I've been given…" },
  { id: "fun_fact", question: "A fun fact about me…" },
];

export const PROMPTS_BY_ID = Object.fromEntries(PROFILE_PROMPTS.map((p) => [p.id, p.question]));
export const MIN_PROMPTS = 2;
export const MAX_PROMPTS = 3;
