import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Flame, TrendingUp } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { getTrending } from "@/features/explore/data";
import { getDiscovery } from "@/features/connections/data";
import { getMissions } from "@/features/missions/data";
import { PageHeader, SectionLabel } from "@/components/layout/page-parts";
import { PostCard } from "@/features/feed/post-card";
import { PersonRow } from "@/features/connections/person-row";
import { MissionCard } from "@/features/missions/mission-card";
import { MainShell } from "@/components/layout/main-shell";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

/**
 * Discover — one surface for finding your way in: trending topics, people to
 * meet, missions and circles to join, and what's resonating right now.
 * Spaces you've already joined live in Community.
 */
export default async function DiscoverPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");

  const [{ topics, posts }, discovery, allSpaces] = await Promise.all([
    getTrending(user.id),
    getDiscovery(user.id),
    getMissions(user.id),
  ]);

  // De-dupe suggested people (values-aligned + in your spaces).
  const seen = new Set<string>();
  const people = [...discovery.peopleLikeYou, ...discovery.inMyMissions]
    .filter((p) => p.id !== user.id && !seen.has(p.id) && (seen.add(p.id), true))
    .slice(0, 6);

  const missionsToJoin = allSpaces.filter((m) => m.kind === "mission" && !m.isMember).slice(0, 4);
  const circlesToJoin = allSpaces.filter((m) => m.kind === "circle" && !m.isMember).slice(0, 4);

  return (
    <MainShell user={user} right={false}>
      <Breadcrumbs items={[{ label: "Discover" }]} />
      <div className="space-y-9">
        <PageHeader title="Discover" subtitle="Find people, missions, and circles — and see what's resonating right now." />

        {topics.length > 0 && (
          <section className="rounded-lg border-1.5 border-line bg-brand-wash p-5">
            <SectionLabel>Trending topics</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {topics.map((t, i) => (
                <Link
                  key={t.tag}
                  href={`/topic/${encodeURIComponent(t.tag)}`}
                  className="inline-flex items-center gap-1.5 rounded-full border-1.5 border-line bg-bg px-3 py-1.5 text-[13px] font-medium text-ink-1 transition-colors hover:border-accent-hover"
                >
                  {i < 3 && <Flame className="h-3.5 w-3.5 text-energy" />}
                  #{t.tag}
                  <span className="text-ink-3">{t.count}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {people.length > 0 && (
          <section>
            <SectionLabel>People to meet</SectionLabel>
            <p className="mb-2.5 -mt-2 text-[12px] text-ink-3">Based on your values, missions, and who you already follow.</p>
            <div className="space-y-2">
              {people.map((p) => (
                <PersonRow key={p.id} person={p} />
              ))}
            </div>
          </section>
        )}

        {missionsToJoin.length > 0 && (
          <section>
            <SectionLabel>Missions to join</SectionLabel>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {missionsToJoin.map((m) => (
                <MissionCard key={m.id} mission={m} />
              ))}
            </div>
            <BrowseAll href="/missions" label="Browse all missions" />
          </section>
        )}

        {circlesToJoin.length > 0 && (
          <section>
            <SectionLabel>Circles to join</SectionLabel>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {circlesToJoin.map((m) => (
                <MissionCard key={m.id} mission={m} />
              ))}
            </div>
            <BrowseAll href="/circles" label="Browse all circles" />
          </section>
        )}

        {posts.length > 0 && (
          <section>
            <SectionLabel>
              <span className="inline-flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" /> Trending now
              </span>
            </SectionLabel>
            <div className="space-y-3">
              {posts.slice(0, 4).map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </MainShell>
  );
}

function BrowseAll({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-accent hover:text-accent-hover"
    >
      {label} <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
}
