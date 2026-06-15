import type { SessionUser } from "@/types/app";

/**
 * Offline demo mode — dev convenience only.
 *
 * Active when mock auth is on AND Supabase isn't configured (URL still the
 * placeholder). Lets the app be clicked through without Docker/Supabase by
 * serving an in-memory session, the seed missions, and a no-op save. The moment
 * a real NEXT_PUBLIC_SUPABASE_URL is set, this turns itself off and the normal
 * DB-backed paths take over — no code changes needed.
 */
export function isOfflineDemo(): boolean {
  if (process.env.NEXT_PUBLIC_USE_MOCK_AUTH !== "true") return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return url === "" || url.includes("placeholder");
}

/** Mirrors the seeded users in supabase/seed.sql. */
export const OFFLINE_USERS: Record<string, SessionUser> = {
  maya: {
    id: "11111111-1111-1111-1111-111111111111",
    username: "maya",
    displayName: "Maya Okafor",
    avatarUrl: null,
    isAdmin: false,
  },
  dev: {
    id: "22222222-2222-2222-2222-222222222222",
    username: "dev",
    displayName: "Dev Patel",
    avatarUrl: null,
    isAdmin: false,
  },
  sasha: {
    id: "33333333-3333-3333-3333-333333333333",
    username: "sasha",
    displayName: "Sasha Romano",
    avatarUrl: null,
    isAdmin: false,
  },
  admin: {
    id: "44444444-4444-4444-4444-444444444444",
    username: "admin",
    displayName: "Versona Team",
    avatarUrl: null,
    isAdmin: true,
  },
};

export const OFFLINE_USER_LIST = Object.values(OFFLINE_USERS).map((u) => ({
  username: u.username,
  displayName: u.displayName,
}));

export function offlineUser(username?: string | null): SessionUser {
  return (username && OFFLINE_USERS[username]) || OFFLINE_USERS.maya;
}

/** Demo presence — who's "active now" (drives the green dot). */
export const OFFLINE_ACTIVE_NOW = new Set([OFFLINE_USERS.maya.id, OFFLINE_USERS.sasha.id]);
export function offlineIsActiveNow(userId: string) {
  return OFFLINE_ACTIVE_NOW.has(userId);
}

/**
 * Curated spaces. `kind` distinguishes:
 *   • mission — a shared journey toward a goal (has an arc: start → progress → done)
 *   • circle  — people aligning around an interest/industry/topic (ongoing identity)
 */
export const OFFLINE_MISSIONS = [
  // ── Missions (journeys) ──────────────────────────────────────────────
  { slug: "launching-my-first-business", name: "Launching My First Business", brief: "For first-time founders in the messy early days. Share what you're building, what's breaking, and find people a few steps ahead.", accent_color: "#7c3aed", kind: "mission" as const, icon: "rocket" },
  { slug: "career-transition", name: "Career Transition", brief: "Changing fields, industries, or identities. A space for the in-between — guidance, support, and people who've made the leap.", accent_color: "#ea580c", kind: "mission" as const, icon: "route" },
  { slug: "becoming-a-better-manager", name: "Becoming a Better Manager", brief: "New and growing managers learning to lead humans. Trade hard-won lessons, vent the hard days, get real advice.", accent_color: "#0ea5e9", kind: "mission" as const, icon: "users" },
  { slug: "navigating-layoffs", name: "Navigating Layoffs", brief: "Displaced, bought out, or between roles. A grounded, judgment-free space to regroup and move forward together.", accent_color: "#db2777", kind: "mission" as const, icon: "life-buoy" },
  { slug: "first-90-days", name: "The First 90 Days", brief: "Just started something new. Ramp up, build trust, and figure out the unwritten rules with others doing the same.", accent_color: "#2563eb", kind: "mission" as const, icon: "calendar-clock" },
  { slug: "returning-to-work", name: "Returning to Work", brief: "After a break — caregiving, health, sabbatical, or life. Rebuild confidence and momentum on your own terms.", accent_color: "#0d9488", kind: "mission" as const, icon: "undo-2" },

  // ── Circles (belonging) ──────────────────────────────────────────────
  { slug: "breaking-into-tech", name: "Breaking Into Tech", brief: "For people entering tech from anywhere. Demystify the path, swap resources, and meet others on the same climb.", accent_color: "#16a34a", kind: "circle" as const, icon: "terminal" },
  { slug: "building-in-public", name: "Building in Public", brief: "Share the work as it happens. Progress, setbacks, metrics, and momentum — out loud, with people who get it.", accent_color: "#9333ea", kind: "circle" as const, icon: "megaphone" },
  { slug: "freelancing-full-time", name: "Freelancing Full-Time", brief: "Going independent and making it sustainable. Pricing, clients, feast-or-famine, and the freedom in between.", accent_color: "#d97706", kind: "circle" as const, icon: "briefcase" },
  { slug: "finding-my-people", name: "Finding My People", brief: "For anyone who just wants to meet collaborators, mentors, and friends in their field. Connection first, everything else follows.", accent_color: "#e11d48", kind: "circle" as const, icon: "heart-handshake" },
  { slug: "government-contracting", name: "Government Contracting", brief: "For people working in and around GovCon — proposals, clearances, agency life, and the realities of public-sector work.", accent_color: "#1d4ed8", kind: "circle" as const, icon: "briefcase" },
  { slug: "product-designers", name: "Product Designers", brief: "Craft, critique, and career for people who design digital products. Portfolios, process, and the state of the field.", accent_color: "#7c3aed", kind: "circle" as const, icon: "compass" },
  { slug: "dmv-professionals", name: "DMV Professionals", brief: "DC, Maryland & Virginia professionals — local meetups, opportunities, and building a network close to home.", accent_color: "#0d9488", kind: "circle" as const, icon: "users" },
  { slug: "versona-asks", name: "Versona Asks", brief: "Every week, a new prompt for the whole community. Your answers show up here and on your profile.", accent_color: "#6D28D9", kind: "circle" as const, icon: "sparkles" },
];
