"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { MentionInput } from "@/components/ui/mention-input";
import { MentionText } from "@/components/ui/mention-text";
import { cn, timeAgo } from "@/lib/utils";
import { createReply, toggleReplyLike } from "./actions";
import type { ReplyView } from "@/types/views";

/** Threaded comments — like, reply-to-comment, one level of nesting. */
export function CommentThread({
  replies,
  postId,
  reload,
}: {
  replies: ReplyView[];
  postId: string;
  reload: () => Promise<void>;
}) {
  const top = replies.filter((r) => !r.parentReplyId);
  const childrenOf = (id: string) => replies.filter((r) => r.parentReplyId === id);
  const [text, setText] = useState("");
  const [, start] = useTransition();

  function addTop() {
    const b = text.trim();
    if (!b) return;
    setText("");
    start(async () => {
      await createReply({ postId, body: b });
      await reload();
    });
  }

  return (
    <div className="space-y-3">
      {top.map((r) => (
        <Comment key={r.id} reply={r} rootId={r.id} postId={postId} reload={reload}>
          {childrenOf(r.id).map((c) => (
            <Comment key={c.id} reply={c} rootId={r.id} postId={postId} reload={reload} nested />
          ))}
        </Comment>
      ))}

      <div className="flex items-start gap-2">
        <div className="flex-1">
          <MentionInput
            value={text}
            onChange={setText}
            onSubmit={addTop}
            placeholder="Write a comment… use @ to mention"
            className="h-9 rounded-full px-3.5 text-[13px]"
          />
        </div>
        <button onClick={addTop} disabled={!text.trim()} className="h-9 rounded-full bg-accent px-4 text-[12px] font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50">
          Comment
        </button>
      </div>
    </div>
  );
}

function Comment({
  reply,
  rootId,
  postId,
  reload,
  nested = false,
  children,
}: {
  reply: ReplyView;
  rootId: string;
  postId: string;
  reload: () => Promise<void>;
  nested?: boolean;
  children?: React.ReactNode;
}) {
  const [liked, setLiked] = useState(reply.likedByMe);
  const [likes, setLikes] = useState(reply.likes);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [, start] = useTransition();

  function like() {
    const n = !liked;
    setLiked(n);
    setLikes((c) => Math.max(0, c + (n ? 1 : -1)));
    start(() => { void toggleReplyLike(reply.id); });
  }
  function send() {
    const b = text.trim();
    if (!b) return;
    setText("");
    setOpen(false);
    start(async () => {
      await createReply({ postId, body: b, parentReplyId: rootId });
      await reload();
    });
  }

  return (
    <div className={cn("flex gap-2", nested && "ml-8")}>
      <Link href={`/${reply.author.username}`}>
        <Avatar name={reply.author.displayName} src={reply.author.avatarUrl} size={nested ? 26 : 30} online={reply.author.online} />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="inline-block rounded-2xl rounded-tl-sm bg-bg-muted px-3 py-2 text-[13px]">
          <Link href={`/${reply.author.username}`} className="mr-1.5 font-semibold text-ink-1 hover:underline">
            {reply.author.displayName}
          </Link>
          <MentionText text={reply.bodyText} className="whitespace-pre-wrap text-ink-1" />
        </div>
        <div className="mt-1 flex items-center gap-3 pl-1 text-[12px] text-ink-3">
          <span>{timeAgo(reply.createdAt)}</span>
          <button onClick={like} className={cn("inline-flex items-center gap-1 hover:text-energy-ink", liked && "font-semibold text-energy-ink")}>
            <Heart className={cn("h-3.5 w-3.5", liked && "fill-current")} /> {likes > 0 ? likes : "Like"}
          </button>
          <button onClick={() => { setOpen((o) => !o); if (!open) setText(`@${reply.author.username} `); }} className="font-medium hover:text-ink-1">
            Reply
          </button>
        </div>

        {open && (
          <div className="mt-1.5 flex items-start gap-2">
            <div className="flex-1">
              <MentionInput
                autoFocus
                value={text}
                onChange={setText}
                onSubmit={send}
                placeholder={`Reply to ${reply.author.displayName.split(" ")[0]}…`}
                className="h-8 rounded-full px-3 text-[13px]"
              />
            </div>
            <button onClick={send} disabled={!text.trim()} className="h-8 rounded-full bg-accent px-3 text-[12px] font-semibold text-white hover:bg-accent-hover disabled:opacity-50">
              Reply
            </button>
          </div>
        )}

        {children && <div className="mt-2 space-y-2">{children}</div>}
      </div>
    </div>
  );
}
