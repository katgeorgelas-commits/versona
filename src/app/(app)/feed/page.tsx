import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getHomeFeed } from "@/features/feed/data";
import { getMissions } from "@/features/missions/data";
import { FeedList } from "@/features/feed/feed-list";
import { PostComposer } from "@/features/feed/post-composer";
import { MainShell } from "@/components/layout/main-shell";
import { MomentsRow } from "@/features/moments/moments-row";
import { getMoments } from "@/features/moments/data";

export default async function FeedPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");

  const [posts, missions, moments] = await Promise.all([
    getHomeFeed(user.id),
    getMissions(user.id),
    getMoments(),
  ]);
  const myMissions = missions.filter((m) => m.isMember).map((m) => ({ slug: m.slug, name: m.name }));
  const composerMissions = myMissions.length ? myMissions : missions.map((m) => ({ slug: m.slug, name: m.name }));

  return (
    <MainShell user={user}>
      {/* White feed column: full-bleed to the nav rail on the left, divided
          edge-to-edge. Right rail (in MainShell) stays beige. */}
      <div className="-ml-6 min-h-screen border-r border-line bg-bg md:-ml-10">
        <div className="border-b border-line px-4 py-3">
          <MomentsRow moments={moments} user={user} />
        </div>
        <div className="border-b border-line">
          <PostComposer user={user} missions={composerMissions} flush />
        </div>
        <FeedList
          posts={posts}
          empty="Your feed is quiet. Join a mission or circle, or follow some people, to see conversations here."
        />
      </div>
    </MainShell>
  );
}
