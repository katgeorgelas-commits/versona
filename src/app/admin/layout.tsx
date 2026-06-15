import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { Logo } from "@/components/brand/logo";

/**
 * Internal admin shell (PRD §6). Web-only, admins only. Separate chrome from the
 * member app — this is an operator tool, not a member surface.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/");
  if (!user.isAdmin) redirect("/feed");

  const tabs = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/posts", label: "Posts" },
    { href: "/admin/missions", label: "Missions" },
    { href: "/admin/requests", label: "Requests" },
  ];

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <Logo showWordmark={false} />
            <span className="font-display font-semibold">Admin</span>
          </div>
          <Link href="/feed" className="text-sm text-muted-foreground hover:underline">
            ← Back to app
          </Link>
        </div>
        <nav className="container flex gap-1 pb-2">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </header>
      <div className="container py-6">{children}</div>
    </div>
  );
}
