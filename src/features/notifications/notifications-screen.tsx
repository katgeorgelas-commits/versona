"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Bell, UserPlus, UserCheck, MessageCircle, Heart, MessageSquare, Sparkles, AtSign,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn, timeAgo } from "@/lib/utils";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { markAllRead } from "./actions";
import type { NotificationView } from "@/types/views";

const ICONS: Record<string, typeof Bell> = {
  connection_request: UserPlus,
  connection_accepted: UserCheck,
  message: MessageCircle,
  reaction: Heart,
  reply: MessageSquare,
  mention: AtSign,
  weekly_prompt: Sparkles,
};

export function NotificationsScreen({ items }: { items: NotificationView[] }) {
  const [list, setList] = useState(items);
  const [, startTransition] = useTransition();
  const unread = list.filter((n) => !n.read).length;

  function readAll() {
    setList((prev) => prev.map((n) => ({ ...n, read: true })));
    startTransition(() => {
      void markAllRead();
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Breadcrumbs items={[{ label: "Notifications" }]} />
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">
          Notifications {unread > 0 && <span className="text-base text-accent">({unread})</span>}
        </h1>
        {unread > 0 && (
          <Button size="sm" variant="ghost" onClick={readAll}>
            Mark all read
          </Button>
        )}
      </div>

      {list.length === 0 ? (
        <div className="rounded-lg border-1.5 border-dashed border-line p-10 text-center text-[13px] text-ink-3">
          You&apos;re all caught up.
        </div>
      ) : (
        <div className="space-y-1.5">
          {list.map((n) => {
            const Icon = ICONS[n.type] ?? Bell;
            const inner = (
              <div
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3 transition-colors",
                  n.read ? "border-1.5 border-line" : "border-1.5 border-accent bg-accent-light",
                )}
              >
                {n.actor ? (
                  <Avatar name={n.actor.displayName} src={n.actor.avatarUrl} size={36} />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{n.summary}</p>
                  <span className="text-xs text-muted-foreground">{timeAgo(n.createdAt)}</span>
                </div>
                <Icon className="mt-1 h-4 w-4 shrink-0 text-ink-3" />
              </div>
            );
            return n.href ? (
              <Link key={n.id} href={n.href}>{inner}</Link>
            ) : (
              <div key={n.id}>{inner}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
