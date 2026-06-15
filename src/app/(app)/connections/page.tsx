import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getDiscovery, getConnectionLists } from "@/features/connections/data";
import { ConnectionsScreen } from "@/features/connections/connections-screen";
import { MainShell } from "@/components/layout/main-shell";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export default async function ConnectionsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");

  const [discovery, lists] = await Promise.all([
    getDiscovery(user.id),
    getConnectionLists(user.id),
  ]);

  return (
    <MainShell user={user}>
      <Breadcrumbs items={[{ label: "People" }]} />
      <ConnectionsScreen discovery={discovery} lists={lists} />
    </MainShell>
  );
}
