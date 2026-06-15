# Decisions & Assumptions Log

Every non-obvious choice made during scaffolding. **Flag anything you want to
override** — none of this is locked.

## Confirmed with you up front

| # | Decision | Your call |
|---|----------|-----------|
| 1 | **Mobile strategy** | Web-first responsive + PWA now; Expo/React Native later. Architected so a `packages/` extraction is possible without rewrites. |
| 2 | **Stack** | Next.js 14 + Supabase + Vercel + Anthropic `claude-sonnet-4-6`. |
| 3 | **Auth timing** | Built **last**. Dev runs on mock auth + seeded users behind `getSessionUser()`. |
| 4 | **DM encryption** | Encrypted in transit + at rest + strict RLS for MVP. **True E2E deferred to V2** (see A-7). |

## Assumptions made while scaffolding (override freely)

- **A-1 · "Work with me" / "I can help" — PARKED (2026-06-12).** Removed from the
  active MVP build at the founder's request. Full revival spec in `PARKED.md`.
  The free-signals-vs-credits question is deferred until it's revived.
- **A-2 · 10 curated missions seeded** (PRD said 8–12). Picked launch-audience-fit
  ones: Launching a Business, Career Transition, Better Manager, Breaking Into
  Tech, Navigating Layoffs, Freelancing, Building in Public, First 90 Days,
  Returning to Work, Finding My People. → *Swap/rename any in `supabase/seed.sql`.*
- **A-3 · Reactions** implemented as: *This resonates · I needed this · Helpful ·
  Let's connect* (PRD named the first three; added "Helpful"). → *Adjust in `config/reactions.ts`.*
- **A-4 · Reserved usernames.** Because profiles live at `versona.com/[username]`,
  the words `feed, missions, messages, notifications, saved, onboarding, admin,
  api` are reserved and must be blocked at signup (enforced in the auth feature).
- **A-5 · Rich text stored as sanitized HTML** with a plain-text mirror
  (`body_text`) used for character limits, search, and AI-detection. Sanitization
  library chosen when the feed composer is built.
- **A-6 · Connections store one row per unordered pair** with a required note
  (DB-enforced non-empty) — honors "no blank connection requests."
- **A-7 · True E2E encryption recorded as a known V2 gap.** The MVP posture
  (TLS + at-rest + RLS) supports admin moderation and message-request previews,
  which literal E2E would break. Noted so the NFR isn't silently dropped.
- **A-8 · `database.ts` is hand-authored** to match the migrations so the app
  type-checks before a live DB exists. Regenerate authoritative types with
  `npm run db:types` once Supabase is running.
- **A-9 · Profile completeness** is a stored 0–100 column recomputed on edit
  (drives gap nudges). The scoring formula is defined with Feature 2.
- **A-10 · Weekly prompt** enforces one active prompt per mission via a partial
  unique index; rotation cadence (cron vs. on-demand) decided in Feature 3.
- **A-11 · Profile photo import (LinkedIn/Google)** image hosts are pre-allowed
  in `next.config.mjs`, but the OAuth import itself ships with the auth feature.

## Deferred to V2 (placeholders present)

- Career Identity Score (locked UI state)
- User-created missions / user moderation
- Native desktop app, third-party API, company side (Path B)
- Opportunity marketplace / team formation / credits monetization
