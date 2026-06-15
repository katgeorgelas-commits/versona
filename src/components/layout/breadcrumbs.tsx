import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type Crumb = { label: string; href?: string };

/** Breadcrumb trail. Always starts at Home; the last crumb is the current page. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ label: "Home", href: "/feed" }, ...items];
  return (
    <nav aria-label="Breadcrumb" className="mb-2">
      <ol className="flex flex-wrap items-center gap-0.5 text-[11px] text-ink-3/60">
        {all.map((c, i) => {
          const last = i === all.length - 1;
          return (
            <li key={i} className="flex items-center gap-0.5">
              {c.href && !last ? (
                <Link href={c.href} className="transition-colors hover:text-ink-2">
                  {c.label}
                </Link>
              ) : (
                <span className={last ? "text-ink-3" : ""}>{c.label}</span>
              )}
              {!last && <ChevronRight className="h-2.5 w-2.5 shrink-0" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
