import { cookies } from "next/headers";
import { createServiceClient, createClient } from "@/lib/supabase/server";
import { isOfflineDemo, offlineUser } from "@/lib/dev/offline";
import type { SessionUser } from "@/types/app";
import type { Database } from "@/types/database";

/** The five user columns every session resolution reads. */
type SessionRow = Pick<
  Database["public"]["Tables"]["users"]["Row"],
  "id" | "username" | "display_name" | "avatar_url" | "is_admin"
>;

/**
 * Auth abstraction. The rest of the app calls getSessionUser() and never cares
 * whether the session is real or mocked. When the auth feature ships (last, per
 * the PRD), only this file flips from the mock path to the Supabase path.
 *
 * Mock mode (NEXT_PUBLIC_USE_MOCK_AUTH=true):
 *   - Resolves a seeded demo user by username.
 *   - The username comes from the `versona_mock_user` cookie (set by the dev
 *     user-switcher) or falls back to MOCK_AUTH_DEFAULT_USERNAME.
 *   - Reads go through the service-role client and are scoped in app code.
 */
const MOCK = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === "true";
const MOCK_COOKIE = "versona_mock_user";

export async function getSessionUser(): Promise<SessionUser | null> {
  if (MOCK) {
    const username =
      cookies().get(MOCK_COOKIE)?.value ??
      process.env.MOCK_AUTH_DEFAULT_USERNAME ??
      "maya";

    // No Supabase configured → serve an in-memory seeded user (dev demo only).
    if (isOfflineDemo()) return offlineUser(username);

    const db = createServiceClient();
    const { data } = await db
      .from("users")
      .select("id, username, display_name, avatar_url, is_admin")
      .eq("username", username)
      .maybeSingle();
    if (!data) return null;
    return {
      id: data.id,
      username: data.username,
      displayName: data.display_name,
      avatarUrl: data.avatar_url,
      isAdmin: data.is_admin,
    };
  }

  // ── Real auth path (built last) ─────────────────────────────────────────
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: row } = await supabase
    .from("users")
    .select("id, username, display_name, avatar_url, is_admin")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  const data = row as SessionRow | null;
  if (!data) return null;
  return {
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    isAdmin: data.is_admin,
  };
}

/** Throws/redirects callers should handle; convenience for protected routes. */
export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export const isMockAuth = MOCK;
export const MOCK_USER_COOKIE = MOCK_COOKIE;
