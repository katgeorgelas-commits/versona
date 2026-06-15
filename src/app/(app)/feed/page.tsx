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
      <div className="mx-auto max-w-feed space-y-3">
        <MomentsRow moments={moments} user={user} />
        <PostComposer user={user} missions={composerMissions} />
        <FeedList
          posts={posts}
          empty="Your feed is quiet. Join a mission or circle, or follow some people, to see conversations here."
        />
      </div>
    </MainShell>
  );
}
