-- ════════════════════════════════════════════════════════════════════════
-- 0001_foundation — extensions, enums, users, profiles, ai_profiles
-- ════════════════════════════════════════════════════════════════════════
-- Versona Path A (community-first). Companies/jobs are intentionally absent.
-- Auth is built last; in dev, rows are seeded directly and a mock session
-- selects an existing user. `auth_user_id` links to Supabase auth.users once
-- real auth ships (nullable until then).

create extension if not exists "pgcrypto" with schema extensions; -- gen_random_uuid()
create extension if not exists "citext" with schema extensions;   -- case-insensitive usernames/emails

-- ── Enums ───────────────────────────────────────────────────────────────
create type profile_visibility as enum ('public', 'connections', 'private');
create type account_status     as enum ('active', 'deactivated', 'suspended');

-- Shared helper: keep updated_at fresh on any row touch.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── users ───────────────────────────────────────────────────────────────
-- Identity + account. Auth credentials live in auth.users (added later);
-- this is the public-facing account record keyed by username.
create table public.users (
  id            uuid primary key default extensions.gen_random_uuid(),
  auth_user_id  uuid unique,                       -- FK to auth.users once auth ships
  username      citext unique not null
                  check (username ~ '^[a-z0-9_]{3,30}$'),
  email         citext unique,
  display_name  text not null,
  avatar_url    text,
  status        account_status not null default 'active',
  is_admin      boolean not null default false,    -- internal Versona team
  -- Privacy controls (PRD §4)
  profile_visibility profile_visibility not null default 'public',
  -- NOTE: "Work with me" toggle parked — see docs/PARKED.md
  email_verified  boolean not null default false,  -- gate for feed access (auth feature)
  last_active_at  timestamptz,                      -- powers "active this week"
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index users_last_active_idx on public.users (last_active_at desc nulls last);
create trigger users_set_updated_at before update on public.users
  for each row execute function public.set_updated_at();

-- ── profiles ────────────────────────────────────────────────────────────
-- The living human profile (PRD §3.2). One per user. AI-extracted fields are
-- always user-editable; `*_edited` flags record when a human overrode the AI.
create table public.profiles (
  user_id        uuid primary key references public.users(id) on delete cascade,

  -- Headline: templated or custom (PRD §3.2)
  headline       text check (char_length(headline) <= 200),
  headline_template text,                            -- which template id was used, if any

  -- AI-generated identity snapshot (2–3 sentences), user-editable
  identity_snapshot text check (char_length(identity_snapshot) <= 600),
  identity_snapshot_edited boolean not null default false,

  -- Structured signal arrays surfaced from onboarding
  values         text[] not null default '{}',      -- top 3–5
  work_style     text[] not null default '{}',
  skills         text[] not null default '{}',      -- soft + hard, displayed as tags

  -- Current reality: what they're doing + what they're figuring out
  current_focus    text check (char_length(current_focus) <= 500),
  current_struggle text check (char_length(current_struggle) <= 500),

  -- Ambitions (where they want to go)
  ambitions      text check (char_length(ambitions) <= 500),

  -- Portfolio / work links (optional). [{label, url}]
  links          jsonb not null default '[]',

  -- Hidden sections (privacy) — array of section keys hidden from public view
  hidden_sections text[] not null default '{}',

  -- Completeness 0–100, recomputed on edit (drives gap nudges)
  completeness   smallint not null default 0 check (completeness between 0 and 100),

  -- V2 placeholder — shown locked
  career_identity_score smallint,

  onboarding_completed_at timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ── ai_profiles ─────────────────────────────────────────────────────────
-- Private AI working memory (PRD §7 AIProfile). Raw onboarding transcript,
-- extracted vectors for "people like you", and suggestion/dismissal history.
-- NOT public — RLS restricts to owner + service role.
create table public.ai_profiles (
  user_id        uuid primary key references public.users(id) on delete cascade,
  -- Full conversational onboarding transcript: [{role, content, ts}]
  onboarding_transcript jsonb not null default '[]',
  -- Structured extraction the model produced from the transcript
  extracted      jsonb not null default '{}',
  -- Values/work-style embedding for similarity matching (pgvector added in 0008 when needed)
  traits_vector  jsonb,
  -- Suggestions shown + user actions, so we never re-show a dismissed item
  suggestion_history jsonb not null default '[]',
  dismissed_suggestions text[] not null default '{}',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger ai_profiles_set_updated_at before update on public.ai_profiles
  for each row execute function public.set_updated_at();
