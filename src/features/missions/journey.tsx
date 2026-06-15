"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Sparkles, Wand2, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import type { JourneyView } from "@/types/views";
import {
  setMyStage,
  draftStagesWithAI,
  publishDraftStages,
  discardDraftStages,
} from "./stage-actions";

export function MissionJourney({
  journey,
  slug,
  isMember,
}: {
  journey: JourneyView;
  slug: string;
  isMember: boolean;
}) {
  const { toast } = useToast();
  const [mine, setMine] = useState<string | null>(journey.myStageId);
  const [placing, startPlace] = useTransition();
  const [managing, startManage] = useTransition();

  function place(stageId: string) {
    if (!isMember) return;
    const next = mine === stageId ? null : stageId;
    setMine(next);
    if (next) toast("Marked where you are", "success");
    startPlace(() => {
      void setMyStage(slug, next);
    });
  }

  function manage(fn: () => Promise<unknown>, msg: string) {
    startManage(() => {
      void fn().then(() => toast(msg, "success"));
    });
  }

  // Steward entry point when there's no journey yet (or to re-draft one).
  const showDraftButton = journey.canManage && journey.draftStages.length === 0;

  if (!journey.hasStages) {
    // Members see nothing until a journey exists; only stewards get the affordance.
    if (!journey.canManage) return null;
    return (
      <div className="rounded-lg border-1.5 border-dashed border-line p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-[15px] font-bold text-ink-1">No journey yet</h2>
            <p className="mt-0.5 text-[13px] text-ink-3">
              Draft a first set of stages with AI, then review and publish.
            </p>
          </div>
          <DraftButton
            label="Draft with AI"
            pending={managing}
            onClick={() => manage(() => draftStagesWithAI(slug), "Drafted a journey — review it below")}
          />
        </div>
        {journey.draftStages.length > 0 && (
          <DraftReview journey={journey} slug={slug} pending={managing} onManage={manage} />
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border-1.5 border-line bg-bg p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-[17px] font-bold tracking-[-0.02em] text-ink-1">The journey</h2>
          <p className="mt-0.5 text-[13px] text-ink-3">
            {isMember
              ? "Where are you on this path? Mark a stage to see who's a few steps ahead."
              : "Join this mission to place yourself and find people a few steps ahead."}
          </p>
        </div>
        {showDraftButton && (
          <DraftButton
            label="Re-draft with AI"
            subtle
            pending={managing}
            onClick={() => manage(() => draftStagesWithAI(slug), "Drafted a new journey — review it below")}
          />
        )}
      </div>

      {/* Stepper */}
      <ol className="mt-4 space-y-2">
        {journey.stages.map((s) => {
          const isMine = mine === s.id;
          return (
            <li
              key={s.id}
              className={cn(
                "rounded-lg border-1.5 p-3.5 transition-colors",
                isMine ? "border-accent bg-accent-light" : "border-line",
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                    isMine ? "bg-accent text-white" : "bg-bg-muted text-ink-3",
                  )}
                >
                  {s.order}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-[14px] font-bold text-ink-1">{s.name}</span>
                    {s.memberCount > 0 && (
                      <span className="text-[11px] font-medium text-ink-3">
                        {s.memberCount} {s.memberCount === 1 ? "person" : "people"}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[13px] leading-[1.55] text-ink-2">{s.description}</p>
                </div>
                {isMember && (
                  <button
                    onClick={() => place(s.id)}
                    disabled={placing}
                    className={cn(
                      "shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold transition-colors",
                      isMine
                        ? "bg-success-bg text-success"
                        : "border-1.5 border-line text-ink-2 hover:border-accent hover:text-accent",
                    )}
                  >
                    {isMine ? (
                      <span className="inline-flex items-center gap-1">
                        <Check className="h-3 w-3" /> You&apos;re here
                      </span>
                    ) : (
                      "I'm here"
                    )}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {/* People a few steps ahead */}
      {isMember && (
        <div className="mt-5 border-t border-line pt-4">
          <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-accent">
            <Sparkles className="h-3.5 w-3.5" /> A few steps ahead
          </div>
          {mine == null ? (
            <p className="text-[13px] text-ink-3">Mark where you are above to meet people a little further along.</p>
          ) : journey.peopleAhead.length === 0 ? (
            <p className="text-[13px] text-ink-3">You&apos;re out in front here — keep sharing what you learn.</p>
          ) : (
            <div className="space-y-1.5">
              {journey.peopleAhead.map((p) => (
                <Link
                  key={p.id}
                  href={`/${p.username}`}
                  className="flex items-center gap-3 rounded-lg border-1.5 border-line p-2.5 transition-colors hover:border-accent-hover"
                >
                  <Avatar name={p.displayName} src={p.avatarUrl} size={38} online={p.online} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-ink-1">{p.displayName}</div>
                    <div className="text-[12px] text-ink-3">
                      {p.stageName} · {p.stepsAhead} {p.stepsAhead === 1 ? "step" : "steps"} ahead
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-3" />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Steward review surface */}
      {journey.draftStages.length > 0 && (
        <DraftReview journey={journey} slug={slug} pending={managing} onManage={manage} />
      )}
    </div>
  );
}

function DraftButton({
  label,
  pending,
  onClick,
  subtle,
}: {
  label: string;
  pending: boolean;
  onClick: () => void;
  subtle?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={pending}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors disabled:opacity-50",
        subtle
          ? "border-1.5 border-line text-ink-2 hover:border-accent hover:text-accent"
          : "bg-accent text-white hover:bg-accent-hover",
      )}
    >
      <Wand2 className="h-3.5 w-3.5" /> {pending ? "Drafting…" : label}
    </button>
  );
}

/** Admin-only: review AI/draft stages before they go live. The approval gate. */
function DraftReview({
  journey,
  slug,
  pending,
  onManage,
}: {
  journey: JourneyView;
  slug: string;
  pending: boolean;
  onManage: (fn: () => Promise<unknown>, msg: string) => void;
}) {
  const source = journey.draftStages[0]?.source;
  const sourceLabel = source === "ai" ? "AI-drafted" : source === "scripted" ? "Draft" : "Draft";
  return (
    <div className="mt-5 rounded-lg border-1.5 border-accent bg-accent-light p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-accent">
          <Wand2 className="h-3.5 w-3.5" /> {sourceLabel} · review before publishing
        </div>
        <span className="text-[11px] font-medium text-accent">{journey.draftStages.length} stages</span>
      </div>
      <ol className="mt-3 space-y-2">
        {journey.draftStages.map((s) => (
          <li key={s.id} className="rounded-lg border-1.5 border-line bg-bg p-3">
            <div className="flex items-baseline gap-2">
              <span className="text-[11px] font-bold text-accent">{s.order}</span>
              <span className="font-display text-[13px] font-bold text-ink-1">{s.name}</span>
            </div>
            <p className="mt-0.5 text-[12px] leading-[1.5] text-ink-2">{s.description}</p>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-[12px] text-ink-3">
        Nothing here is visible to members until you publish. AI drafts; you approve.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onManage(() => publishDraftStages(slug), "Journey published 🎉")}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-full bg-accent px-3.5 py-1.5 text-[12px] font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" /> Publish
        </button>
        <button
          onClick={() => onManage(() => discardDraftStages(slug), "Draft discarded")}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-full border-1.5 border-line px-3.5 py-1.5 text-[12px] font-semibold text-ink-2 hover:border-error hover:text-error disabled:opacity-50"
        >
          <X className="h-3.5 w-3.5" /> Discard
        </button>
      </div>
    </div>
  );
}
