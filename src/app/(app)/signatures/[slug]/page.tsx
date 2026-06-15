import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, Sparkles, CheckCircle2, Flame, Users } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { MainShell } from "@/components/layout/main-shell";
import { Card, CardContent } from "@/components/ui/card";
import { SectionLabel } from "@/components/layout/page-parts";
import {
  SIGNATURES,
  FOCUS_LABEL,
  MODE_LABEL,
  type SignatureSlug,
} from "@/config/signatures";
import { isOfflineDemo } from "@/lib/dev/offline";
import { store } from "@/lib/dev/offline-store";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const sig = SIGNATURES[params.slug as SignatureSlug];
  return { title: sig ? `${sig.name} — Versona Signatures` : "Signature — Versona" };
}

export default async function SignatureDetailPage({ params }: { params: { slug: string } }) {
  const user = await getSessionUser();
  if (!user) redirect("/");

  const sig = SIGNATURES[params.slug as SignatureSlug];
  if (!sig) notFound();

  const sharedCount = isOfflineDemo()
    ? store.profiles.filter((p) => p.signature?.slug === sig.slug).length
    : 0;

  return (
    <MainShell user={user} right={false}>
      <div className="mx-auto max-w-content pb-12">
        <Link
          href="/signatures"
          className="mb-4 inline-flex items-center gap-1 text-[12px] font-medium text-ink-3 transition-colors hover:text-ink-1"
        >
          <ArrowLeft className="h-3 w-3" /> All Signatures
        </Link>

        {/* Hero */}
        <div className="mb-8 rounded-xl border-1.5 border-line bg-brand-wash p-8">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-accent">
            <Sparkles className="h-3 w-3" /> Versona Signature
          </div>
          <h1 className="mt-2 font-display text-4xl font-bold leading-[1.05] tracking-[-0.025em] text-ink-1">
            {sig.name}
          </h1>
          <p className="mt-2 font-display text-[17px] italic text-ink-2">{sig.oneliner}</p>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-1">{sig.description}</p>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1.5 rounded-full border-1.5 border-line bg-bg px-3 py-1 font-semibold text-ink-2">
              Focus · <span className="text-ink-1">{FOCUS_LABEL[sig.archetype.focus]}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border-1.5 border-line bg-bg px-3 py-1 font-semibold text-ink-2">
              Mode · <span className="text-ink-1">{MODE_LABEL[sig.archetype.mode]}</span>
            </span>
            {sharedCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-light px-3 py-1 font-semibold text-accent">
                <Users className="h-3 w-3" /> {sharedCount} {sharedCount === 1 ? "person shares" : "people share"} this
              </span>
            )}
          </div>
        </div>

        {/* Three columns: brings / energizes / workingWith */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <PanelCard label="What they bring" icon={<CheckCircle2 className="h-3.5 w-3.5" />} items={sig.brings} />
          <PanelCard label="What energizes them" icon={<Flame className="h-3.5 w-3.5" />} items={sig.energizes} />
          <PanelCard label="Working with them" icon={<Users className="h-3.5 w-3.5" />} items={sig.workingWith} />
        </div>

        {/* Pairs with */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <SectionLabel>Pairs well with</SectionLabel>
            <p className="mb-4 text-[13px] text-ink-2">
              Strong teams aren&apos;t built of identical Signatures. These complement {sig.name} naturally.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {sig.pairsWith.map((slug) => {
                const p = SIGNATURES[slug];
                return (
                  <Link
                    key={slug}
                    href={`/signatures/${slug}`}
                    className="group rounded-lg border-1.5 border-line bg-bg p-4 transition-colors hover:border-accent/60"
                  >
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-3">
                      {FOCUS_LABEL[p.archetype.focus]} · {MODE_LABEL[p.archetype.mode]}
                    </div>
                    <div className="mt-1 font-display text-[16px] font-bold leading-tight text-ink-1 group-hover:text-accent">
                      {p.name}
                    </div>
                    <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-ink-2">{p.oneliner}</p>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardContent className="space-y-4 p-6">
            <SectionLabel>About Signatures</SectionLabel>
            <FaqRow q={`How is a Signature like ${sig.name} different from a personality type?`}>
              Signatures describe how someone works — orientation toward Craft, People, or Systems, and a mode of moving (Initiating, Sustaining, Evolving).
              They&apos;re a workplace lens, not an identity claim. You can change Signatures as your work evolves.
            </FaqRow>
            <FaqRow q={`Can I see who else has the ${sig.name} Signature?`}>
              Yes. Each Signature has its own circle on Versona — a space for shared-ground conversation among people who work the same way.
            </FaqRow>
            <FaqRow q="What if I think my Signature is wrong?">
              Signatures are a starting point, not a verdict. You can re-take onboarding any time, and your Signature updates as you post,
              join missions, and respond to weekly prompts.
            </FaqRow>
            <FaqRow q="Why only nine?">
              Because thousands would be useless. Nine is enough to feel distinct and few enough that hiring teams can actually use them
              to deliberately balance their team mix.
            </FaqRow>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-center">
          <Link
            href="/signatures"
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-accent hover:text-accent-hover"
          >
            See all nine Signatures <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </MainShell>
  );
}

function PanelCard({ label, icon, items }: { label: string; icon: React.ReactNode; items: string[] }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-accent">
          {icon} {label}
        </div>
        <ul className="space-y-2 text-[13px] leading-snug text-ink-1">
          {items.map((it, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-2 inline-block h-1 w-1 shrink-0 rounded-full bg-accent" />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function FaqRow({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-md border-1.5 border-line p-3.5 transition-colors open:border-accent/40">
      <summary className="flex cursor-pointer items-center justify-between gap-3 text-[13.5px] font-semibold text-ink-1">
        {q}
        <span className="text-[12px] text-ink-3 transition-transform group-open:rotate-45">+</span>
      </summary>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{children}</p>
    </details>
  );
}
