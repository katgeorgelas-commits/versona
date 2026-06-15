import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getThread } from "@/features/messaging/data";
import { Conversation } from "@/features/messaging/conversation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export default async function ThreadPage({
  params,
}: {
  params: { threadId: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect("/");

  const data = await getThread(params.threadId, user.id);
  if (!data) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Breadcrumbs items={[{ label: "Messages", href: "/messages" }, { label: data.thread.other.displayName }]} />
      <Conversation
        thread={data.thread}
        initialMessages={data.messages}
        viewerId={user.id}
      />
    </div>
  );
}
