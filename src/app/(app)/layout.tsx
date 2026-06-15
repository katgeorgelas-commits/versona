import { redirect } from "next/navigation";
import { AppNav } from "@/components/layout/app-nav";
import { MockUserSwitcher } from "@/components/dev/mock-user-switcher";
import { getSessionUser, isMockAuth } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/server";
import { isOfflineDemo, OFFLINE_USER_LIST } from "@/lib/dev/offline";
import { getThreads } from "@/features/messaging/data";
import { MessageDock } from "@/features/messaging/message-dock";
import { getNotifications, getUnreadCount } from "@/features/notifications/data";
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

  const [threads, notifications, unread] = await Promise.all([
    getThreads(user.id),
    getNotifications(user.id),
    getUnreadCount(user.id),
  ]);

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
      <AppNav user={user} notifications={notifications} unread={unread} threads={threads} />
      <main className="mx-auto min-h-screen max-w-app px-6 py-8 md:px-10">
        {children}
      </main>
      <MessageDock threads={threads} viewerId={user.id} />
      {isMockAuth && (
        <MockUserSwitcher current={user.username} users={switcherUsers} />
      )}
    </ToastProvider>
  );
}
