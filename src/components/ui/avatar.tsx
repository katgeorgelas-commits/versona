import { cn, initials } from "@/lib/utils";

/**
 * Avatar with single-accent identity tint and an optional presence dot.
 * `online` shows a live (green, pulsing) dot — "active now" presence.
 */
export function Avatar({
  name,
  src,
  size = 40,
  online = false,
  className,
}: {
  name: string;
  src?: string | null;
  size?: number;
  online?: boolean;
  className?: string;
}) {
  const dot = Math.max(9, Math.round(size * 0.28));
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <span
        className={cn(
          "inline-flex h-full w-full select-none items-center justify-center overflow-hidden rounded-full font-semibold",
          !src && "bg-accent-light text-accent",
          className,
        )}
        style={{ fontSize: size * 0.38 }}
        title={name}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={name} className="h-full w-full object-cover" />
        ) : (
          initials(name)
        )}
      </span>
      {online && (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2 border-bg bg-live"
          style={{ width: dot, height: dot }}
          aria-label="Active now"
        >
          <span className="absolute inset-0.5 animate-live rounded-full bg-live" />
        </span>
      )}
    </span>
  );
}
