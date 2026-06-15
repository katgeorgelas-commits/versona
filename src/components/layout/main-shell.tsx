import { LeftRail } from "@/features/shell/left-rail";
import { RightRail } from "@/features/shell/right-rail";
import type { SessionUser } from "@/types/app";

/**
 * Three-column shell (LinkedIn-style) for the main pages.
 *   mobile  → center only
 *   md      → left rail + center
 *   lg      → left rail + center + right rail
 * Center is min-w-0 so it never overflows; rails are sticky (set in the rails).
 */
export function MainShell({
  user,
  children,
  right = true,
}: {
  user: SessionUser;
  children: React.ReactNode;
  right?: boolean;
}) {
  return (
    <div
      className={
        right
          ? "grid grid-cols-1 gap-6 md:grid-cols-[210px_minmax(0,1fr)] lg:grid-cols-[210px_minmax(0,1fr)_310px]"
          : "grid grid-cols-1 gap-6 md:grid-cols-[210px_minmax(0,1fr)]"
      }
    >
      <aside className="hidden md:block">
        <LeftRail user={user} />
      </aside>
      <div className="min-w-0">{children}</div>
      {right && (
        <aside className="hidden lg:block">
          <RightRail user={user} />
        </aside>
      )}
    </div>
  );
}
