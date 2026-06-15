import { Sparkles, Users } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { MissionFeed } from "@/features/feed/mission-feed";
import { PostComposer } from "@/features/feed/post-composer";
import { MissionJoinButton } from "@/features/missions/mission-card";
import { MissionJourney } from "@/features/missions/journey";
import { getJourney } from "@/features/missions/journey-data";
import type { MissionView, PostView } from "@/types/views";
import type { SessionUser } from "@/types/app";

/** Detail view shared by mission and circle pages (same underlying space record). */
export async function SpaceDetail({
  space,
  posts,
  user,
}: {
  space: MissionView;
  posts: PostView[];
  user: SessionUser;
}) {
  const isCircle = space.kind === "circle";
  const sectionLabel = isCircle ? "Circles" : "Missions";
  const sectionHref = isCircle ? "/circles" : "/missions";

  // Only missions have a journey layer; circles are about belonging, not an arc.
  const journey = isCircle ? null : await getJourney(space.id, user.id, user.isAdmin);

  return (
    <div className="mx-auto max-w-feed space-y-4">
      <Breadcrumbs items={[{ label: sectionLabel, href: sectionHref }, { label: space.name }]} />

      {/* Pinned brief */}
      <div className="rounded-lg border-1.5 border-line bg-bg p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-3">
              {isCircle ? "Circle" : "Mission"}
            </span>
            <h1 className="mt-0.5 font-display text-xl font-bold tracking-[-0.02em] text-ink-1">{space.name}</h1>
            <div className="mt-1 flex items-center gap-1.5 text-[13px] text-ink-3">
              <Users className="h-4 w-4" />
              {space.memberCount} {space.memberCount === 1 ? "member" : "members"}
            </div>
          </div>
          <MissionJoinButton slug={space.slug} isMember={space.isMember} />
        </div>
        <p className="mt-3 text-[15px] leading-[1.6] text-ink-2">{space.brief}</p>
      </div>

      {/* Weekly prompt (each space can have its own) */}
      {space.weeklyPrompt && (
        <div className="rounded-lg border-1.5 border-line bg-accent-light p-4">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-accent">
            <Sparkles className="h-3.5 w-3.5" /> This week&apos;s prompt
          </div>
          <p className="text-[15px] font-medium text-ink-1">{space.weeklyPrompt}</p>
        </div>
      )}

      {/* Mission journey — stages + people a few steps ahead (missions only) */}
      {journey && (
        <MissionJourney journey={journey} slug={space.slug} isMember={space.isMember} />
      )}

      {space.isMember ? (
        <PostComposer
          user={user}
          missions={[{ slug: space.slug, name: space.name }]}
          defaultMissionSlug={space.slug}
          weeklyPromptId={space.weeklyPromptId ?? undefined}
          lockMission
        />
      ) : (
        <div className="rounded-lg border-1.5 border-dashed border-line p-4 text-center text-[13px] text-ink-3">
          Join this {isCircle ? "circle" : "mission"} to post and join the conversation.
        </div>
      )}

      <MissionFeed posts={posts} />
    </div>
  );
}
