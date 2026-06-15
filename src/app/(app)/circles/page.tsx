import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getMissions } from "@/features/missions/data";
import { MissionCard } from "@/features/missions/mission-card";
import { RequestMissionButton } from "@/features/missions/request-mission-button";
import { PageHeader, SectionLabel } from "@/components/layout/page-parts";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { MainShell } from "@/components/layout/main-shell";

export default async function CirclesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");

  const spaces = (await getMissions(user.id)).filter((m) => m.kind === "circle");
  const joined = spaces.filter((m) => m.isMember);
  const discover = spaces.filter((m) => !m.isMember);

  return (
    <MainShell user={user} right={false}>
      <Breadcrumbs items={[{ label: "Circles" }]} />
      <PageHeader
        title="Circles"
        subtitle="People aligning around an interest, industry, or topic — your professional world. Find where you belong."
      >
        <RequestMissionButton kind="circle" />
      </PageHeader>

      {joined.length > 0 && (
        <section className="mb-11">
          <SectionLabel>Your circles</SectionLabel>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {joined.map((m) => (
              <MissionCard key={m.id} mission={m} />
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionLabel count={`${discover.length} circles`}>
          {joined.length ? "Discover more" : "Discover"}
        </SectionLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {discover.map((m) => (
            <MissionCard key={m.id} mission={m} />
          ))}
        </div>
      </section>
    </MainShell>
  );
}
