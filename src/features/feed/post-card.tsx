"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  Bookmark, MessageCircle, Flag, Bot, Flame, Repeat2, MoreHorizontal, Link2, Pencil, Trash2, SmilePlus, Sparkles,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn, timeAgo, spacePath } from "@/lib/utils";
import { REACTIONS, REACTION_ORDER } from "@/config/reactions";
import type { PostView, ReplyView } from "@/types/views";
import type { ReactionKind } from "@/types/app";
import {
  toggleReaction, toggleSave, loadReplies, flagPostAi,
  repost, votePoll, deletePost, editPost, reportPost,
} from "./actions";
import { setMembership } from "@/features/missions/actions";
import { CommentThread } from "./comments";

export function PostCard({
  post,
  embedded = false,
  expandReplies = false,
  variant = "card",
}: {
  post: PostView;
  embedded?: boolean;
  expandReplies?: boolean;
  /** "card" = standalone bordered card; "row" = flush divider row in a feed list. */
  variant?: "card" | "row";
}) {
  const { toast } = useToast();
  const [counts, setCounts] = useState(post.reactions.counts);
  const [mine, setMine] = useState<ReactionKind[]>(post.reactions.mine);
  const [total, setTotal] = useState(post.reactions.total);
  const [saved, setSaved] = useState(post.saved);
  const [flagged, setFlagged] = useState(post.aiFlagged);
  const [deleted, setDeleted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(post.bodyText);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reactOpen, setReactOpen] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [repostCount, setRepostCount] = useState(post.repostCount);
  const [showReplies, setShowReplies] = useState(false);
  const [reported, setReported] = useState(false);
  const [replies, setReplies] = useState<ReplyView[] | null>(null);
  const [popKind, setPopKind] = useState<ReactionKind | null>(null);
  const [popN, setPopN] = useState(0);
  const [poll, setPoll] = useState(post.poll);
  const [joinedSpace, setJoinedSpace] = useState(post.missionIsMember);
  const [, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);
  const reactRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (reactRef.current && !reactRef.current.contains(e.target as Node)) setReactOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (expandReplies && replies === null) {
      setShowReplies(true);
      void loadReplies(post.id).then((r) => setReplies(r as ReplyView[]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandReplies]);

  if (deleted) return null;

  const trending = total >= 3;
  const myReaction = mine[0] ?? null;

  // One reaction per user — picking switches; picking the same toggles off.
  function pickReaction(kind: ReactionKind) {
    setReactOpen(false);
    const had = mine.includes(kind);
    const newMine: ReactionKind[] = had ? [] : [kind];
    setCounts((prev) => {
      const next = { ...prev };
      mine.forEach((k) => (next[k] = Math.max(0, (next[k] ?? 0) - 1)));
      newMine.forEach((k) => (next[k] = (next[k] ?? 0) + 1));
      return next;
    });
    setTotal((t) => Math.max(0, t - mine.length + newMine.length));
    if (!had) { setPopKind(kind); setPopN((n) => n + 1); }
    const toRemove = mine.filter((k) => !newMine.includes(k));
    const toAdd = newMine.filter((k) => !mine.includes(k));
    setMine(newMine);
    startTransition(() => {
      toRemove.forEach((k) => void toggleReaction(post.id, k));
      toAdd.forEach((k) => void toggleReaction(post.id, k));
    });
  }

  function doRepost() {
    if (reposted) return;
    setReposted(true);
    setRepostCount((n) => n + 1);
    toast("Reposted to your feed", "energy");
    startTransition(() => { void repost(post.id); });
  }
  function vote(optionId: string) {
    if (poll?.myVote) return;
    setPoll((prev) => prev ? { ...prev, myVote: optionId, totalVotes: prev.totalVotes + 1, options: prev.options.map((o) => (o.id === optionId ? { ...o, votes: o.votes + 1 } : o)) } : prev);
    startTransition(() => { void votePoll(post.id, optionId); });
  }
  function copyLink() {
    setMenuOpen(false);
    if (typeof window !== "undefined") { void navigator.clipboard?.writeText(`${window.location.origin}/post/${post.id}`); toast("Link copied"); }
  }
  function remove() { setMenuOpen(false); setDeleted(true); toast("Post deleted"); startTransition(() => { void deletePost(post.id); }); }
  function saveEdit() { setEditing(false); startTransition(() => { void editPost(post.id, body); }); }
  function save() { setSaved((s) => !s); startTransition(() => { void toggleSave(post.id); }); }
  function joinSpace() {
    if (!post.mission || joinedSpace) return;
    setJoinedSpace(true);
    toast(`Joined ${post.mission.name}`, "success");
    startTransition(() => { void setMembership(post.mission!.slug, true); });
  }
  async function openReplies() { setShowReplies((v) => !v); if (replies === null) setReplies((await loadReplies(post.id)) as ReplyView[]); }
  function flag() { setFlagged(true); startTransition(() => { void flagPostAi(post.id); }); }

  const distinctKinds = REACTION_ORDER.filter((k) => (counts[k] ?? 0) > 0);
  const commentCount = replies ? replies.length : post.replyCount;

  return (
    <article className={cn(
      embedded
        ? "rounded-lg border-1.5 border-line p-4"
        : variant === "row"
          ? "px-5 py-4"
          : "rounded-lg border-1.5 bg-bg p-5",
      !embedded && variant === "card" && post.isPromptResponse
        ? "border-energy/60 bg-energy-light"
        : !embedded && variant === "card" && "border-line",
      flagged && "opacity-70",
    )}>
      {/* Repost label */}
      {post.repostOf && (
        <div className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-ink-3">
          <Repeat2 className="h-3.5 w-3.5" />
          <Link href={`/${post.author.username}`} className="font-semibold hover:underline">{post.author.displayName}</Link> reposted
        </div>
      )}

      {!post.repostOf && (
        <div className="flex items-start gap-3">
          <Link href={`/${post.author.username}`}>
            <Avatar name={post.author.displayName} src={post.author.avatarUrl} size={embedded ? 32 : 42} online={post.author.online} />
          </Link>
          <div className="min-w-0 flex-1">
            {/* Minimal meta: name · @handle · time + icons */}
            <div className="flex flex-wrap items-center gap-x-1.5 text-[13px] leading-tight">
              <Link href={`/${post.author.username}`} className="font-semibold text-ink-1 hover:underline">{post.author.displayName}</Link>
              <span className="text-ink-3">@{post.author.username}</span>
              <span className="text-ink-3">· {timeAgo(post.createdAt)}</span>
              {post.edited && <span className="text-ink-3">· edited</span>}
              {trending && !embedded && <Flame className="h-3.5 w-3.5 text-energy" aria-label="Trending" />}
              {flagged && <Bot className="h-3.5 w-3.5 text-ink-3" aria-label="Likely AI" />}
            </div>
            {/* Subtle context line */}
            {!embedded && (post.mission || post.isPromptResponse) && (
              <div className="flex flex-wrap items-center gap-x-1 text-[12px] text-ink-3">
                {post.mission && <span>in <Link href={spacePath(post.mission.kind, post.mission.slug)} className="font-medium text-accent hover:underline">{post.mission.name}</Link></span>}
                {/* Land in a space you're not part of → one-tap join */}
                {post.mission && !joinedSpace && !post.isOwn && (
                  <button
                    onClick={joinSpace}
                    className="ml-0.5 rounded-full bg-accent-light px-2 py-px text-[11px] font-semibold text-accent transition-colors hover:bg-accent hover:text-white"
                  >
                    + Join
                  </button>
                )}
                {post.mission && joinedSpace && !post.missionIsMember && (
                  <span className="ml-0.5 text-[11px] font-medium text-success">· Joined</span>
                )}
                {post.isPromptResponse && <span>{post.mission ? "· " : ""}weekly prompt</span>}
              </div>
            )}
          </div>
          {!embedded && (
            <div ref={menuRef} className="relative">
              <button onClick={() => setMenuOpen((o) => !o)} aria-label="Post menu" className="rounded-full p-1 text-ink-3 hover:bg-bg-muted hover:text-ink-1">
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-8 z-20 w-44 overflow-hidden rounded-lg border-1.5 border-line bg-bg py-1">
                  <button onClick={copyLink} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-ink-2 hover:bg-bg-muted"><Link2 className="h-4 w-4" /> Copy link</button>
                  {post.isOwn && <button onClick={() => { setMenuOpen(false); setEditing(true); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-ink-2 hover:bg-bg-muted"><Pencil className="h-4 w-4" /> Edit</button>}
                  {post.isOwn && <button onClick={remove} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-error hover:bg-error-bg"><Trash2 className="h-4 w-4" /> Delete</button>}
                  {!post.isOwn && !flagged && <button onClick={() => { setMenuOpen(false); flag(); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-ink-2 hover:bg-bg-muted"><Flag className="h-4 w-4" /> Flag as AI</button>}
                  {!post.isOwn && !reported && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setReported(true);
                        toast("Report submitted — thanks for helping keep Versona safe.");
                        startTransition(() => { void reportPost(post.id, "user_report"); });
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-error hover:bg-error-bg"
                    >
                      <Flag className="h-4 w-4" /> Report
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Prompt question (only when this post replies to the weekly prompt) */}
      {!embedded && post.isPromptResponse && post.promptText && (
        <div className="mt-3 rounded-md bg-energy px-3.5 py-2.5 text-white">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em]">
            <Sparkles className="h-3 w-3" /> Replying to this week&apos;s prompt
          </div>
          <p className="text-[13.5px] font-semibold leading-snug">
            {post.promptText}
          </p>
        </div>
      )}

      {/* Body */}
      {editing ? (
        <div className="mt-3">
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} className="w-full rounded-md border-1.5 border-line bg-bg px-3 py-2 text-[15px] focus:border-accent focus:outline-none" />
          <div className="mt-2 flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setBody(post.bodyText); }}>Cancel</Button>
            <Button size="sm" onClick={saveEdit}>Save</Button>
          </div>
        </div>
      ) : (
        post.bodyText && <div className={cn("whitespace-pre-wrap text-ink-1", embedded ? "mt-2 text-[14px] leading-[1.55]" : "mt-2.5 text-[15px] leading-[1.6]")} dangerouslySetInnerHTML={{ __html: post.bodyHtml }} />
      )}

      {post.imageUrl && (
        <div className="mt-3 overflow-hidden rounded-lg border-1.5 border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.imageUrl} alt="" className="w-full object-cover" style={{ maxHeight: 400 }} />
        </div>
      )}
      {post.repostOf && <div className="mt-3"><PostCard post={post.repostOf} embedded /></div>}
      {poll && <PollBlock poll={poll} onVote={vote} />}

      {/* Hashtags are now rendered inline in the post body as clickable links */}

      {!embedded && (
        <>
          {/* Count summary line (FB-style) */}
          {(total > 0 || commentCount > 0 || repostCount > 0) && (
            <div className="mt-3 flex items-center justify-between text-[12px] text-ink-3">
              <span className="flex items-center gap-1">
                {distinctKinds.length > 0 && (
                  <span className="flex">{distinctKinds.map((k) => <span key={k} className="-ml-0.5 first:ml-0">{REACTIONS[k].emoji}</span>)}</span>
                )}
                {total > 0 && <span>{total}</span>}
                {post.reactions.reactors[0] && total > 0 && (
                  <span className="ml-1 hidden sm:inline">· <span className="font-medium text-ink-2">{post.reactions.reactors[0].displayName.split(" ")[0]}</span>{total > 1 ? ` +${total - 1}` : ""}</span>
                )}
              </span>
              <div className="flex items-center gap-3">
                {commentCount > 0 && <button onClick={openReplies} className="hover:underline">{commentCount} comments</button>}
                {repostCount > 0 && <span>{repostCount} reposts</span>}
              </div>
            </div>
          )}

          {/* Action row — clean icons */}
          <div className="mt-1.5 flex items-center border-t border-line pt-1.5">
            {/* React */}
            <div ref={reactRef} className="relative flex-1">
              <ActionBtn
                onClick={() => (myReaction ? pickReaction(myReaction) : setReactOpen((o) => !o))}
                onMouseEnter={() => setReactOpen(true)}
                active={!!myReaction}
                activeClass="text-energy-ink"
                icon={myReaction ? <span key={popN} className="animate-pop text-[15px] leading-none">{REACTIONS[myReaction].emoji}</span> : <SmilePlus className="h-[18px] w-[18px]" />}
                label={myReaction ? REACTIONS[myReaction].label : "React"}
              />
              {reactOpen && (
                <div onMouseLeave={() => setReactOpen(false)} className="absolute bottom-10 left-1/2 z-20 flex -translate-x-1/2 gap-1 rounded-full border-1.5 border-line bg-bg px-2 py-1.5">
                  {REACTION_ORDER.map((k) => (
                    <button key={k} onClick={() => pickReaction(k)} title={REACTIONS[k].label} className={cn("text-[20px] transition-transform hover:scale-125", mine.includes(k) && "scale-110")}>
                      {REACTIONS[k].emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <ActionBtn onClick={openReplies} icon={<MessageCircle className="h-[18px] w-[18px]" />} label="Comment" />
            <ActionBtn onClick={doRepost} active={reposted} activeClass="text-energy-ink" icon={<Repeat2 className="h-[18px] w-[18px]" />} label="Repost" />
            <ActionBtn onClick={save} active={saved} activeClass="text-accent" icon={<Bookmark className={cn("h-[18px] w-[18px]", saved && "fill-current")} />} label="Save" />
          </div>

          {showReplies && (
            <div className="mt-3 border-t border-line pt-3">
              {replies === null ? <p className="text-[13px] text-ink-3">Loading…</p> : (
                <CommentThread replies={replies} postId={post.id} reload={async () => setReplies((await loadReplies(post.id)) as ReplyView[])} />
              )}
            </div>
          )}
        </>
      )}
    </article>
  );
}

function ActionBtn({
  icon, label, onClick, onMouseEnter, active = false, activeClass = "",
}: {
  icon: React.ReactNode; label: string; onClick: () => void; onMouseEnter?: () => void; active?: boolean; activeClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-[13px] font-medium transition-colors hover:bg-bg-muted",
        active ? activeClass : "text-ink-3 hover:text-ink-1",
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function PollBlock({ poll, onVote }: { poll: NonNullable<PostView["poll"]>; onVote: (id: string) => void }) {
  const voted = !!poll.myVote;
  return (
    <div className="mt-3 space-y-1.5">
      {poll.options.map((o) => {
        const pct = poll.totalVotes ? Math.round((o.votes / poll.totalVotes) * 100) : 0;
        const isMine = poll.myVote === o.id;
        return (
          <button key={o.id} onClick={() => onVote(o.id)} disabled={voted} className={cn("relative block w-full overflow-hidden rounded-md border-1.5 px-3 py-2 text-left text-[13px] transition-colors", voted ? "cursor-default border-line" : "border-line hover:border-accent")}>
            {voted && <span className={cn("absolute inset-y-0 left-0 rounded-l-[8px]", isMine ? "bg-accent-light" : "bg-bg-muted")} style={{ width: `${pct}%` }} />}
            <span className="relative flex items-center justify-between">
              <span className={cn("font-medium", isMine ? "text-accent" : "text-ink-1")}>{o.text}</span>
              {voted && <span className="text-ink-3">{pct}%</span>}
            </span>
          </button>
        );
      })}
      <p className="text-[11px] text-ink-3">{poll.totalVotes} {poll.totalVotes === 1 ? "vote" : "votes"}{voted ? "" : " · tap to vote"}</p>
    </div>
  );
}
