import { cn } from "@/lib/utils";

/** Page title + optional subtitle (spec §6 Page Titles). */
export function PageHeader({
  title,
  subtitle,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("mb-9 flex items-start justify-between gap-4", className)}>
      <div>
        <h1 className="font-display text-2xl font-bold leading-[1.1] tracking-[-0.025em] text-ink-1">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-sm leading-[1.55] text-ink-2">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

/** Uppercase eyebrow label. */
export function SectionLabel({
  children,
  count,
  className,
}: {
  children: React.ReactNode;
  count?: string | number;
  className?: string;
}) {
  return (
    <div className={cn("mb-3.5 flex items-baseline gap-2.5", className)}>
      <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-3">
        {children}
      </span>
      {count !== undefined && (
        <span className="text-[11px] font-medium text-ink-3">{count}</span>
      )}
    </div>
  );
}
