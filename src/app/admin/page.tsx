import { getAdminStats } from "@/features/admin/data";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminOverviewPage() {
  const s = await getAdminStats();
  const stats = [
    { label: "Members", value: s.users },
    { label: "Posts", value: s.posts },
    { label: "Posts (24h)", value: s.postsToday },
    { label: "Missions", value: s.missions },
    { label: "Connections", value: s.connections },
    { label: "Messages", value: s.messages },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Overview</h1>
        <p className="text-sm text-muted-foreground">Platform health at a glance.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="font-display text-3xl font-bold tracking-[-0.02em] text-ink-1">{stat.value}</div>
              <div className="mt-1 text-[13px] text-ink-3">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Engagement analytics (DAU trend, connection rate, mission activity over time)
        plug in here once event tracking is wired.
      </p>
    </div>
  );
}
