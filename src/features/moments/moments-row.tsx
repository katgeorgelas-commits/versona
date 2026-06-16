"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { timeAgo } from "@/lib/utils";
import { createMoment } from "./actions";
import type { MomentView } from "./data";
import type { SessionUser } from "@/types/app";

export function MomentsRow({ moments, user }: { moments: MomentView[]; user: SessionUser }) {
  const { toast } = useToast();
  const [view, setView] = useState<MomentView | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [text, setText] = useState("");
  const [pending, start] = useTransition();

  function post() {
    const body = text.trim();
    if (!body) return;
    setComposeOpen(false);
    setText("");
    toast("Moment shared", "energy");
    start(() => { void createMoment(body); });
  }

  return (
    <>
      <div className="flex gap-3 overflow-x-auto">
        {/* Add */}
        <button onClick={() => setComposeOpen(true)} className="flex w-16 shrink-0 flex-col items-center gap-1">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-accent text-accent">
            <Plus className="h-5 w-5" />
          </span>
          <span className="truncate text-[11px] font-medium text-ink-2">Your moment</span>
        </button>
        {moments.map((m) => (
          <button key={m.id} onClick={() => setView(m)} className="flex w-16 shrink-0 flex-col items-center gap-1">
            <span className="rounded-full p-[2px] ring-2 ring-energy ring-offset-2 ring-offset-bg">
              <Avatar name={m.author.displayName} src={m.author.avatarUrl} size={48} />
            </span>
            <span className="truncate text-[11px] text-ink-2">{m.author.displayName.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {/* View moment */}
      <Modal open={!!view} onClose={() => setView(null)} title={view ? `${view.author.displayName}'s moment` : ""}>
        {view && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Avatar name={view.author.displayName} src={view.author.avatarUrl} size={36} online={view.author.online} />
              <div>
                <div className="text-[14px] font-semibold text-ink-1">{view.author.displayName}</div>
                <div className="text-[11px] text-ink-3">{timeAgo(view.createdAt)}</div>
              </div>
            </div>
            <div className="rounded-lg bg-accent-light p-6 text-center text-[18px] font-medium leading-snug text-ink-1">
              {view.text}
            </div>
          </div>
        )}
      </Modal>

      {/* Compose moment */}
      <Modal open={composeOpen} onClose={() => setComposeOpen(false)} title="Share a moment">
        <p className="mb-2 text-[13px] text-ink-3">A quick update for your network — what just happened?</p>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={140} placeholder="Just shipped…" />
        <div className="mt-1 text-right text-[11px] text-ink-3">{text.length}/140</div>
        <div className="mt-2 flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => setComposeOpen(false)}>Cancel</Button>
          <Button size="sm" onClick={post} disabled={!text.trim() || pending}>Share</Button>
        </div>
      </Modal>
    </>
  );
}
