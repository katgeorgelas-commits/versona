/**
 * Content moderation — blocks posts containing sexual, harassing, violent, or
 * otherwise harmful content. Pattern-based first pass; AI-backed review can
 * layer on later. Returns { safe: true } or { safe: false, reason }.
 */

const BLOCKED_PATTERNS: { re: RegExp; reason: string }[] = [
  // Sexual content
  { re: /\b(sex(?:ual|ting)?|nude|naked|porn(?:ography)?|nsfw|onlyfans|hookup|booty\s?call)\b/i, reason: "sexual content" },
  // Harassment / hate
  { re: /\b(kill\s+(?:your|him|her|them|myself)|kys|go\s+die|neck\s+yourself)\b/i, reason: "violent or harassing language" },
  { re: /\b(r[ae]tard(?:ed)?|f[a@]gg?[o0]t|n[i1]gg?[e3]r)\b/i, reason: "hate speech or slurs" },
  // Threats
  { re: /\b(i(?:'ll|m\s+going\s+to)\s+(?:hurt|attack|stalk|shoot|bomb)\b)/i, reason: "threatening language" },
  // Self-harm (carefully: flag for human review rather than block outright)
  { re: /\b(how\s+to\s+(?:kill|end)\s+(?:myself|my\s+life))\b/i, reason: "self-harm content" },
  // Spam / scam
  { re: /\b(buy\s+followers|make\s+\$\d{3,}\s+(?:per|a)\s+(?:day|hour))\b/i, reason: "spam or scam content" },
];

export function moderateContent(text: string): { safe: boolean; reason?: string } {
  if (!text) return { safe: true };
  for (const { re, reason } of BLOCKED_PATTERNS) {
    if (re.test(text)) return { safe: false, reason };
  }
  return { safe: true };
}
