"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "all", label: "All" },
  { key: "people", label: "People" },
  { key: "spaces", label: "Spaces" },
  { key: "posts", label: "Posts" },
  { key: "topics", label: "Topics" },
] as const;

export type FilterTab = (typeof TABS)[number]["key"];

export function SearchFilters({
  activeTab,
  counts,
}: {
  activeTab: FilterTab;
  counts: Record<FilterTab, number>;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [showAdvanced, setShowAdvanced] = useState(false);

  function setTab(tab: FilterTab) {
    const params = new URLSearchParams(sp.toString());
    if (tab === "all") params.delete("filter");
    else params.set("filter", tab);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-center gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
              activeTab === t.key
                ? "bg-accent text-white"
                : "bg-bg-muted text-ink-2 hover:text-ink-1",
            )}
          >
            {t.label}
            {counts[t.key] > 0 && (
              <span className={cn("ml-1.5 text-[11px]", activeTab === t.key ? "text-white/70" : "text-ink-3")}>
                {counts[t.key]}
              </span>
            )}
          </button>
        ))}

        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className="ml-auto inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] font-medium text-ink-3 transition-colors hover:text-ink-1"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Advanced
          <ChevronDown className={cn("h-3 w-3 transition-transform", showAdvanced && "rotate-180")} />
        </button>
      </div>

      {showAdvanced && <AdvancedFilters />}
    </div>
  );
}

function AdvancedFilters() {
  const router = useRouter();
  const sp = useSearchParams();

  const sort = sp.get("sort") ?? "relevance";
  const time = sp.get("time") ?? "any";

  function update(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value === "relevance" || value === "any") params.delete(key);
    else params.set(key, value);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3 rounded-lg border-1.5 border-line bg-bg-muted/50 p-3">
      <label className="flex items-center gap-2 text-[13px] text-ink-2">
        Sort by
        <select
          value={sort}
          onChange={(e) => update("sort", e.target.value)}
          className="rounded-md border-1.5 border-line bg-bg px-2 py-1 text-[13px] text-ink-1 focus:border-accent focus:outline-none"
        >
          <option value="relevance">Relevance</option>
          <option value="recent">Most recent</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-[13px] text-ink-2">
        Time
        <select
          value={time}
          onChange={(e) => update("time", e.target.value)}
          className="rounded-md border-1.5 border-line bg-bg px-2 py-1 text-[13px] text-ink-1 focus:border-accent focus:outline-none"
        >
          <option value="any">Any time</option>
          <option value="day">Past 24 hours</option>
          <option value="week">Past week</option>
          <option value="month">Past month</option>
        </select>
      </label>
    </div>
  );
}
