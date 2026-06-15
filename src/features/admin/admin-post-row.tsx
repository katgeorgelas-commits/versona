"use client";

import { useState, useTransition } from "react";
import { Bot, Trash2 } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import { removePost } from "./actions";
import type { AdminPostRow as Row } from "./data";

export function AdminPostRow({ post }: { post: Row }) {
  const [removed, setRemoved] = useState(false);
  const [pending, startTransition] = useTransition();
  if (removed) return null;

  return (
    <div className="flex items-start gap-3 rounded-lg border-1.5 border-line p-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{post.author}</span>
          {post.missionName && <span>· {post.missionName}</span>}
          <span>· {timeAgo(post.createdAt)}</span>
          {post.aiFlagged && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5">
              <Bot className="h-3 w-3" /> AI
            </span>
          )}
        </div>
        <p className="mt-1 line-clamp-2 text-sm">{post.bodyText}</p>
      </div>
      <button
        onClick={() => {
          setRemoved(true);
          startTransition(() => {
            void removePost(post.id);
          });
        }}
        disabled={pending}
        className="inline-flex items-center gap-1 rounded-full border-1.5 border-error px-3 py-1.5 text-[12px] font-semibold text-error transition-colors hover:bg-error-bg"
      >
        <Trash2 className="h-3.5 w-3.5" /> Remove
      </button>
    </div>
  );
}
