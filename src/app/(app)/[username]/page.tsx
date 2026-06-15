import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth/session";
import { getProfileView, getUserContributions } from "@/features/profile/data";
import { ProfileScreen } from "@/features/profile/profile-screen";

/**
 * Public profile at versona.com/[username] (PRD §3.2). The living human profile.
 *
 * NOTE: static sibling routes (/feed, /missions, /messages, /notifications,
 * /saved, /onboarding, /admin) take precedence over this dynamic segment, so
 * those words are reserved at signup (enforced in the auth feature).
 */
export async function generateMetadata({
  params,
}: {
  params: { username: string };
}): Promise<Metadata> {
  return { title: `@${params.username}` };
}

export default async function ProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/");

  const profile = await getProfileView(params.username, viewer.id);
  if (!profile) notFound();

  const contributions = await getUserContributions(profile.id);

  return <ProfileScreen profile={profile} contributions={contributions} />;
}
