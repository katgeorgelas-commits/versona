# Data Model

Maps PRD §7 to the SQL in `supabase/migrations/`. All tables live in `public`,
have RLS enabled (`0007_rls.sql`), and use `uuid` PKs.

## Identity (`0001_foundation.sql`)
- **users** — account + identity. `username` (citext, the `/[username]` URL),
  privacy controls, `is_admin`, `last_active_at`. `auth_user_id` links to
  `auth.users` once auth ships (nullable until then).
- **profiles** — the living human profile (1:1 with users). Headline, AI identity
  snapshot, `values[]`, `work_style[]`, `skills[]`, current focus/struggle,
  ambitions, links, `completeness`, locked `career_identity_score` (V2).
- **ai_profiles** — private AI working memory: onboarding transcript, structured
  extraction, traits vector, suggestion/dismissal history. Owner-only.

## Community (`0002_missions.sql`)
- **missions** — curated spaces. Brief, accent color, icon, `member_count` (trigger).
- **mission_members** — join table (user ↔ mission).
- **weekly_prompts** — rotating prompt; one active per mission (partial unique index).

## Feed (`0003_feed.sql`)
- **posts** — typed (question/discussion/prompt_response/update), rich HTML +
  text mirror, mission tag, ≤3 topics, AI-flag signals, denormalized counters.
- **replies** — one level of nesting via `parent_reply_id`.
- **reactions** — beyond-like kinds; one per (post, user, kind).
- **saved_posts** — personal collection.

## Connections (`0004_connections.sql`)
- **follows** — asymmetric.
- **connections** — symmetric, one row per unordered pair, **required note**.
- *"Work with me" / "I can help" signals are parked — see `PARKED.md`.*

## Messaging (`0005_messaging.sql`)
- **threads** — canonical 2-party, `state` (request/accepted/blocked).
- **messages** — body, `read_at` receipt.
- **message_reactions** — emoji.
- **message_request_log** — ledger for the 5/day non-connection rate limit.

## Notifications (`0006_notifications.sql`)
- **notifications** — typed, polymorphic entity reference, `read_at`.
- **notification_preferences** — email digest cadence, push, per-type toggles.
- **push_subscriptions** — web push now; native tokens when mobile ships.

## Helper functions
- `are_connected(a, b)` — mutual-accepted check (used by messaging RLS).
- `current_user_id()` / `is_admin()` — resolve app user from `auth.uid()`.
- `set_updated_at()` and counter-sync triggers keep derived data fresh.
