import * as React from "react";
import { cn } from "@/lib/utils";

type TagVariant = "value" | "skill" | "workstyle" | "topic" | "neutral";

const tones: Record<TagVariant, string> = {
  value: "bg-accent-light text-accent",
  skill: "bg-bg-muted text-ink-2",
  workstyle: "bg-bg-muted text-ink-3",
  topic: "bg-transparent text-accent border-1.5 border-line",
  neutral: "bg-bg-muted text-ink-1",
};

export function Tag({
  variant = "neutral",
  className,
  ...props
}: { variant?: TagVariant } & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2.5 py-0.5 text-[12px] font-medium leading-relaxed tracking-normal",
        tones[variant],
        className,
      )}
      {...props}
    />
  );
}
