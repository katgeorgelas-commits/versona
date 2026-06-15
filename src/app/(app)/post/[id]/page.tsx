import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getPost } from "@/features/feed/data";
import { PostCard } from "@/features/feed/post-card";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export default async function PostPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) redirect("/");
  const post = await getPost(params.id, user.id);
  if (!post) notFound();

  return (
    <div className="mx-auto max-w-feed">
      <Breadcrumbs items={[{ label: "Home", href: "/feed" }, { label: "Post" }]} />
      <PostCard post={post} expandReplies />
    </div>
  );
}
