import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { isOfflineDemo, OFFLINE_USERS } from "@/lib/dev/offline";
import { store } from "@/lib/dev/offline-store";
import { offlinePersonCard } from "@/features/profile/data";
import type { PersonCard } from "@/types/views";

export type Discovery = {
  inMyMissions: PersonCard[];
  peopleLikeYou: PersonCard[];
  activeThisWeek: PersonCard[];
};

export type ConnectionLists = {
  connected: PersonCard[];
  incoming: { connectionId: string; person: PersonCard; note: string }[];
  outgoing: { person: PersonCard }[];
};

export async function getDiscovery(viewerId: string): Promise<Discovery> {
  if (isOfflineDemo()) {
    const others = Object.values(OFFLINE_USERS).filter((u) => u.id !== viewerId);
    const myMissions = new Set(
      store.memberships.filter((m) => m.user_id === viewerId).map((m) => m.mission_id),
    );
    const myValues = new Set(
      (store.profiles.find((p) => p.user_id === viewerId)?.values ?? []).map((v) => v.toLowerCase()),
    );

    const inMyMissions = others
      .filter((u) =>
        store.memberships.some((m) => m.user_id === u.id && myMissions.has(m.mission_id)),
      )
      .map((u) => offlinePersonCard(u.id)!);

    const peopleLikeYou = others
      .map((u) => {
        const vals = store.profiles.find((p) => p.user_id === u.id)?.values ?? [];
        const overlap = vals.filter((v) => myValues.has(v.toLowerCase())).length;
        return { card: offlinePersonCard(u.id)!, overlap };
      })
      .sort((a, b) => b.overlap - a.overlap)
      .map((x) => x.card);

    const activeThisWeek = others.map((u) => offlinePersonCard(u.id)!);

    return { inMyMissions, peopleLikeYou, activeThisWeek };
  }

  // Supabase path (suggestions are values/mission based — not keyword matching).
  const db = createServiceClient();
  const { data: mems } = await db.from("mission_members").select("mission_id").eq("user_id", viewerId);
  const missionIds = (mems ?? []).map((m) => m.mission_id);
  let inMyMissions: PersonCard[] = [];
  if (missionIds.length) {
    const { data } = await db
      .from("mission_members")
      .select("users:user_id(id, username, display_name, avatar_url)")
      .in("mission_id", missionIds)
      .neq("user_id", viewerId)
      .limit(12);
    inMyMissions = peopleFromJoin(data);
  }
  const { data: active } = await db
    .from("users")
    .select("id, username, display_name, avatar_url")
    .neq("id", viewerId)
    .order("last_active_at", { ascending: false, nullsFirst: false })
    .limit(12);
  const activeCards = (active ?? []).map(simpleCard);
  return { inMyMissions, peopleLikeYou: activeCards, activeThisWeek: activeCards };
}

export async function getConnectionLists(viewerId: string): Promise<ConnectionLists> {
  if (isOfflineDemo()) {
    const connected: PersonCard[] = [];
    const incoming: ConnectionLists["incoming"] = [];
    const outgoing: ConnectionLists["outgoing"] = [];
    for (const c of store.connections) {
      if (c.recipient_id !== viewerId && c.requester_id !== viewerId) continue;
      const otherId = c.requester_id === viewerId ? c.recipient_id : c.requester_id;
      const card = offlinePersonCard(otherId);
      if (!card) continue;
      if (c.status === "accepted") connected.push(card);
      else if (c.status === "pending" && c.recipient_id === viewerId)
        incoming.push({ connectionId: c.id, person: card, note: c.note });
      else if (c.status === "pending") outgoing.push({ person: card });
    }
    return { connected, incoming, outgoing };
  }

  const db = createServiceClient();
  const { data } = await db
    .from("connections")
    .select("*, requester:requester_id(id, username, display_name, avatar_url), recipient:recipient_id(id, username, display_name, avatar_url)")
    .or(`requester_id.eq.${viewerId},recipient_id.eq.${viewerId}`);
  type Row = {
    id: string;
    requester_id: string;
    recipient_id: string;
    status: string;
    note: string;
    requester: RawUser | null;
    recipient: RawUser | null;
  };
  const connected: PersonCard[] = [];
  const incoming: ConnectionLists["incoming"] = [];
  const outgoing: ConnectionLists["outgoing"] = [];
  for (const c of (data ?? []) as unknown as Row[]) {
    const other = c.requester_id === viewerId ? c.recipient : c.requester;
    if (!other) continue;
    const card = simpleCard(other);
    if (c.status === "accepted") connected.push(card);
    else if (c.status === "pending" && c.recipient_id === viewerId)
      incoming.push({ connectionId: c.id, person: card, note: c.note });
    else if (c.status === "pending") outgoing.push({ person: card });
  }
  return { connected, incoming, outgoing };
}

type RawUser = { id: string; username: string; display_name: string; avatar_url: string | null };
function simpleCard(u: RawUser): PersonCard {
  return {
    id: u.id,
    username: u.username,
    displayName: u.display_name,
    avatarUrl: u.avatar_url,
    headline: null,
    values: [],
    lastActiveAt: null,
  };
}
function peopleFromJoin(data: unknown): PersonCard[] {
  type Row = { users: RawUser | null };
  const seen = new Set<string>();
  const out: PersonCard[] = [];
  for (const row of (data ?? []) as Row[]) {
    if (row.users && !seen.has(row.users.id)) {
      seen.add(row.users.id);
      out.push(simpleCard(row.users));
    }
  }
  return out;
}
