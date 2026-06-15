-- ════════════════════════════════════════════════════════════════════════
-- 0004_connections — follows, connections
-- ════════════════════════════════════════════════════════════════════════
-- Connection is intentional, not frictionless (PRD §3.5).
--   • Follow   — asymmetric (Twitter-style)
--   • Connect  — symmetric, REQUIRES a note (no blank requests)
--
-- The "Work with me" / "I can help" signals are PARKED — see docs/PARKED.md.

create type connection_status as enum ('pending', 'accepted', 'declined');

-- ── follows ─────────────────────────────────────────────────────────────
create table public.follows (
  follower_id  uuid not null references public.users(id) on delete cascade,
  following_id uuid not null references public.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create index follows_following_idx on public.follows (following_id);

-- ── connections ─────────────────────────────────────────────────────────
-- Symmetric relationship stored once with a canonical ordering enforced in app
-- (requester_id is always the initiator; the pair is unique regardless of order).
create table public.connections (
  id           uuid primary key default extensions.gen_random_uuid(),
  requester_id uuid not null references public.users(id) on delete cascade,
  recipient_id uuid not null references public.users(id) on delete cascade,
  status       connection_status not null default 'pending',
  -- Required opening note — enforced NOT NULL + non-empty (no cold blank requests)
  note         text not null check (char_length(trim(note)) between 1 and 500),
  responded_at timestamptz,
  created_at   timestamptz not null default now(),
  check (requester_id <> recipient_id)
);
-- One connection record per unordered pair (least/greatest canonicalization).
create unique index connections_unique_pair on public.connections (
  least(requester_id, recipient_id),
  greatest(requester_id, recipient_id)
);
create index connections_recipient_idx on public.connections (recipient_id, status);
create index connections_requester_idx on public.connections (requester_id, status);

-- Convenience: are two users connected? (used by messaging RLS)
create or replace function public.are_connected(a uuid, b uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.connections
    where status = 'accepted'
      and least(requester_id, recipient_id) = least(a, b)
      and greatest(requester_id, recipient_id) = greatest(a, b)
  );
$$;

-- ── help_signals / "Work with me" ───────────────────────────────────────
-- PARKED. The directed "I can help" table and the profile-level "Work with me"
-- flag were removed from the active build on 2026-06-12. Full revival spec
-- (schema + RLS + app wiring) lives in docs/PARKED.md.
