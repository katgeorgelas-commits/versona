# Versona — Path A (Community-First MVP)

> Where the whole person meets the whole community.

Versona is a human-first professional community platform. **Path A** builds the
**user side only** — no company profiles, no job board, no employer dashboard.
People build their professional identity, find their people, and connect around
shared missions. Opportunity emerges from connection, not the other way around.

Core loop: **Question → Discussion → Relationship → Opportunity.**

---

## Tech stack

| Layer      | Choice                                                        |
| ---------- | ------------------------------------------------------------ |
| Framework  | Next.js 14 (App Router, TypeScript, RSC + Server Actions)    |
| Styling    | Tailwind CSS — deep purple + warm orange design system       |
| Backend    | Supabase (Postgres, Auth, Realtime, Storage, RLS)            |
| AI         | Anthropic `claude-sonnet-4-6`, server-side only              |
| Hosting    | Vercel                                                       |
| Mobile     | Responsive web + installable PWA now; Expo/React Native later |

Chosen to match the team's recurring stack (Georgelas Command, ExCo Hub) and
because Supabase Realtime covers the feed, DMs, and notifications natively.

---

## Getting started

```bash
# 1. Install
npm install

# 2. Configure env
cp .env.example .env.local      # fill in Supabase + Anthropic keys

# 3. Start the local database (requires Docker + Supabase CLI)
npx supabase start              # boots Postgres, Auth, Storage, Realtime
npm run db:reset                # applies migrations + seed.sql

# 4. (optional) regenerate DB types from the live local schema
npm run db:types

# 5. Run
npm run dev                     # http://localhost:3000
```

Open the app and use the 🧪 **dev user switcher** (bottom-left) to act as any
seeded user. Demo users: `maya`, `dev`, `sasha`, and `admin`.

---

## Auth is built last (by design)

Per the PRD, authentication is the **final** layer. Until then we run with
**mock auth** (`NEXT_PUBLIC_USE_MOCK_AUTH=true`): `lib/auth/session.ts` resolves
a seeded user from the `versona_mock_user` cookie. Every feature is built behind
this abstraction, so the auth feature only flips `getSessionUser()` from the mock
path to the real Supabase path — no feature rewrites.

---

## Build sequence

Features are built one at a time, with a review checkpoint before and after each:

1. **Onboarding AI flow** — `§3.1`
2. **User profile** — `§3.2`
3. **Missions + mission feed** — `§3.3`
4. **Home feed** — `§3.4`
5. **Person-to-person connections** — `§3.5`
6. **Direct messaging** — `§3.5`
7. **Notifications** — `§5`
8. **Admin dashboard** — `§6`

Unbuilt screens render a `FeaturePlaceholder` naming their PRD section.

---

## Project structure

```
src/
  app/
    page.tsx                 Public landing (TikTok-to-web funnel)
    onboarding/              Conversational onboarding (distraction-free)
    (app)/                   Authenticated shell (nav + session)
      feed/  missions/  messages/  notifications/  saved/  [username]/
    admin/                   Internal operator tool (web-only, admins)
    api/
      ai/                    Onboarding, synthesis, suggestions, prompts, detection, gaps
      health/                Liveness probe
  components/  ui/ brand/ layout/ dev/
  config/                    headlines, reactions, post types
  lib/                       supabase/ anthropic/ auth/ api/ utils
  types/                     app.ts, database.ts (regenerate via npm run db:types)
supabase/
  migrations/                0001 → 0007 schema + RLS
  seed.sql                   10 curated missions + demo users
docs/                        ARCHITECTURE, DATA_MODEL, DECISIONS
```

See [`docs/DECISIONS.md`](docs/DECISIONS.md) for every assumption made during
scaffolding that you may want to override.
