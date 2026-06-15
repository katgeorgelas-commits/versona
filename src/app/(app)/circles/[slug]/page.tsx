import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getMission } from "@/features/missions/data";
import { getMissionFeed } from "@/features/feed/data";
import { SpaceDetail } from "@/features/missions/space-detail";

export default async function CircleDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect("/");

  const space = await getMission(params.slug, user.id);
  if (!space || space.kind !== "circle") notFound();

  const posts = await getMissionFeed(space.id, user.id);
  return <SpaceDetail space={space} posts={posts} user={user} />;
}
