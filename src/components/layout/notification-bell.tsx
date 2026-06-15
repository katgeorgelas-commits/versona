"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn, timeAgo } from "@/lib/utils";
import { markAllRead } from "@/features/notifications/actions";
import type { NotificationView } from "@/types/views";

export function NotificationBell({
  items,
  unread: initialUnread,
}: {
  items: NotificationView[];
  unread: number;
}) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(initialUnread);
  const [, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      setUnread(0);
      startTransition(() => {
        void markAllRead();
      });
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-bg-muted hover:text-ink-1"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-energy px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-[340px] overflow-hidden rounded-xl border-1.5 border-line bg-bg">
          <div className="flex items-center justify-between border-b-1.5 border-line px-4 py-2.5">
            <span className="text-[14px] font-bold text-ink-1">Notifications</span>
            <Link href="/notifications" onClick={() => setOpen(false)} className="text-[12px] font-semibold text-accent hover:text-accent-hover">
              See all
            </Link>
          </div>
          <div className="max-h-[380px] overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-[13px] text-ink-3">You&apos;re all caught up.</p>
            ) : (
              items.slice(0, 8).map((n) => {
                const inner = (
                  <div className={cn("flex items-start gap-2.5 px-4 py-2.5", !n.read && "bg-accent-light")}>
                    {n.actor ? (
                      <Avatar name={n.actor.displayName} src={n.actor.avatarUrl} size={32} online={n.actor.online} />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-muted">
                        <Bell className="h-4 w-4 text-ink-3" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] leading-snug text-ink-1">{n.summary}</p>
                      <span className="text-[11px] text-ink-3">{timeAgo(n.createdAt)}</span>
                    </div>
                    {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-energy" />}
                  </div>
                );
                return n.href ? (
                  <Link key={n.id} href={n.href} onClick={() => setOpen(false)} className="block border-b border-line hover:bg-bg-subtle">
                    {inner}
                  </Link>
                ) : (
                  <div key={n.id} className="border-b border-line">{inner}</div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
