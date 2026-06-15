import Link from "next/link";
import { Home, Compass, Bookmark, SquarePen, Sparkles, Settings, Flame, LifeBuoy } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { CompletenessRing } from "@/components/ui/completeness-ring";
import { getProfileView } from "@/features/profile/data";
import { getGlobalPrompt } from "@/features/feed/data";
import type { SessionUser } from "@/types/app";

/** Left rail — compact identity card + weekly prompt + quick links (3-column shell). */
export async function LeftRail({ user }: { user: SessionUser }) {
  const [profile, prompt] = await Promise.all([
    getProfileView(user.username, user.id),
    getGlobalPrompt(),
  ]);

  const links = [
    { href: "/feed", label: "Home", icon: Home },
    { href: "/connect", label: "Community", icon: Compass },
    { href: "/discover", label: "Discover", icon: Sparkles },
    { href: "/signatures", label: "Signatures", icon: Flame },
    { href: "/saved", label: "Saved", icon: Bookmark },
    { href: `/${user.username}`, label: "Edit profile", icon: SquarePen },
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/support", label: "Support", icon: LifeBuoy },
  ];

  return (
    <div className="sticky top-6 space-y-3">
      <div className="overflow-hidden rounded-lg border-1.5 border-line bg-bg">
        <div className="h-12 bg-brand-gradient" />
        <div className="px-4 pb-4">
          <Link href={`/${user.username}`} className="block">
            <Avatar name={user.displayName} src={user.avatarUrl} size={48} className="-mt-7 ring-4 ring-bg" />
            <div className="mt-2 truncate font-display text-[15px] font-bold leading-tight text-ink-1">
              {user.displayName}
            </div>
            <div className="truncate text-[12px] text-ink-3">@{user.username}</div>
          </Link>

        {profile?.headline && (
          <p className="mt-3 text-[13px] leading-[1.5] text-ink-2">{profile.headline}</p>
        )}

        {/* Momentum */}
        <div className="mt-3 flex items-center gap-3 border-t border-line pt-3 text-[12px]">
          <span className="text-ink-2">
            <span className="font-bold text-ink-1">{profile?.followerCount ?? 0}</span> followers
          </span>
          {(profile?.postCount ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1 font-semibold text-energy-ink">
              <Flame className="h-3.5 w-3.5" /> {profile?.postCount} posts
            </span>
          )}
        </div>

        {profile && profile.completeness < 100 ? (
          <Link
            href={`/${user.username}`}
            className="mt-3 flex items-center gap-2.5 rounded-md border-1.5 border-line p-2.5 transition-colors hover:border-accent-hover"
          >
            <CompletenessRing value={profile.completeness} size={36} />
            <span className="text-[12px] leading-tight text-ink-2">
              <span className="font-semibold text-ink-1">Complete your profile</span>
              <br />
              {profile.completeness}% — keep going
            </span>
          </Link>
        ) : profile ? (
          <div className="mt-3 flex items-center gap-2 rounded-md bg-success-bg p-2.5 text-[12px] font-semibold text-success">
            <Sparkles className="h-4 w-4" /> Profile complete
          </div>
        ) : null}
        </div>
      </div>

      {/* Weekly prompt card */}
      <Link
        href="/circles/versona-asks"
        className="block rounded-lg border-1.5 border-energy/40 bg-energy-light p-3.5 transition-colors hover:border-energy/70"
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

      <nav className="rounded-lg border-1.5 border-line bg-bg p-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="flex items-center gap-3 rounded-md px-2.5 py-2 text-[13px] font-medium text-ink-2 transition-colors hover:bg-bg-muted hover:text-ink-1"
          >
            <l.icon className="h-[18px] w-[18px] text-ink-3" strokeWidth={2} />
            {l.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
