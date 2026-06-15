import { listPosts } from "@/features/admin/data";
import { AdminPostRow } from "@/features/admin/admin-post-row";

export default async function AdminPostsPage() {
  const posts = await listPosts();
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Posts</h1>
      <p className="text-sm text-muted-foreground">
        Moderate content. Removing a post hides it from all feeds.
      </p>
      <div className="space-y-2">
        {posts.map((p) => (
          <AdminPostRow key={p.id} post={p} />
        ))}
        {posts.length === 0 && (
          <p className="text-sm text-muted-foreground">No posts yet.</p>
        )}
      </div>
    </div>
  );
}
