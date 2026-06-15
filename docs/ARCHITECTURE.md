# Architecture

## Shape

A single Next.js 14 App Router application on Vercel, backed by Supabase. The
browser talks to Next (RSC + Server Actions + Route Handlers); the server talks
to Supabase and Anthropic. The Anthropic key and Supabase service-role key never
leave the server.

```
Browser ──▶ Next.js (Vercel)
                │  ├─ Server Components / Server Actions  ──▶ Supabase (RLS, anon/session)
                │  ├─ Route Handlers /api/ai/*            ──▶ Anthropic (claude-sonnet-4-6)
                │  └─ Service-role routines               ──▶ Supabase (bypass RLS: admin, AI, digests)
                └─ Realtime channels (feed / DMs / notifications) ──▶ Supabase Realtime
```

## Auth seam

All session resolution funnels through `lib/auth/session.ts → getSessionUser()`.
Mock and real auth are interchangeable behind it, so features never branch on
auth mode. The auth feature swaps the implementation; nothing downstream changes.

## Data access

- **User-scoped reads/writes** → request-cookie Supabase client (`lib/supabase/server.ts`),
  governed by RLS policies in `migrations/0007_rls.sql`.
- **Realtime** → browser client (`lib/supabase/client.ts`) for live feed, DMs, notifications.
- **Trusted server work** (admin moderation, AI pipelines, email digests, the
  mock-auth path) → service-role client. Scoping is enforced in app code.

## AI layer

Six server-only endpoints under `app/api/ai/*` plus the shared
`lib/anthropic/client.ts`. Constraints from PRD §3.6 are encoded as intent
(`AI_CONSTRAINTS`) and enforced at call sites: AI never posts for users, never
auto-writes public copy without review, and only ever suggests.

## Scaling notes (NFR §8)

- Denormalized counters (`reply_count`, `reaction_count`, `member_count`, …)
  maintained by triggers keep feed/mission cards O(1) to render.
- Indexes target the hot paths: chronological feed, per-mission feed, per-author
  posts, thread message order, unread notifications.
- pgvector for "people like you" similarity is added (migration 0008) when
  Feature 5 needs it; until then `traits_vector` is jsonb.
- Stateless app servers on Vercel; all state in Supabase → horizontal scale to
  the 100K-user target without architecture rework.

## Mobile path

Web is mobile-first responsive + installable PWA today. The component library
(`components/ui`) is intentionally presentational and dependency-light so it can
be lifted into a shared `packages/ui` for an Expo app later (the "single codebase
where possible" goal) without a rewrite.
