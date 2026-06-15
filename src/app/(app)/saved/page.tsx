import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getSavedFeed } from "@/features/feed/data";
import { FeedList } from "@/features/feed/feed-list";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export default async function SavedPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  const posts = await getSavedFeed(user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Breadcrumbs items={[{ label: "Saved" }]} />
      <h1 className="font-display text-2xl font-bold">Saved</h1>
      <FeedList posts={posts} empty="Posts you save will show up here." />
    </div>
  );
}
