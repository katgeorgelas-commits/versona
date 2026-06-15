"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { NavSearch } from "./nav-search";
import { NotificationBell } from "./notification-bell";
import { MessagesDropdown } from "./messages-dropdown";
import { CommandPalette } from "./command-palette";
import type { SessionUser } from "@/types/app";
import type { NotificationView, ThreadView } from "@/types/views";

export function AppNav({
  user,
  notifications,
  unread,
  threads,
}: {
  user: SessionUser;
  notifications: NotificationView[];
  unread: number;
  threads: ThreadView[];
}) {
  const pathname = usePathname();

  // Three primary destinations. `match` lists the route prefixes that should
  // light each item — browsing/joining + trending all live under Discover.
  const links = [
    { href: "/feed", label: "Home", match: ["/feed"] },
    { href: "/connect", label: "Community", match: ["/connect"] },
    {
      href: "/discover",
      label: "Discover",
      match: ["/discover", "/explore", "/missions", "/circles", "/topic", "/search"],
    },
    ...(user.isAdmin ? [{ href: "/admin", label: "Admin", match: ["/admin"] }] : []),
  ];

  const isActive = (m: string[]) =>
    m.some((p) => pathname === p || pathname.startsWith(p + "/"));

  return (
    <nav className="sticky top-0 z-30 border-b-1.5 border-ink-1 bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex max-w-app items-center gap-4 px-6 py-3 md:px-10">
        <Link href="/feed" aria-label="Versona home">
          <Logo />
        </Link>

        <NavSearch />

        <ul className="ml-auto flex flex-wrap items-center gap-5 md:gap-6">
          {links.map((item) => {
            const active = isActive(item.match);
            return (
              <li key={item.href} className="hidden sm:block">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "whitespace-nowrap text-[13px] tracking-[0.01em] transition-colors",
                    active ? "font-bold text-accent" : "font-medium text-ink-3 hover:text-ink-1",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}

          <li className="flex items-center gap-1.5">
            <MessagesDropdown threads={threads} />
            <NotificationBell items={notifications} unread={unread} />
            <Link href={`/${user.username}`} aria-label="My profile" className="ml-1">
              <Avatar name={user.displayName} src={user.avatarUrl} size={30} />
            </Link>
          </li>
        </ul>
      </div>
      <CommandPalette username={user.username} />
    </nav>
  );
}
