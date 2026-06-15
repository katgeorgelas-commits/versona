import "server-only";
import { isOfflineDemo } from "@/lib/dev/offline";
import { store } from "@/lib/dev/offline-store";
import { offlinePersonCard } from "@/features/profile/data";
import type { PersonCard } from "@/types/views";

export type MomentView = { id: string; author: PersonCard; text: string; createdAt: string };

export async function getMoments(): Promise<MomentView[]> {
  if (isOfflineDemo()) {
    return store.moments
      .slice()
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .map((m) => ({ id: m.id, author: offlinePersonCard(m.author_id)!, text: m.text, createdAt: m.created_at }))
      .filter((m) => m.author);
  }
  return [];
}
