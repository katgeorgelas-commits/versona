"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { PersonRow } from "./person-row";
import { respondConnection } from "./actions";
import type { Discovery, ConnectionLists } from "./data";
import type { PersonCard } from "@/types/views";

export function ConnectionsScreen({
  discovery,
  lists,
}: {
  discovery: Discovery;
  lists: ConnectionLists;
}) {
  const { toast, celebrate } = useToast();
  const [incoming, setIncoming] = useState(lists.incoming);
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();

  // Flatten everyone we know about for instant search.
  const everyone = useMemo(() => {
    const seen = new Set<string>();
    const all: PersonCard[] = [];
    for (const p of [...lists.connected, ...discovery.peopleLikeYou, ...discovery.inMyMissions, ...discovery.activeThisWeek]) {
      if (!seen.has(p.id)) { seen.add(p.id); all.push(p); }
    }
    return all;
  }, [lists.connected, discovery]);

  const q = query.trim().toLowerCase();
  const matches = q
    ? everyone.filter((p) => p.displayName.toLowerCase().includes(q) || p.username.toLowerCase().includes(q))
    : [];

  function respond(connectionId: string, accept: boolean) {
    const req = incoming.find((x) => x.connectionId === connectionId);
    setIncoming((prev) => prev.filter((x) => x.connectionId !== connectionId));
    if (accept) { celebrate(); toast(`You're connected with ${req?.person.displayName ?? "them"}`, "success"); }
    startTransition(() => {
      void respondConnection(connectionId, accept);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-[-0.025em] text-ink-1">People</h1>
        <p className="mt-1.5 text-sm text-ink-2">
          Find your people — by mission, by values, by who&apos;s here now.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people by name or @username…"
          className="h-11 w-full rounded-full border-1.5 border-line bg-bg pl-10 pr-4 text-sm text-ink-1 placeholder:text-ink-3 focus:border-accent focus:outline-none"
        />
      </div>

      {q ? (
        <Section title={`${matches.length} ${matches.length === 1 ? "result" : "results"}`}>
          {matches.length === 0 ? (
            <p className="text-[13px] text-ink-3">No one matched “{query}”.</p>
          ) : (
            <div className="space-y-2">{matches.map((p) => <PersonRow key={p.id} person={p} />)}</div>
          )}
        </Section>
      ) : (
      <>
      {/* Incoming connection requests */}
      {incoming.length > 0 && (
        <Section title="Connection requests">
          <div className="space-y-2">
            {incoming.map((req) => (
              <Card key={req.connectionId}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <Link href={`/${req.person.username}`}>
                      <Avatar name={req.person.displayName} src={req.person.avatarUrl} size={44} />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link href={`/${req.person.username}`} className="font-semibold hover:underline">
                        {req.person.displayName}
                      </Link>
                      <p className="mt-1 rounded-lg bg-muted px-3 py-2 text-sm">{req.note}</p>
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" onClick={() => respond(req.connectionId, true)}>
                          Accept
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => respond(req.connectionId, false)}>
                          Decline
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {lists.connected.length > 0 && (
        <Section title="Your connections">
          <div className="space-y-2">
            {lists.connected.map((p) => (
              <PersonRow key={p.id} person={p} showFollow={false} />
            ))}
          </div>
        </Section>
      )}

      {discovery.peopleLikeYou.length > 0 && (
        <Section title="People like you" hint="Aligned on values and work style — not keywords.">
          <div className="space-y-2">
            {discovery.peopleLikeYou.map((p) => (
              <PersonRow key={p.id} person={p} />
            ))}
          </div>
        </Section>
      )}

      {discovery.inMyMissions.length > 0 && (
        <Section title="People in your missions">
          <div className="space-y-2">
            {discovery.inMyMissions.map((p) => (
              <PersonRow key={`m-${p.id}`} person={p} />
            ))}
          </div>
        </Section>
      )}

      {discovery.activeThisWeek.length > 0 && (
        <Section title="Active this week">
          <div className="space-y-2">
            {discovery.activeThisWeek.map((p) => (
              <PersonRow key={`a-${p.id}`} person={p} />
            ))}
          </div>
        </Section>
      )}
      </>
      )}
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold">{title}</h2>
      {hint && <p className="mb-2 text-xs text-muted-foreground">{hint}</p>}
      {!hint && <div className="mb-2" />}
      {children}
    </section>
  );
}
