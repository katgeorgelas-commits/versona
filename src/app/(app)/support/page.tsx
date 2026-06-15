import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/page-parts";
import { SupportForm } from "@/features/support/support-form";
import { MainShell } from "@/components/layout/main-shell";

export default async function SupportPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");

  return (
    <MainShell user={user} right={false}>
      <div className="mx-auto max-w-feed">
        <PageHeader
          title="Support & Feedback"
          subtitle="Have an idea, found a bug, or want to request a feature? Let us know — we read every submission."
        />
        <SupportForm />
      </div>
    </MainShell>
  );
}
