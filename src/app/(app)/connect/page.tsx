import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Compass, Flame } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { getMissions } from "@/features/missions/data";
import { getMyStageMap, type MyStageSummary } from "@/features/missions/journey-data";
import { MissionCard } from "@/features/missions/mission-card";
import { PageHeader, SectionLabel } from "@/components/layout/page-parts";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { MainShell } from "@/components/layout/main-shell";
import { spacePath } from "@/lib/utils";
import type { MissionView } from "@/types/views";

/**
 * Community — your hub: the missions you're on (with your journey through each)
 * and the circles you belong to. Browsing/joining new spaces lives in Discover;
 * this page is everything you're already part of.
 */
export default async function CommunityPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");

  const [all, stageMap] = await Promise.all([getMissions(user.id), getMyStageMap(user.id)]);
  const missions = all.filter((m) => m.kind === "mission" && m.isMember);
  const circles = all.filter((m) => m.kind === "circle" && m.isMember);

  return (
    <MainShell user={user} right={false}>
      <Breadcrumbs items={[{ label: "Community" }]} />
      <PageHeader
        title="Community"
        subtitle="The missions you're on, your journey through each, and the circles you belong to."
      />

      <section className="mb-11">
        <SectionLabel count={missions.length || undefined}>Your missions</SectionLabel>
        {missions.length === 0 ? (
          <EmptyHint
            text="You haven't joined any missions yet — shared journeys toward a goal."
            href="/discover"
            cta="Discover missions"
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {missions.map((m) => (
              <ConnectMissionCard key={m.id} mission={m} stage={stageMap[m.id]} />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionLabel count={circles.length || undefined}>Your circles</SectionLabel>
        {circles.length === 0 ? (
          <EmptyHint
            text="You haven't joined any circles yet — people aligning around an interest or field."
            href="/discover"
            cta="Discover circles"
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {circles.map((m) => (
              <MissionCard key={m.id} mission={m} />
            ))}
          </div>
        )}
      </section>
    </MainShell>
  );
}

/** Mission card with the viewer's journey progress baked in. */
function ConnectMissionCard({ mission, stage }: { mission: MissionView; stage?: MyStageSummary }) {
  return (
    <Link
      href={spacePath(mission.kind, mission.slug)}
      className="flex min-h-[158px] flex-col justify-between rounded-lg border-1.5 border-line bg-bg px-[22px] pb-[18px] pt-5 transition-[transform,border-color] duration-[140ms] hover:-translate-y-0.5 hover:border-accent-hover"
    >
      <div>
        <h3 className="font-display text-[15px] font-bold leading-[1.25] tracking-[-0.015em] text-ink-1">
          {mission.name}
        </h3>
        <p className="mt-2 line-clamp-2 text-[13px] leading-[1.6] text-ink-2">{mission.brief}</p>
      </div>

      {/* Journey progress (missions with a published journey only) */}
      {stage && (
        <div className="mt-3">
          {stage.mine ? (
            <>
              <div className="flex items-center gap-1.5 text-[12px] font-semibold text-accent">
                <Compass className="h-3.5 w-3.5" />
                <span className="truncate">{stage.mine.name}</span>
                <span className="font-medium text-ink-3">· step {stage.mine.order} of {stage.total}</span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-bg-muted">
                <div className="h-full rounded-full bg-accent" style={{ width: `${(stage.mine.order / stage.total) * 100}%` }} />
              </div>
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-accent">
              <Compass className="h-3.5 w-3.5" /> Set where you are on the journey
            </span>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
        <span className="text-[11px] font-medium text-ink-3">
          {mission.memberCount} {mission.memberCount === 1 ? "member" : "members"}
        </span>
        {mission.newThisWeek > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-energy-ink">
            <Flame className="h-3 w-3" /> {mission.newThisWeek} new this week
          </span>
        )}
      </div>
    </Link>
  );
}

function EmptyHint({ text, href, cta }: { text: string; href: string; cta: string }) {
  return (
    <div className="rounded-lg border-1.5 border-dashed border-line p-5">
      <p className="text-[13px] text-ink-2">{text}</p>
      <Link
        href={href}
        className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-accent hover:text-accent-hover"
      >
        {cta} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
