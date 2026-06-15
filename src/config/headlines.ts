/**
 * Headline templates (PRD §3.2). Versona headlines show the highs AND the lows —
 * what you're doing, what you care about, whether someone can help you.
 * Users pick a template and fill the blanks, or write custom free text.
 *
 * Directly inspired by Kat's Research:
 *   "Currently [doing X], struggling with [Y]" instead of "Marketing Manager at Google".
 */
export type HeadlineTemplate = {
  id: string;
  label: string;
  /** Slots rendered as inputs; `template` interpolates {slot} values. */
  template: string;
  slots: { key: string; placeholder: string }[];
};

export const HEADLINE_TEMPLATES: HeadlineTemplate[] = [
  {
    id: "currently-struggling",
    label: "What I'm doing + what's hard",
    template: "Currently {doing}, struggling with {struggle}",
    slots: [
      { key: "doing", placeholder: "launching my first startup" },
      { key: "struggle", placeholder: "customer acquisition" },
    ],
  },
  {
    id: "building-looking",
    label: "What I'm building + who I want to meet",
    template: "Building {thing}, looking for people who {who}",
    slots: [
      { key: "thing", placeholder: "a newsletter for career switchers" },
      { key: "who", placeholder: "have grown an audience from scratch" },
    ],
  },
  {
    id: "in-transition",
    label: "Where I'm headed",
    template: "In transition from {from} to {to}",
    slots: [
      { key: "from", placeholder: "agency design" },
      { key: "to", placeholder: "product" },
    ],
  },
  {
    id: "learning",
    label: "What I'm learning",
    template: "Learning {topic} and figuring out {question}",
    slots: [
      { key: "topic", placeholder: "to manage a team" },
      { key: "question", placeholder: "how to give hard feedback" },
    ],
  },
  {
    id: "custom",
    label: "Write my own",
    template: "{custom}",
    slots: [{ key: "custom", placeholder: "Say it your way…" }],
  },
];

export function renderHeadline(templateId: string, values: Record<string, string>) {
  const tpl = HEADLINE_TEMPLATES.find((t) => t.id === templateId);
  if (!tpl) return values.custom ?? "";
  return tpl.template.replace(/\{(\w+)\}/g, (_, k) => values[k]?.trim() || `[${k}]`);
}
