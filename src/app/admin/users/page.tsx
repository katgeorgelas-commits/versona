import Link from "next/link";
import { listUsers } from "@/features/admin/data";

export default async function AdminUsersPage() {
  const users = await listUsers();
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Users</h1>
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Username</th>
              <th className="p-3">Posts</th>
              <th className="p-3">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="p-3 font-medium">{u.displayName}</td>
                <td className="p-3">
                  <Link href={`/${u.username}`} className="text-accent hover:underline">
                    @{u.username}
                  </Link>
                </td>
                <td className="p-3">{u.postCount}</td>
                <td className="p-3">
                  {u.isAdmin ? (
                    <span className="rounded-sm bg-accent-light px-2 py-0.5 text-[12px] font-medium text-accent">Admin</span>
                  ) : (
                    <span className="text-ink-3">Member</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
