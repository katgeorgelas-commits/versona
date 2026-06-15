import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles, ArrowRight } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { MainShell } from "@/components/layout/main-shell";
import { PageHeader, SectionLabel } from "@/components/layout/page-parts";
import { Card, CardContent } from "@/components/ui/card";
import { SIGNATURE_LIST, FOCUS_LABEL, MODE_LABEL, FOCUS_DESC, MODE_DESC, type SignatureFocus, type SignatureMode } from "@/config/signatures";

export const metadata = { title: "Signatures — Versona" };

const FOCUSES: SignatureFocus[] = ["systems", "craft", "people"];
const MODES: SignatureMode[] = ["initiating", "sustaining", "evolving"];

export default async function SignaturesIndexPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");

  // Build a 3×3 grid lookup so we can lay out by focus row × mode column.
  const grid = new Map<string, typeof SIGNATURE_LIST[number]>();
  for (const s of SIGNATURE_LIST) {
    grid.set(`${s.archetype.focus}:${s.archetype.mode}`, s);
  }

  return (
    <MainShell user={user} right={false}>
      <div className="mx-auto max-w-content pb-12">
        {/* Hero */}
        <div className="mb-10 rounded-xl border-1.5 border-line bg-brand-wash p-8">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
            <Sparkles className="h-3.5 w-3.5" /> The Signature Library
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold leading-[1.05] tracking-[-0.025em] text-ink-1 md:text-4xl">
            Nine ways to show up at work.
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-2">
            Versona Signatures are an AI-derived read of how someone actually works — strengths-first, voice-driven, and finite by design.
            There are nine, mapped on a focus × mode grid. The point is to help you find people who share yours, and teams that complement each other.
          </p>
        </div>

        <PageHeader title="The nine Signatures" subtitle="Each row shares a focus. Each column shares a mode of moving." />

        {/* 3×3 grid */}
        <div className="mb-12 overflow-x-auto">
          <div className="min-w-[720px]">
            {/* Column headers */}
            <div className="grid grid-cols-[120px_repeat(3,minmax(0,1fr))] gap-3 pb-3">
              <div />
              {MODES.map((m) => (
                <div key={m} className="px-1">
                  <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-3">{MODE_LABEL[m]}</div>
                  <div className="mt-0.5 text-[11px] leading-snug text-ink-3">{MODE_DESC[m]}</div>
                </div>
              ))}
            </div>

            {/* Rows */}
            {FOCUSES.map((f) => (
              <div key={f} className="mb-3 grid grid-cols-[120px_repeat(3,minmax(0,1fr))] gap-3">
                <div className="flex flex-col justify-center px-1">
                  <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-3">{FOCUS_LABEL[f]}</div>
                  <div className="mt-0.5 text-[11px] leading-snug text-ink-3">{FOCUS_DESC[f]}</div>
                </div>
                {MODES.map((m) => {
                  const s = grid.get(`${f}:${m}`);
                  if (!s) return <div key={m} />;
                  return (
                    <Link
                      key={s.slug}
                      href={`/signatures/${s.slug}`}
                      className="group flex flex-col rounded-lg border-1.5 border-line bg-bg p-4 transition-colors hover:border-accent/60"
                    >
                      <div className="font-display text-[16px] font-bold leading-tight text-ink-1 group-hover:text-accent">
                        {s.name}
                      </div>
                      <p className="mt-1.5 line-clamp-3 text-[12.5px] leading-snug text-ink-2">{s.oneliner}</p>
                      <span className="mt-auto pt-2 text-[11px] font-semibold text-accent opacity-0 transition-opacity group-hover:opacity-100">
                        Read &rarr;
                      </span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* How they work */}
        <Card className="mb-6">
          <CardContent className="space-y-3 p-6">
            <SectionLabel>How Signatures are derived</SectionLabel>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <div className="text-[13px] font-semibold text-ink-1">1. Onboarding signals</div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">
                  We start with your values, work style, skills, and a short conversation. No quizzes you can game — the questions are open.
                </p>
              </div>
              <div>
                <div className="text-[13px] font-semibold text-ink-1">2. Pattern matching</div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">
                  An AI maps your answers onto the focus × mode grid and picks the Signature that fits best — plus a strengths read across six dimensions.
                </p>
              </div>
              <div>
                <div className="text-[13px] font-semibold text-ink-1">3. Living, not fixed</div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">
                  Your Signature updates as you grow. Posts, missions joined, and prompt responses feed back into the read.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* For hiring */}
        <Card className="mb-6">
          <CardContent className="space-y-3 p-6">
            <SectionLabel>For teams &amp; hiring</SectionLabel>
            <p className="text-[13.5px] leading-relaxed text-ink-2">
              The reason there are only nine is so teams can actually use them. When you&apos;re hiring, look at your existing Signature mix and ask
              what&apos;s missing — most teams skew heavily Initiating, then can&apos;t Sustain. Each Signature has a &ldquo;Pairs well with&rdquo; list to
              make complementary hiring deliberate.
            </p>
            <ul className="space-y-1.5 text-[13px] text-ink-2">
              <li>• <b className="text-ink-1">Strengths-first</b> — we never show a weakness score. Low dimensions are framed as quieter strengths, never deficits.</li>
              <li>• <b className="text-ink-1">No personality theater</b> — Signatures describe how someone works, not who they are inside. They&apos;re a workplace lens, not an identity claim.</li>
              <li>• <b className="text-ink-1">Discussable</b> — Signatures are meant to be shared and challenged. They&apos;re a starting point for a conversation, not a verdict.</li>
            </ul>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <div className="text-[14px] font-semibold text-ink-1">Find people who share your Signature.</div>
              <p className="text-[12.5px] text-ink-3">Each Signature has its own circle for honest, shared-ground conversation.</p>
            </div>
            <Link
              href={`/${user.username}`}
              className="inline-flex items-center gap-1 rounded-full bg-accent px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              View your Signature <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </MainShell>
  );
}
