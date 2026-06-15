"use server";

import { getSessionUser } from "@/lib/auth/session";
import { isOfflineDemo, OFFLINE_USERS, offlineIsActiveNow } from "@/lib/dev/offline";
import { createServiceClient } from "@/lib/supabase/server";

export type Mentionable = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  online: boolean;
};

/** People the viewer can @mention, filtered by a typed query. */
export async function searchMentionable(query: string): Promise<Mentionable[]> {
  const user = await getSessionUser();
  if (!user) return [];
  const q = query.toLowerCase();

  if (isOfflineDemo()) {
    return Object.values(OFFLINE_USERS)
      .filter(
        (u) =>
          u.id !== user.id &&
          (u.username.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q)),
      )
      .slice(0, 6)
      .map((u) => ({
        username: u.username,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        online: offlineIsActiveNow(u.id),
      }));
  }

  const db = createServiceClient();
  const { data } = await db
    .from("users")
    .select("id, username, display_name, avatar_url")
    .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
    .neq("id", user.id)
    .limit(6);
  return (data ?? []).map((u) => ({
    username: u.username,
    displayName: u.display_name,
    avatarUrl: u.avatar_url,
    online: false,
  }));
}
