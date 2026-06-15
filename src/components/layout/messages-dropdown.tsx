"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { MessageCircle, PenSquare } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn, timeAgo } from "@/lib/utils";
import type { ThreadView } from "@/types/views";

export function MessagesDropdown({ threads }: { threads: ThreadView[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Only show accepted threads in the dropdown; requests live on /messages.
  const accepted = threads.filter((t) => t.state === "accepted");
  const unread = accepted.reduce((sum, t) => sum + (t.unread > 0 ? 1 : 0), 0);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Messages"
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-bg-muted hover:text-ink-1"
      >
        <MessageCircle className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-energy px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-[380px] overflow-hidden rounded-xl border-1.5 border-line bg-bg">
          <div className="flex items-center justify-between border-b-1.5 border-line px-4 py-2.5">
            <span className="text-[14px] font-bold text-ink-1">Messages</span>
            <Link
              href="/messages"
              onClick={() => setOpen(false)}
              className="text-[12px] font-semibold text-accent hover:text-accent-hover"
            >
              See all
            </Link>
          </div>

          {/* New message CTA */}
          <Link
            href="/connections"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 border-b-1.5 border-line px-4 py-3 transition-colors hover:bg-bg-subtle"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white">
              <PenSquare className="h-4 w-4" />
            </span>
            <span className="text-[13px] font-semibold text-ink-1">New message</span>
          </Link>

          {/* Threads */}
          <div className="max-h-[420px] overflow-y-auto">
            {accepted.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <MessageCircle className="mx-auto mb-2 h-6 w-6 text-ink-3/50" />
                <p className="text-[13px] font-semibold text-ink-1">No conversations yet</p>
                <p className="mt-0.5 text-[12px] text-ink-3">Start one from someone&apos;s profile.</p>
              </div>
            ) : (
              accepted.slice(0, 10).map((t) => (
                <Link
                  key={t.id}
                  href={`/messages/${t.id}`}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-bg-subtle",
                    t.unread > 0 && "bg-accent-light/40",
                  )}
                >
                  <Avatar name={t.other.displayName} src={t.other.avatarUrl} size={40} online={t.other.online} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={cn("truncate text-[13.5px]", t.unread > 0 ? "font-bold text-ink-1" : "font-semibold text-ink-1")}>
                        {t.other.displayName}
                      </span>
                      <span className="shrink-0 text-[11px] text-ink-3">
                        {t.lastMessageAt ? timeAgo(t.lastMessageAt) : ""}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "truncate text-[12.5px] leading-snug",
                        t.unread > 0 ? "font-medium text-ink-1" : "text-ink-3",
                      )}
                    >
                      {t.lastMessagePreview ?? "Say hello…"}
                    </p>
                  </div>
                  {t.unread > 0 && <span className="h-2 w-2 shrink-0 rounded-full bg-energy" />}
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
