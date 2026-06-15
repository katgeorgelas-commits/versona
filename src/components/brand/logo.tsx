import { cn } from "@/lib/utils";

/**
 * Versona wordmark (spec §6 Navigation). Schibsted Grotesk, 18px/700,
 * accent-colored period. The single decorative-feeling use of accent allowed —
 * it's the brand mark.
 */
export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span
      className={cn(
        "font-display text-lg font-bold tracking-[-0.02em] text-ink-1",
        className,
      )}
    >
      {showWordmark ? "Versona" : "V"}
      <span className="text-accent">.</span>
    </span>
  );
}
