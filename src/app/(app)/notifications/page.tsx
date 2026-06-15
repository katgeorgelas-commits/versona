import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getNotifications } from "@/features/notifications/data";
import { NotificationsScreen } from "@/features/notifications/notifications-screen";

export default async function NotificationsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  const items = await getNotifications(user.id);
  return <NotificationsScreen items={items} />;
}
