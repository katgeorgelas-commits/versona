"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { setWeeklyPrompt } from "./actions";
import type { AdminMissionRow } from "./data";

export function MissionPromptEditor({ mission }: { mission: AdminMissionRow }) {
  const [prompt, setPrompt] = useState(mission.weeklyPrompt ?? "");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="rounded-lg border-1.5 border-line p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">{mission.name}</div>
          <div className="text-xs text-muted-foreground">{mission.memberCount} members</div>
        </div>
      </div>
      <label className="mt-3 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Weekly prompt
      </label>
      <Textarea
        value={prompt}
        onChange={(e) => {
          setPrompt(e.target.value);
          setSaved(false);
        }}
        rows={2}
        className="mt-1"
      />
      <div className="mt-2 flex items-center gap-2">
        <Button
          size="sm"
          onClick={() =>
            startTransition(async () => {
              const res = await setWeeklyPrompt(mission.slug, prompt);
              if (res.ok) setSaved(true);
            })
          }
          disabled={pending || !prompt.trim()}
        >
          Save prompt
        </Button>
        {saved && <span className="text-[12px] font-medium text-success">Saved</span>}
      </div>
    </div>
  );
}
