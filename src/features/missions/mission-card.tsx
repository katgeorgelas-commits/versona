"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Flame } from "lucide-react";
import { cn, spacePath } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import type { MissionView } from "@/types/views";
import { setMembership } from "./actions";

function Check() {
  return (
    <svg width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 7l4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Pill Join / green Joined chip. */
function JoinControl({
  member,
  onToggle,
  disabled,
}: {
  member: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        onToggle();
      }}
      disabled={disabled}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-[15px] py-[5px] text-[12px] font-semibold tracking-[0.01em] transition-colors duration-[140ms]",
        member ? "bg-success-bg text-success" : "bg-accent text-white hover:bg-accent-hover",
      )}
    >
      {member ? (
        <><Check /> Joined</>
      ) : (
        "Join"
      )}
    </button>
  );
}

export function MissionCard({ mission }: { mission: MissionView }) {
  const { toast } = useToast();
  const [member, setMember] = useState(mission.isMember);
  const [count, setCount] = useState(mission.memberCount);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !member;
    setMember(next);
    setCount((c) => c + (next ? 1 : -1));
    if (next) toast(`Joined ${mission.name}`, "success");
    startTransition(() => {
      void setMembership(mission.slug, next);
    });
  }

  return (
    <Link
      href={spacePath(mission.kind, mission.slug)}
      className="flex min-h-[158px] flex-col justify-between rounded-lg border-1.5 border-line bg-bg px-[22px] pb-[18px] pt-5 transition-[transform,border-color] duration-[140ms] hover:-translate-y-0.5 hover:border-accent-hover"
    >
      <div>
        <div className="mb-2.5 flex items-start justify-between gap-3">
          <h3 className="flex-1 font-display text-[15px] font-bold leading-[1.25] tracking-[-0.015em] text-ink-1">
            {mission.name}
          </h3>
          <JoinControl member={member} onToggle={toggle} disabled={pending} />
        </div>
        <p className="line-clamp-3 text-[13px] leading-[1.6] text-ink-2">{mission.brief}</p>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-line pt-3.5">
        <span className="text-[11px] font-medium tracking-[0.01em] text-ink-3">
          {count} {count === 1 ? "member" : "members"}
        </span>
        {mission.newThisWeek > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold tracking-[0.01em] text-energy-ink">
            <Flame className="h-3 w-3" /> {mission.newThisWeek} new this week
          </span>
        )}
      </div>
    </Link>
  );
}

/** Join/leave control for the mission detail header. */
export function MissionJoinButton({
  slug,
  isMember,
}: {
  slug: string;
  isMember: boolean;
}) {
  const { toast } = useToast();
  const [member, setMember] = useState(isMember);
  const [pending, startTransition] = useTransition();
  return (
    <JoinControl
      member={member}
      disabled={pending}
      onToggle={() => {
        const next = !member;
        setMember(next);
        if (next) toast("Joined mission", "success");
        startTransition(() => {
          void setMembership(slug, next);
        });
      }}
    />
  );
}
