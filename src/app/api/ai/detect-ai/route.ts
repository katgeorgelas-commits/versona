import { notYetImplemented } from "@/lib/api/stub";

/**
 * POST /api/ai/detect-ai
 * Heuristic flagging of likely AI-generated posts for feed demotion (PRD §3.4,
 * §3.6). Combines heuristics with optional user flags; demotes, never hides.
 * Built in Feature 4.
 */
export function POST() {
  return notYetImplemented("AI content detection", "§3.4");
}
