"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Select } from "@/components/ui/select";
import { FeedList } from "./feed-list";
import type { PostView } from "@/types/views";

const uniq = (arr: (string | null)[]) => [...new Set(arr.filter((x): x is string => !!x))];

/** Mission feed with location/industry filters (drawn from member profiles). */
export function MissionFeed({ posts }: { posts: PostView[] }) {
  const [loc, setLoc] = useState("");
  const [ind, setInd] = useState("");

  const locations = useMemo(() => uniq(posts.map((p) => p.authorLocation)), [posts]);
  const industries = useMemo(() => uniq(posts.map((p) => p.authorIndustry)), [posts]);

  const filtered = posts.filter(
    (p) => (!loc || p.authorLocation === loc) && (!ind || p.authorIndustry === ind),
  );

  const hasFilters = locations.length > 0 || industries.length > 0;

  return (
    <div className="space-y-3">
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border-1.5 border-line bg-bg p-2.5">
          <span className="flex items-center gap-1.5 pl-1 text-[12px] font-semibold text-ink-3">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filter
          </span>
          {industries.length > 0 && (
            <Select
              className="w-44"
              value={ind}
              onChange={setInd}
              options={[{ value: "", label: "All industries" }, ...industries.map((x) => ({ value: x, label: x }))]}
            />
          )}
          {locations.length > 0 && (
            <Select
              className="w-44"
              value={loc}
              onChange={setLoc}
              options={[{ value: "", label: "All locations" }, ...locations.map((x) => ({ value: x, label: x }))]}
            />
          )}
          {(loc || ind) && (
            <button onClick={() => { setLoc(""); setInd(""); }} className="text-[12px] font-semibold text-accent hover:text-accent-hover">
              Clear
            </button>
          )}
        </div>
      )}
      <FeedList posts={filtered} empty="No posts match these filters yet." />
    </div>
  );
}
