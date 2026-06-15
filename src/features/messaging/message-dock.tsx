"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronUp, ChevronDown, ArrowLeft, SendHorizonal, Maximize2, PenSquare, SmilePlus } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn, timeAgo } from "@/lib/utils";
import { loadThread, sendMessage, toggleMessageReaction } from "./actions";
import type { ThreadView, MessageView } from "@/types/views";

const QUICK_EMOJI = ["❤️", "👍", "😂", "🎉", "🙌", "😮"];

/**
 * Bottom-right docked messaging (LinkedIn/Facebook style). Collapsed bar with an
 * unread badge; expands to a thread list; opening a thread shows a compact chat
 * inline. The full /messages page still exists for the expanded view.
 */
export function MessageDock({
  threads,
  viewerId,
}: {
  threads: ThreadView[];
  viewerId: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<ThreadView | null>(null);
  const [messages, setMessages] = useState<MessageView[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [paletteFor, setPaletteFor] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const unread = threads.reduce((n, t) => n + t.unread, 0);

  async function openThread(t: ThreadView) {
    setActive(t);
    setLoading(true);
    const data = await loadThread(t.id);
    setMessages(data?.messages ?? []);
    setLoading(false);
  }

  function send() {
    const body = text.trim();
    if (!body || !active) return;
    setText("");
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${prev.length}`,
        threadId: active.id,
        senderId: viewerId,
        mine: true,
        body,
        createdAt: new Date().toISOString(),
        readAt: null,
        reactions: [],
      },
    ]);
    startTransition(() => {
      void sendMessage(active.id, body);
    });
  }

  function reactTo(messageId: string, emoji: string) {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const existing = m.reactions.find((r) => r.emoji === emoji);
        let reactions;
        if (existing?.mine) {
          reactions = m.reactions
            .map((r) => (r.emoji === emoji ? { ...r, count: r.count - 1, mine: false } : r))
            .filter((r) => r.count > 0);
        } else if (existing) {
          reactions = m.reactions.map((r) => (r.emoji === emoji ? { ...r, count: r.count + 1, mine: true } : r));
        } else {
          reactions = [...m.reactions, { emoji, count: 1, mine: true }];
        }
        return { ...m, reactions };
      }),
    );
    startTransition(() => { void toggleMessageReaction(messageId, emoji); });
  }

  return (
    <div className="fixed bottom-0 right-4 z-40 hidden w-[336px] md:block">
      {/* Header bar */}
      <div className="flex items-center justify-between rounded-t-xl border-1.5 border-b-0 border-line bg-bg px-4 py-2.5">
        {active ? (
          <button onClick={() => setActive(null)} className="flex min-w-0 items-center gap-2">
            <ArrowLeft className="h-4 w-4 shrink-0 text-ink-2" />
            <Avatar name={active.other.displayName} src={active.other.avatarUrl} size={26} online={active.other.online} />
            <span className="truncate text-[14px] font-semibold text-ink-1">{active.other.displayName}</span>
          </button>
        ) : (
          <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2">
            <span className="text-[15px] font-bold text-ink-1">Messaging</span>
            {unread > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-energy px-1.5 text-[11px] font-bold text-white">
                {unread}
              </span>
            )}
          </button>
        )}
        <div className="flex items-center gap-1 text-ink-3">
          <Link href="/messages" className="rounded p-1 hover:bg-bg-muted hover:text-ink-1" aria-label="Open full messages">
            <Maximize2 className="h-4 w-4" />
          </Link>
          {!active && (
            <button onClick={() => setOpen((o) => !o)} className="rounded p-1 hover:bg-bg-muted hover:text-ink-1" aria-label={open ? "Collapse" : "Expand"}>
              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      {(open || active) && (
        <div className="h-[420px] border-1.5 border-line bg-bg">
          {active ? (
            <div className="flex h-full flex-col">
              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {loading ? (
                  <p className="pt-6 text-center text-[13px] text-ink-3">Loading…</p>
                ) : messages.length === 0 ? (
                  <p className="pt-6 text-center text-[13px] text-ink-3">Say hello 👋</p>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className={cn("group flex items-center gap-1", m.mine ? "justify-end" : "justify-start")}>
                      {m.mine && <ReactButton open={paletteFor === m.id} onToggle={() => setPaletteFor((p) => (p === m.id ? null : m.id))} onPick={(e) => { reactTo(m.id, e); setPaletteFor(null); }} side="right" />}
                      <div className="relative max-w-[78%]">
                        <div
                          className={cn(
                            "rounded-xl px-3 py-1.5 text-[13px] leading-[1.45]",
                            m.mine ? "rounded-br-sm bg-accent text-white" : "rounded-bl-sm bg-bg-muted text-ink-1",
                          )}
                        >
                          {m.body}
                        </div>
                        {m.reactions.length > 0 && (
                          <div className={cn("mt-0.5 flex flex-wrap gap-1", m.mine && "justify-end")}>
                            {m.reactions.map((r) => (
                              <button
                                key={r.emoji}
                                onClick={() => reactTo(m.id, r.emoji)}
                                className={cn("inline-flex items-center gap-0.5 rounded-full border-1.5 px-1.5 py-px text-[11px]", r.mine ? "border-accent bg-accent-light" : "border-line bg-bg")}
                              >
                                {r.emoji}{r.count > 1 && <span className="font-semibold">{r.count}</span>}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {!m.mine && <ReactButton open={paletteFor === m.id} onToggle={() => setPaletteFor((p) => (p === m.id ? null : m.id))} onPick={(e) => { reactTo(m.id, e); setPaletteFor(null); }} side="left" />}
                    </div>
                  ))
                )}
              </div>
              <div className="flex items-center gap-2 border-t-1.5 border-line p-2.5">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Write a message…"
                  className="h-9 flex-1 rounded-full border-1.5 border-line bg-bg px-3.5 text-[13px] focus:border-accent focus:outline-none"
                />
                <button
                  onClick={send}
                  disabled={!text.trim()}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
                  aria-label="Send"
                >
                  <SendHorizonal className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto">
              {threads.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
                  <PenSquare className="h-6 w-6 text-ink-3" />
                  <p className="text-[13px] text-ink-3">No conversations yet. Connect with someone to start chatting.</p>
                </div>
              ) : (
                threads.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => openThread(t)}
                    className="flex w-full items-center gap-3 border-b border-line px-3 py-2.5 text-left transition-colors hover:bg-bg-subtle"
                  >
                    <Avatar name={t.other.displayName} src={t.other.avatarUrl} size={36} online={t.other.online} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[13px] font-semibold text-ink-1">{t.other.displayName}</span>
                        {t.lastMessageAt && <span className="shrink-0 text-[11px] text-ink-3">{timeAgo(t.lastMessageAt)}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="line-clamp-1 flex-1 text-[12px] text-ink-3">
                          {t.lastMessagePreview ?? "No messages yet"}
                        </span>
                        {t.unread > 0 && <span className="h-2 w-2 shrink-0 rounded-full bg-energy" />}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReactButton({
  open,
  onToggle,
  onPick,
  side,
}: {
  open: boolean;
  onToggle: () => void;
  onPick: (emoji: string) => void;
  side: "left" | "right";
}) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        aria-label="React"
        className="text-ink-3 opacity-0 transition-opacity hover:text-ink-1 group-hover:opacity-100"
      >
        <SmilePlus className="h-4 w-4" />
      </button>
      {open && (
        <div className={cn("absolute bottom-6 z-10 flex gap-1 rounded-full border-1.5 border-line bg-bg px-2 py-1", side === "right" ? "right-0" : "left-0")}>
          {QUICK_EMOJI.map((e) => (
            <button key={e} onClick={() => onPick(e)} className="text-[16px] transition-transform hover:scale-125">
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
