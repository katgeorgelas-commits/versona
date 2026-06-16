"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Compass,
  Rocket,
  MessageCircle,
  Bell,
  Bookmark,
  Flame,
  Settings,
  Search,
  SquarePen,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { CompletenessRing } from "@/components/ui/completeness-ring";
import { NavSearch } from "./nav-search";
import { CommandPalette } from "./command-palette";
import type { SessionUser } from "@/types/app";

type RailProfile = {
  completeness: number;
  followerCount: number;
  headline: string | null;
} | null;

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match: string[];
  badge?: number;
};

/**
 * Persistent vertical nav rail (Instagram/X style). Replaces the old top bar
 * (app-nav) + left-rail link list. Labeled at lg+, collapses to icons below.
 * Holds identity (top), search, primary + secondary destinations, and the
 * anchored Post CTA. There is no top bar — this is the app's primary chrome.
 */
export function NavRail({
  user,
  profile,
  unread,
  messageUnread,
}: {
  user: SessionUser;
  profile: RailProfile;
  unread: number;
  messageUnread: number;
}) {
  const pathname = usePathname();
  const isActive = (m: string[]) =>
    m.some((p) => pathname === p || pathname.startsWith(p + "/"));

  // Missions is now its own destination, so Discover no longer swallows it —
  // it keeps browse/explore/circles/topic/search.
  const primary: NavItem[] = [
    { href: "/feed", label: "Home", icon: Home, match: ["/feed"] },
    { href: "/connect", label: "Community", icon: Users, match: ["/connect"] },
    {
      href: "/discover",
      label: "Discover",
      icon: Compass,
      match: ["/discover", "/explore", "/circles", "/topic", "/search"],
    },
    { href: "/missions", label: "Missions", icon: Rocket, match: ["/missions"] },
    {
      href: "/messages",
      label: "Messages",
      icon: MessageCircle,
      match: ["/messages"],
      badge: messageUnread,
    },
    {
      href: "/notifications",
      label: "Notifications",
      icon: Bell,
      match: ["/notifications"],
      badge: unread,
    },
    {
      href: `/${user.username}`,
      label: "Profile",
      icon: null as unknown as LucideIcon, // rendered as avatar below
      match: [`/${user.username}`],
    },
    ...(user.isAdmin
      ? [{ href: "/admin", label: "Admin", icon: Shield, match: ["/admin"] }]
      : []),
  ];

  const secondary: NavItem[] = [
    { href: "/saved", label: "Saved", icon: Bookmark, match: ["/saved"] },
    { href: "/signatures", label: "Signatures", icon: Flame, match: ["/signatures"] },
    { href: "/settings", label: "Settings", icon: Settings, match: ["/settings"] },
  ];

  return (
    <nav className="sticky top-0 z-30 flex h-screen w-[68px] shrink-0 flex-col gap-1 overflow-y-auto border-r-1.5 border-line bg-canvas px-2 py-4 lg:w-[280px] lg:px-3">
      {/* Logo — wordmark at lg, mark-only when collapsed */}
      <Link
        href="/feed"
        aria-label="Versona home"
        className="mb-1 flex items-center justify-center px-1 py-1 lg:justify-start"
      >
        <Logo showWordmark={false} className="lg:hidden" />
        <Logo className="hidden lg:inline-flex" />
      </Link>

      {/* Identity card (rail top) */}
      <Link
        href={`/${user.username}`}
        className="mb-1 flex items-center gap-2.5 rounded-lg border-1.5 border-transparent px-1.5 py-1.5 transition-colors hover:border-line hover:bg-bg-muted lg:px-2"
      >
        {profile && profile.completeness < 100 ? (
          <span className="relative inline-flex shrink-0 items-center justify-center">
            <CompletenessRing value={profile.completeness} size={40} />
            <span className="absolute inset-0 grid place-items-center">
              <Avatar name={user.displayName} src={user.avatarUrl} size={28} />
            </span>
          </span>
        ) : (
          <Avatar name={user.displayName} src={user.avatarUrl} size={36} />
        )}
        <span className="hidden min-w-0 flex-col leading-tight lg:flex">
          <span className="truncate font-display text-[14px] font-bold text-ink-1">
            {user.displayName}
          </span>
          <span className="truncate text-[12px] text-ink-3">@{user.username}</span>
        </span>
      </Link>

      {/* Search — typeahead at lg, icon link when collapsed */}
      <div className="mb-1 hidden lg:block">
        <NavSearch />
      </div>
      <Link
        href="/search"
        aria-label="Search"
        title="Search"
        className="mb-1 flex items-center justify-center rounded-lg px-2.5 py-2.5 text-ink-2 transition-colors hover:bg-bg-muted hover:text-ink-1 lg:hidden"
      >
        <Search className="h-[22px] w-[22px]" strokeWidth={2} />
      </Link>

      {/* Primary destinations */}
      <ul className="flex flex-col gap-0.5">
        {primary.map((item) => (
          <li key={item.href}>
            <RailLink item={item} active={isActive(item.match)} user={user} />
          </li>
        ))}
      </ul>

      {/* Secondary destinations */}
      <div className="my-1.5 border-t border-line" />
      <ul className="flex flex-col gap-0.5">
        {secondary.map((item) => (
          <li key={item.href}>
            <RailLink item={item} active={isActive(item.match)} user={user} />
          </li>
        ))}
      </ul>

      {/* Anchored Post CTA */}
      <Link
        href="/feed"
        className="mb-12 mt-auto flex items-center justify-center gap-2 rounded-full bg-accent px-3 py-2.5 font-semibold text-white transition-colors hover:bg-accent-hover"
        title="Post or ask"
      >
        <SquarePen className="h-[18px] w-[18px]" strokeWidth={2.25} />
        <span className="hidden text-[14px] lg:inline">Post</span>
      </Link>

      <CommandPalette username={user.username} />
    </nav>
  );
}

function RailLink({
  item,
  active,
  user,
}: {
  item: NavItem;
  active: boolean;
  user: SessionUser;
}) {
  const isProfile = item.label === "Profile";
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      title={item.label}
      className={cn(
        "group relative flex items-center gap-3.5 rounded-lg px-2.5 py-2.5 text-[14px] transition-colors lg:px-3",
        "justify-center lg:justify-start",
        active
          ? "font-bold text-ink-1"
          : "font-medium text-ink-2 hover:bg-bg-muted hover:text-ink-1",
      )}
    >
      <span className="relative flex h-[22px] w-[22px] shrink-0 items-center justify-center">
        {isProfile ? (
          <Avatar name={user.displayName} src={user.avatarUrl} size={22} />
        ) : (
          <item.icon
            className="h-[22px] w-[22px]"
            strokeWidth={active ? 2.5 : 2}
          />
        )}
        {item.badge && item.badge > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-energy px-1 text-[10px] font-bold text-white">
            {item.badge > 9 ? "9+" : item.badge}
          </span>
        ) : null}
      </span>
      <span className="hidden truncate lg:inline">{item.label}</span>
      {active && (
        <span className="absolute left-0 top-1/2 hidden h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent lg:block" />
      )}
    </Link>
  );
}
