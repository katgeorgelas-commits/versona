import { RightRail } from "@/features/shell/right-rail";
import type { SessionUser } from "@/types/app";

/**
 * Content shell for the main pages. Primary navigation now lives in the global
 * NavRail (see layout), so this is just the center column + optional right rail.
 *   mobile / md → center only
 *   lg          → center + right rail
 * Center is min-w-0 so it never overflows; the right rail is sticky.
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
          ? "grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_310px]"
          : "grid grid-cols-1"
      }
    >
      <div className="min-w-0">{children}</div>
      {right && (
        <aside className="hidden lg:block">
          <RightRail user={user} />
        </aside>
      )}
    </div>
  );
}
