import Anthropic from "@anthropic-ai/sdk";

/**
 * Anthropic client. Server-only — the API key must never reach the browser.
 * All Versona AI (onboarding, profile synthesis, suggestions, prompt gen,
 * AI-content detection, gap nudges) runs through here.
 */
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

/** Single source of truth for the model id (PRD mandates claude-sonnet-4-6). */
export const VERSONA_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

/**
 * Guardrail constants reflecting PRD §3.6 AI constraints:
 *   • AI never posts on behalf of users.
 *   • AI never auto-fills public copy without user review.
 *   • Suggestions are surfaced as suggestions, never defaults.
 * These are enforced at the call sites; kept here as documented intent.
 */
export const AI_CONSTRAINTS = {
  neverPostsForUsers: true,
  alwaysRequiresReview: true,
  suggestionsNotDefaults: true,
} as const;
