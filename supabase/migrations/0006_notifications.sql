-- ════════════════════════════════════════════════════════════════════════
-- 0006_notifications — in-app notification center + delivery preferences
-- ════════════════════════════════════════════════════════════════════════
-- "Inform, not manipulate" (PRD §5). No growth-hack dark patterns.

create type notification_type as enum (
  'reply',                 -- new reply to your post
  'connection_request',    -- new connection request
  'connection_accepted',   -- accepted connection
  'message',               -- message received
  'weekly_prompt',         -- mission weekly prompt live
  -- 'help_signal' parked with the "I can help" feature — see docs/PARKED.md
  'profile_view',          -- connections only
  'reaction',              -- someone reacted to your post
  'profile_gap'            -- AI nudge to fill a profile gap
);

create type digest_frequency as enum ('off', 'daily', 'weekly');

create table public.notifications (
  id          uuid primary key default extensions.gen_random_uuid(),
  recipient_id uuid not null references public.users(id) on delete cascade,
  type        notification_type not null,
  -- Actor who triggered it (nullable for system/AI nudges)
  actor_id    uuid references public.users(id) on delete set null,
  -- Polymorphic reference to the subject entity
  entity_type text,        -- 'post' | 'reply' | 'connection' | 'thread' | 'mission' | 'profile'
  entity_id   uuid,
  -- Pre-rendered short summary for the notification center
  summary     text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index notifications_recipient_idx on public.notifications (recipient_id, created_at desc);
create index notifications_unread_idx on public.notifications (recipient_id) where (read_at is null);

-- ── notification_preferences ────────────────────────────────────────────
-- One row per user. Per-channel + per-type controls.
create table public.notification_preferences (
  user_id        uuid primary key references public.users(id) on delete cascade,
  email_digest   digest_frequency not null default 'weekly',
  push_enabled   boolean not null default true,
  -- Per-type in-app toggles (defaults all-on); stored as jsonb {type: bool}
  in_app_types   jsonb not null default '{}',
  updated_at     timestamptz not null default now()
);
create trigger notification_preferences_set_updated_at before update on public.notification_preferences
  for each row execute function public.set_updated_at();

-- Push subscription endpoints (Web Push now; native tokens when mobile ships).
create table public.push_subscriptions (
  id          uuid primary key default extensions.gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  platform    text not null default 'web' check (platform in ('web', 'ios', 'android')),
  endpoint    text not null,
  keys        jsonb,           -- web push p256dh/auth, or native token payload
  created_at  timestamptz not null default now(),
  unique (user_id, endpoint)
);
