import Link from "next/link";
import { ArrowRight, Flame, Sparkles } from "lucide-react";
import { getMissions } from "@/features/missions/data";
import { getGlobalPrompt } from "@/features/feed/data";
import { SectionLabel } from "@/components/layout/page-parts";
import { spacePath } from "@/lib/utils";
import type { SessionUser } from "@/types/app";

/** Right rail — Weekly prompt + Your missions / discover (contextual column). */
export async function RightRail({ user }: { user: SessionUser }) {
  const [missions, prompt] = await Promise.all([
    getMissions(user.id),
    getGlobalPrompt(),
  ]);
  const joined = missions.filter((m) => m.isMember);
  const discover = missions.filter((m) => !m.isMember).slice(0, 3);

  return (
    <div className="sticky top-6 space-y-3">
      {/* Weekly prompt (relocated from the left rail) */}
      <Link
        href="/circles/versona-asks"
        className="block rounded-lg border-l-4 border-energy bg-energy-light p-3.5 transition-colors hover:bg-energy-light/70"
      >
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-energy-ink">
            <Sparkles className="h-3 w-3" /> This week&apos;s prompt
          </span>
          {prompt.responseCount > 0 && (
            <span className="shrink-0 text-[10px] font-medium text-energy-ink/80">
              {prompt.responseCount} {prompt.responseCount === 1 ? "response" : "responses"}
            </span>
          )}
        </div>
        <p className="text-[13px] font-medium leading-snug text-ink-1">{prompt.text}</p>
        <div className="mt-2.5 text-[12px] font-semibold text-energy-ink">
          Share your answer <span aria-hidden>→</span>
        </div>
      </Link>

      {/* Your missions */}
      <div className="rounded-lg border-1.5 border-line bg-bg p-4">
        <SectionLabel className="mb-3">
          {joined.length ? "Your missions" : "Missions for you"}
        </SectionLabel>
        <div className="space-y-0.5">
          {(joined.length ? joined : discover).map((m) => (
            <Link
              key={m.id}
              href={spacePath(m.kind, m.slug)}
              className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-bg-muted"
            >
              <span className="truncate text-[13px] font-medium text-ink-1">{m.name}</span>
              {m.newThisWeek > 0 ? (
                <span className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-bold text-energy-ink">
                  <Flame className="h-3 w-3" /> {m.newThisWeek}
                </span>
              ) : (
                <span className="shrink-0 text-[11px] text-ink-3">{m.memberCount}</span>
              )}
            </Link>
          ))}
        </div>
        <Link
          href={joined.length ? "/connect" : "/discover"}
          className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-semibold text-accent hover:text-accent-hover"
        >
          {joined.length ? "Open Community" : "Discover more"} <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
