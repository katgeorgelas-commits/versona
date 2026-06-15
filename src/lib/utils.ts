import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNowStrict } from "date-fns";

/** Tailwind-aware className combiner. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Compact relative time, e.g. "3h", "2d". */
export function timeAgo(date: string | Date) {
  return formatDistanceToNowStrict(new Date(date))
    .replace(/ (seconds?|minutes?|hours?|days?|months?|years?)/, (m) => m.trim()[0]);
}

/** "Active this week" helper (PRD §3.5 discovery). */
export function isActiveThisWeek(lastActiveAt: string | null | undefined) {
  if (!lastActiveAt) return false;
  const ms = Date.now() - new Date(lastActiveAt).getTime();
  return ms < 7 * 24 * 60 * 60 * 1000;
}

/** Initials fallback for avatars. */
export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** URL for a space, depending on whether it's a mission or a circle. */
export function spacePath(kind: "mission" | "circle", slug: string) {
  return `/${kind === "circle" ? "circles" : "missions"}/${slug}`;
}

export const POST_MAX = 1500;
export const REPLY_MAX = 500;
export const HEADLINE_MAX = 200;
export const MAX_TOPICS = 3;
export const MESSAGE_REQUESTS_PER_DAY = 5;
