/**
 * Heuristic AI-content detection (PRD §3.4, §3.6). Cheap, transparent signal used
 * to DEMOTE (never hide) likely AI-generated posts. Runs synchronously at post
 * time; an optional user flag can also set the flag. This is intentionally simple
 * and explainable — the real model-based check can layer on later.
 */
const TELLS = [
  /\bas an ai\b/i,
  /\bin today's (fast-paced|digital|ever-changing)\b/i,
  /\bit's important to (note|remember|consider)\b/i,
  /\b(furthermore|moreover|additionally),/i,
  /\bdelve into\b/i,
  /\b(tapestry|landscape) of\b/i,
  /\bin conclusion\b/i,
  /\bnavigating the\b/i,
  /\bunlock(ing)? (the|your) (potential|power)\b/i,
  /\ba testament to\b/i,
];

export function aiContentScore(text: string): { score: number; flagged: boolean } {
  if (!text || text.length < 40) return { score: 0, flagged: false };
  let hits = 0;
  for (const re of TELLS) if (re.test(text)) hits++;

  // Uniform sentence length is another weak tell.
  const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  let uniformity = 0;
  if (sentences.length >= 4) {
    const lens = sentences.map((s) => s.split(/\s+/).length);
    const mean = lens.reduce((a, b) => a + b, 0) / lens.length;
    const variance = lens.reduce((a, b) => a + (b - mean) ** 2, 0) / lens.length;
    if (variance < 6 && mean > 10) uniformity = 1;
  }

  const score = Math.min(1, hits * 0.28 + uniformity * 0.2);
  return { score, flagged: score >= 0.5 };
}
