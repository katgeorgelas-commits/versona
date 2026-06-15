"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

/**
 * Dev-only user switcher. Lets us "log in" as any seeded user while real auth
 * is deferred (the PRD's last layer). Renders nothing in production builds.
 * Writes the `versona_mock_user` cookie that lib/auth/session.ts reads.
 */
export function MockUserSwitcher({
  current,
  users,
}: {
  current: string;
  users: { username: string; displayName: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  function switchTo(username: string) {
    document.cookie = `versona_mock_user=${username}; path=/; max-age=31536000`;
    setOpen(false);
    startTransition(() => router.refresh());
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 text-xs">
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-full border-1.5 border-accent bg-accent-light px-3 py-1.5 font-medium text-accent"
      >
        🧪 dev: @{current}
      </button>
      {open && (
        <div className="mt-2 w-52 overflow-hidden rounded-lg border-1.5 border-line bg-bg">
          {users.map((u) => (
            <button
              key={u.username}
              onClick={() => switchTo(u.username)}
              className="block w-full px-3 py-2 text-left hover:bg-muted"
            >
              <span className="font-medium">{u.displayName}</span>{" "}
              <span className="text-muted-foreground">@{u.username}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
