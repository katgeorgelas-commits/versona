import Link from "next/link";
import { MessagesSquare, Compass, ShieldCheck, ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

/**
 * Public landing (marketing). Same design system as the app: white surfaces,
 * single accent, bordered cards, no shadows, Schibsted headings.
 */
export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <header className="border-b-1.5 border-ink-1">
        <div className="mx-auto flex max-w-content items-center justify-between px-6 py-5 md:px-10">
          <Logo />
          <div className="flex items-center gap-2">
            <Link href="/feed">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/onboarding">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-content items-center gap-10 px-6 py-16 md:grid-cols-2 md:px-10 md:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border-1.5 border-line px-3 py-1 text-[12px] font-medium text-ink-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            A professional community, built around people
          </span>
          <h1 className="mt-5 font-display text-3xl font-bold leading-[1.05] tracking-[-0.03em] text-ink-1 md:text-[52px]">
            Be <span className="text-gradient-brand">understood</span>,
            <br />not just employable.
          </h1>
          <p className="mt-5 max-w-md text-base leading-[1.6] text-ink-2">
            Versona is where professionals build a real identity, find their
            people, and grow through honest conversation — long before any job is
            on the table.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/onboarding">
              <Button size="lg" className="w-full sm:w-auto">
                Build your profile <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/missions">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Explore missions
              </Button>
            </Link>
          </div>
          <p className="mt-3 text-[13px] text-ink-3">
            10–15 minutes, through conversation — not a form.
          </p>
        </div>

        {/* The core loop */}
        <div className="rounded-lg border-1.5 border-line p-6">
          <div className="eyebrow">The loop</div>
          <div className="mt-4 space-y-3">
            {[
              { k: "Question", c: "“How did you find your first clients with no network?”" },
              { k: "Discussion", c: "Three people who’ve done it weigh in with specifics." },
              { k: "Relationship", c: "You connect with the one whose values match yours." },
              { k: "Opportunity", c: "Work, collaboration, and trust follow naturally." },
            ].map((s, i) => (
              <div key={s.k} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-white">
                    {i + 1}
                  </span>
                  {i < 3 && <span className="my-0.5 w-px flex-1 bg-line" />}
                </div>
                <div className="pb-1">
                  <div className="text-[14px] font-semibold text-ink-1">{s.k}</div>
                  <p className="text-[13px] text-ink-2">{s.c}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="border-t-1.5 border-line">
        <div className="mx-auto grid max-w-content gap-8 px-6 py-16 md:grid-cols-3 md:px-10">
          {[
            { icon: Compass, title: "Organized around missions", body: "Join people on the same journey — launching a business, switching careers, returning to work, building in public." },
            { icon: MessagesSquare, title: "Conversation, not performance", body: "No résumé theater. Share what you’re working on and figuring out — and meet people who can actually help." },
            { icon: ShieldCheck, title: "Human voices first", body: "The feed rewards real people and quietly demotes AI noise. AI helps build your profile; it never speaks for you." },
          ].map((f) => (
            <div key={f.title}>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-accent-light text-accent">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 font-display text-lg font-bold text-ink-1">{f.title}</h3>
              <p className="mt-1.5 text-[13px] leading-[1.6] text-ink-2">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-content px-6 py-20 text-center md:px-10">
        <h2 className="font-display text-2xl font-bold tracking-[-0.025em] text-ink-1">
          Your whole self belongs here.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-base text-ink-2">
          Build a profile that reflects who you actually are — and find the people
          who get it.
        </p>
        <Link href="/onboarding" className="mt-6 inline-block">
          <Button size="lg">Get started <ArrowRight className="h-4 w-4" /></Button>
        </Link>
      </section>

      <footer className="border-t-1.5 border-line">
        <div className="mx-auto flex max-w-content flex-col items-center justify-between gap-2 px-6 py-6 text-[13px] text-ink-3 md:flex-row md:px-10">
          <span>© 2026 Versona · Northern Virginia / DC Metro</span>
          <span>Where the whole person meets the whole community.</span>
        </div>
      </footer>
    </main>
  );
}
