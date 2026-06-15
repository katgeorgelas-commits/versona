import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getFollowList } from "@/features/profile/data";
import { PersonRow } from "@/features/connections/person-row";
import { PageHeader } from "@/components/layout/page-parts";

export default async function FollowersPage({ params }: { params: { username: string } }) {
  const user = await getSessionUser();
  if (!user) redirect("/");
  const data = await getFollowList(params.username, "followers", user.id);
  if (!data) notFound();

  return (
    <div className="mx-auto max-w-feed">
      <PageHeader title="Followers" subtitle={`${data.people.length} ${data.people.length === 1 ? "person" : "people"}`} />
      <div className="space-y-2">
        {data.people.map((p) => <PersonRow key={p.id} person={p} />)}
        {data.people.length === 0 && <p className="text-[13px] text-ink-3">No followers yet.</p>}
      </div>
    </div>
  );
}
