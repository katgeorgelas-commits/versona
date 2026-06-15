import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getTopicPosts } from "@/features/explore/data";
import { PageHeader } from "@/components/layout/page-parts";
import { FeedList } from "@/features/feed/feed-list";
import { MainShell } from "@/components/layout/main-shell";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export default async function TopicPage({ params }: { params: { tag: string } }) {
  const user = await getSessionUser();
  if (!user) redirect("/");
  const tag = decodeURIComponent(params.tag);
  const posts = await getTopicPosts(tag, user.id);

  return (
    <MainShell user={user}>
      <div className="mx-auto max-w-feed">
        <Breadcrumbs items={[{ label: "Explore", href: "/explore" }, { label: `#${tag}` }]} />
        <PageHeader title={`#${tag}`} subtitle={`${posts.length} ${posts.length === 1 ? "post" : "posts"} on this topic.`} />
        <FeedList posts={posts} empty="No posts on this topic yet." />
      </div>
    </MainShell>
  );
}
