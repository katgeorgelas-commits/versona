import { PostCard } from "./post-card";
import type { PostView } from "@/types/views";

export function FeedList({
  posts,
  empty = "Nothing here yet.",
}: {
  posts: PostView[];
  empty?: string;
}) {
  if (posts.length === 0) {
    return (
      <div className="rounded-lg border-1.5 border-dashed border-line p-10 text-center text-[13px] text-ink-3">
        {empty}
      </div>
    );
  }
  return (
    <div className="divide-y divide-line border-y border-line">
      {posts.map((p) => (
        <PostCard key={p.id} post={p} variant="row" />
      ))}
    </div>
  );
}
