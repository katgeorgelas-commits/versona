import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { getSessionUser } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/server";
import { isOfflineDemo, OFFLINE_MISSIONS } from "@/lib/dev/offline";
import { OnboardingChat } from "@/features/onboarding/onboarding-chat";

/**
 * Conversational AI onboarding (PRD §3.1). Distraction-free layout (no app nav).
 * Claude asks questions, extracts structured profile data, and the user reviews
 * a draft profile before entering the community.
 */
export default async function OnboardingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");

  let missions = OFFLINE_MISSIONS as {
    slug: string;
    name: string;
    brief: string;
    accent_color: string;
  }[];
  if (!isOfflineDemo()) {
    const db = createServiceClient();
    const { data } = await db
      .from("missions")
      .select("slug, name, brief, accent_color")
      .eq("is_active", true)
      .order("display_order");
    missions = data ?? [];
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="mx-auto flex max-w-content items-center justify-between border-b-1.5 border-line px-6 py-4 md:px-10">
        <Logo />
        <span className="text-[12px] text-ink-3">
          You can leave and pick up where you left off.
        </span>
      </header>
      <OnboardingChat username={user.username} missions={missions} />
    </div>
  );
}
