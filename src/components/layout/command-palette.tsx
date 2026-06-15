"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Home, Compass, Users, MessageCircle, Bell, User, Search, PenSquare, Moon, Bookmark, Sparkles, Settings, UserPlus,
} from "lucide-react";

type Cmd = { id: string; label: string; icon: typeof Home; run: () => void; keywords?: string };

export function CommandPalette({ username }: { username: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        setQ("");
        setI(0);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (href: string) => () => {
    setOpen(false);
    router.push(href);
  };

  const commands: Cmd[] = useMemo(
    () => [
      { id: "feed", label: "Home", icon: Home, run: go("/feed"), keywords: "feed" },
      { id: "connect", label: "Community — your missions & circles", icon: Compass, run: go("/connect"), keywords: "connect missions circles community journey phases joined" },
      { id: "discover", label: "Discover — people, spaces & trending", icon: Sparkles, run: go("/discover"), keywords: "explore suggestions trending find people" },
      { id: "missions", label: "Browse all missions", icon: Compass, run: go("/missions") },
      { id: "circles", label: "Browse all circles", icon: Users, run: go("/circles"), keywords: "communities industry topic interest" },
      { id: "connections", label: "Your connections & requests", icon: UserPlus, run: go("/connections"), keywords: "people network follow requests" },
      { id: "messages", label: "Messages", icon: MessageCircle, run: go("/messages") },
      { id: "notifs", label: "Notifications", icon: Bell, run: go("/notifications") },
      { id: "saved", label: "Saved posts", icon: Bookmark, run: go("/saved") },
      { id: "profile", label: "My profile", icon: User, run: go(`/${username}`) },
      { id: "settings", label: "Settings", icon: Settings, run: go("/settings") },
      { id: "new", label: "Write a post", icon: PenSquare, run: go("/feed"), keywords: "compose new post" },
      {
        id: "theme",
        label: "Toggle dark mode",
        icon: Moon,
        run: () => {
          const dark = !document.documentElement.classList.contains("dark");
          document.documentElement.classList.toggle("dark", dark);
          localStorage.setItem("versona-theme", dark ? "dark" : "light");
          setOpen(false);
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [username],
  );

  const filtered = commands.filter(
    (c) => !q || (c.label + " " + (c.keywords ?? "")).toLowerCase().includes(q.toLowerCase()),
  );
  const showSearch = q.trim().length > 0;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/40 p-4 pt-[12vh]" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-narrow overflow-hidden rounded-xl border-1.5 border-line bg-bg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b-1.5 border-line px-4">
          <Search className="h-4 w-4 text-ink-3" />
          <input
            autoFocus
            value={q}
            onChange={(e) => { setQ(e.target.value); setI(0); }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") setI((p) => Math.min(p + 1, filtered.length));
              if (e.key === "ArrowUp") setI((p) => Math.max(p - 1, 0));
              if (e.key === "Enter") {
                if (showSearch && i === filtered.length) {
                  setOpen(false);
                  router.push(`/search?q=${encodeURIComponent(q.trim())}`);
                } else filtered[i]?.run();
              }
            }}
            placeholder="Search or jump to…"
            className="h-12 flex-1 bg-transparent text-[15px] text-ink-1 placeholder:text-ink-3 focus:outline-none"
          />
          <kbd className="rounded border-1.5 border-line px-1.5 py-0.5 text-[10px] text-ink-3">esc</kbd>
        </div>
        <div className="max-h-[320px] overflow-y-auto p-1.5">
          {filtered.map((c, idx) => (
            <button
              key={c.id}
              onMouseEnter={() => setI(idx)}
              onClick={c.run}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-[14px] ${idx === i ? "bg-bg-muted text-ink-1" : "text-ink-2"}`}
            >
              <c.icon className="h-4 w-4 text-ink-3" /> {c.label}
            </button>
          ))}
          {showSearch && (
            <button
              onMouseEnter={() => setI(filtered.length)}
              onClick={() => { setOpen(false); router.push(`/search?q=${encodeURIComponent(q.trim())}`); }}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-[14px] ${i === filtered.length ? "bg-bg-muted text-ink-1" : "text-ink-2"}`}
            >
              <Search className="h-4 w-4 text-ink-3" /> Search for &ldquo;{q.trim()}&rdquo;
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
