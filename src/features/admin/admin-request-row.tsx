"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import { resolveMissionRequest } from "@/features/missions/actions";
import type { AdminRequestRow as Row } from "./data";

export function AdminRequestRow({ request }: { request: Row }) {
  const [done, setDone] = useState<null | "approved" | "declined">(null);
  const [pending, start] = useTransition();

  function resolve(approve: boolean) {
    setDone(approve ? "approved" : "declined");
    start(() => { void resolveMissionRequest(request.id, approve); });
  }

  if (done) {
    return (
      <div className="rounded-lg border-1.5 border-line p-4 text-[13px] text-ink-3">
        <b className="text-ink-1">{request.name}</b> — {done}.
      </div>
    );
  }

  return (
    <div className="rounded-lg border-1.5 border-line p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded-sm bg-accent-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-accent">{request.kind}</span>
            <span className="font-display text-[15px] font-bold text-ink-1">{request.name}</span>
          </div>
          <div className="mt-0.5 text-[12px] text-ink-3">Requested by {request.requester} · {timeAgo(request.createdAt)}</div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button onClick={() => resolve(true)} disabled={pending} className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-accent-hover">
            <Check className="h-3.5 w-3.5" /> Approve
          </button>
          <button onClick={() => resolve(false)} disabled={pending} className="inline-flex items-center gap-1 rounded-full border-1.5 border-line px-3 py-1.5 text-[12px] font-semibold text-ink-2 hover:border-error hover:text-error">
            <X className="h-3.5 w-3.5" /> Decline
          </button>
        </div>
      </div>
      <p className="mt-2 text-[13px] text-ink-2">{request.brief}</p>
    </div>
  );
}
