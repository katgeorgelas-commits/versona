import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { SettingsScreen } from "@/features/settings/settings-screen";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  return <SettingsScreen />;
}
