import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { searchAll } from "@/features/explore/data";
import { PageHeader, SectionLabel } from "@/components/layout/page-parts";
import { PersonRow } from "@/features/connections/person-row";
import { PostCard } from "@/features/feed/post-card";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SearchFilters, type FilterTab } from "@/features/search/search-filters";
import { spacePath } from "@/lib/utils";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; filter?: string; sort?: string; time?: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect("/");
  const q = searchParams.q ?? "";
  const filter = (searchParams.filter ?? "all") as FilterTab;
  const sortBy = searchParams.sort ?? "relevance";
  const timeRange = searchParams.time ?? "any";

  const results = await searchAll(q, user.id);

  let filteredPosts = results.posts;
  if (timeRange !== "any") {
    const now = Date.now();
    const cutoff = timeRange === "day" ? 86400000 : timeRange === "week" ? 604800000 : 2592000000;
    filteredPosts = filteredPosts.filter((p) => now - new Date(p.createdAt).getTime() < cutoff);
  }
  if (sortBy === "recent") {
    filteredPosts = [...filteredPosts].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  const counts = {
    all: results.people.length + results.missions.length + filteredPosts.length + results.topics.length,
    people: results.people.length,
    spaces: results.missions.length,
    posts: filteredPosts.length,
    topics: results.topics.length,
  };

  const empty = counts.all === 0;
  const showPeople = (filter === "all" || filter === "people") && results.people.length > 0;
  const showSpaces = (filter === "all" || filter === "spaces") && results.missions.length > 0;
  const showPosts = (filter === "all" || filter === "posts") && filteredPosts.length > 0;
  const showTopics = (filter === "all" || filter === "topics") && results.topics.length > 0;

  return (
    <div className="mx-auto max-w-feed">
      <Breadcrumbs items={[{ label: "Search" }]} />
      <PageHeader title={q ? `Results for "${q}"` : "Search"} subtitle={q ? undefined : "Search people, missions, posts, and topics."} />

      {q && <SearchFilters activeTab={filter} counts={counts} />}

      {q && empty && (
        <div className="rounded-lg border-1.5 border-dashed border-line p-10 text-center text-[13px] text-ink-3">
          Nothing matched &ldquo;{q}&rdquo;. Try a different search.
        </div>
      )}

      {showTopics && (
        <section className="mb-8">
          <SectionLabel count={results.topics.length}>Topics</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {results.topics.map((t) => (
              <Link key={t.tag} href={`/topic/${encodeURIComponent(t.tag)}`} className="rounded-full border-1.5 border-line px-3 py-1 text-[13px] text-accent transition-colors hover:border-accent-hover">
                #{t.tag} <span className="text-ink-3">{t.count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {showPeople && (
        <section className="mb-8">
          <SectionLabel count={results.people.length}>People</SectionLabel>
          <div className="space-y-2">
            {results.people.map((p) => (
              <PersonRow key={p.id} person={p} />
            ))}
          </div>
        </section>
      )}

      {showSpaces && (
        <section className="mb-8">
          <SectionLabel count={results.missions.length}>Missions &amp; Circles</SectionLabel>
          <div className="space-y-2">
            {results.missions.map((m) => (
              <Link key={m.id} href={spacePath(m.kind, m.slug)} className="block rounded-lg border-1.5 border-line p-4 transition-colors hover:border-accent-hover">
                <div className="font-display text-[15px] font-bold text-ink-1">{m.name}</div>
                <p className="mt-0.5 line-clamp-1 text-[13px] text-ink-2">{m.brief}</p>
                <span className="mt-1 block text-[11px] text-ink-3">{m.memberCount} members</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {showPosts && (
        <section>
          <SectionLabel count={filteredPosts.length}>Posts</SectionLabel>
          <div className="space-y-3">
            {filteredPosts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
