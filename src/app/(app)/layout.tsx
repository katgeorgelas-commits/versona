import { redirect } from "next/navigation";
import { NavRail } from "@/components/layout/nav-rail";
import { MockUserSwitcher } from "@/components/dev/mock-user-switcher";
import { getSessionUser, isMockAuth } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/server";
import { isOfflineDemo, OFFLINE_USER_LIST } from "@/lib/dev/offline";
import { getThreads } from "@/features/messaging/data";
import { MessageDock } from "@/features/messaging/message-dock";
import { getUnreadCount } from "@/features/notifications/data";
import { getProfileView } from "@/features/profile/data";
import { ToastProvider } from "@/components/ui/toast";

/**
 * Authenticated shell. Top nav strip + a centered content column (spec §6:
 * max-width 960, padding 40). Individual screens constrain further (feed = 680).
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/");

  const [threads, unread, profile] = await Promise.all([
    getThreads(user.id),
    getUnreadCount(user.id),
    getProfileView(user.username, user.id),
  ]);

  const messageUnread = threads.reduce((sum, t) => sum + t.unread, 0);
  const railProfile = profile
    ? {
        completeness: profile.completeness,
        followerCount: profile.followerCount,
        headline: profile.headline,
      }
    : null;

  let switcherUsers: { username: string; displayName: string }[] = [];
  if (isMockAuth) {
    if (isOfflineDemo()) {
      switcherUsers = OFFLINE_USER_LIST;
    } else {
      const db = createServiceClient();
      const { data } = await db
        .from("users")
        .select("username, display_name")
        .order("username");
      switcherUsers =
        data?.map((u) => ({ username: u.username, displayName: u.display_name })) ?? [];
    }
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen">
        <NavRail
          user={user}
          profile={railProfile}
          unread={unread}
          messageUnread={messageUnread}
        />
        <div className="min-w-0 flex-1">
          <main className="mx-auto max-w-app px-6 py-8 md:px-10">{children}</main>
        </div>
      </div>
      <MessageDock threads={threads} viewerId={user.id} />
      {isMockAuth && (
        <MockUserSwitcher current={user.username} users={switcherUsers} />
      )}
    </ToastProvider>
  );
}
