"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Hash, Search, User, Compass } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { searchSuggestions, type SuggestionItem } from "@/features/search/actions";
import { spacePath } from "@/lib/utils";

export function NavSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<SuggestionItem[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [, startTransition] = useTransition();
  const wrapRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  function fetchSuggestions(value: string) {
    clearTimeout(timerRef.current);
    if (!value.trim()) {
      setItems([]);
      setOpen(false);
      return;
    }
    timerRef.current = setTimeout(() => {
      startTransition(async () => {
        const res = await searchSuggestions(value);
        setItems(res);
        setOpen(res.length > 0);
        setActive(-1);
      });
    }, 150);
  }

  function navigate(item: SuggestionItem) {
    setOpen(false);
    setQ("");
    if (item.kind === "person") router.push(`/${item.username}`);
    else if (item.kind === "space") router.push(spacePath(item.spaceKind, item.slug));
    else router.push(`/topic/${encodeURIComponent(item.tag)}`);
  }

  function submit() {
    if (active >= 0 && active < items.length) {
      navigate(items[active]);
    } else if (q.trim()) {
      setOpen(false);
      setQ("");
      router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    }
  }

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const totalItems = items.length + (q.trim() ? 1 : 0);

  return (
    <div ref={wrapRef} className="relative hidden flex-1 sm:block sm:max-w-[280px]">
      <form
        onSubmit={(e) => { e.preventDefault(); submit(); }}
        role="search"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); fetchSuggestions(e.target.value); }}
          onFocus={() => { if (items.length) setOpen(true); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((p) => Math.min(p + 1, totalItems - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setActive((p) => Math.max(p - 1, -1)); }
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Search people, missions, posts…"
          className="h-9 w-full rounded-full border-1.5 border-line bg-bg-muted pl-9 pr-3 text-[13px] text-ink-1 transition-colors placeholder:text-ink-3 focus:border-accent focus:bg-bg focus:outline-none"
          autoComplete="off"
        />
      </form>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[300px] overflow-hidden rounded-lg border-1.5 border-line bg-bg shadow-sm">
          <div className="max-h-[360px] overflow-y-auto py-1">
            {items.map((item, i) => (
              <button
                key={itemKey(item)}
                onMouseEnter={() => setActive(i)}
                onClick={() => navigate(item)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left text-[13px] transition-colors ${
                  i === active ? "bg-bg-muted" : ""
                }`}
              >
                <SuggestionIcon item={item} />
                <SuggestionLabel item={item} />
              </button>
            ))}

            {q.trim() && (
              <button
                onMouseEnter={() => setActive(items.length)}
                onClick={() => { setOpen(false); setQ(""); router.push(`/search?q=${encodeURIComponent(q.trim())}`); }}
                className={`flex w-full items-center gap-3 border-t-1.5 border-line px-3 py-2 text-left text-[13px] transition-colors ${
                  active === items.length ? "bg-bg-muted" : ""
                }`}
              >
                <Search className="h-4 w-4 text-ink-3" />
                <span className="text-ink-2">Search for &ldquo;<span className="font-medium text-ink-1">{q.trim()}</span>&rdquo;</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function itemKey(item: SuggestionItem) {
  if (item.kind === "person") return `p:${item.username}`;
  if (item.kind === "space") return `s:${item.slug}`;
  return `t:${item.tag}`;
}

function SuggestionIcon({ item }: { item: SuggestionItem }) {
  if (item.kind === "person") return <Avatar name={item.displayName} src={item.avatarUrl} size={24} />;
  if (item.kind === "space") return <Compass className="h-4 w-4 text-ink-3" />;
  return <Hash className="h-4 w-4 text-ink-3" />;
}

function SuggestionLabel({ item }: { item: SuggestionItem }) {
  if (item.kind === "person") {
    return (
      <span className="flex flex-col leading-tight">
        <span className="font-medium text-ink-1">{item.displayName}</span>
        <span className="text-[11px] text-ink-3">@{item.username}</span>
      </span>
    );
  }
  if (item.kind === "space") {
    return (
      <span className="flex flex-col leading-tight">
        <span className="font-medium text-ink-1">{item.name}</span>
        <span className="text-[11px] text-ink-3">{item.spaceKind}</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-2">
      <span className="font-medium text-ink-1">#{item.tag}</span>
      <span className="text-[11px] text-ink-3">{item.count} posts</span>
    </span>
  );
}
