-- ════════════════════════════════════════════════════════════════════════
-- 0002_missions — mission spaces, membership, weekly prompts
-- ════════════════════════════════════════════════════════════════════════
-- A Mission is a community built around a professional journey (PRD §3.3).
-- Curated only at launch (user creation is V2). Moderation is internal.

create table public.missions (
  id            uuid primary key default extensions.gen_random_uuid(),
  slug          citext unique not null check (slug ~ '^[a-z0-9-]{2,60}$'),
  name          text not null,
  -- Pinned "mission brief": what this space is for, who it's for
  brief         text not null,
  description   text,
  -- Distinct visual identity within the design system
  accent_color  text not null default '#7c3aed',   -- hex, rendered as --mission-accent
  icon          text not null default 'compass',    -- lucide icon name
  -- Curation / lifecycle (admin-managed)
  is_active     boolean not null default true,
  is_archived   boolean not null default false,
  display_order smallint not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger missions_set_updated_at before update on public.missions
  for each row execute function public.set_updated_at();

-- ── mission_members ─────────────────────────────────────────────────────
create table public.mission_members (
  mission_id  uuid not null references public.missions(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  joined_at   timestamptz not null default now(),
  -- Denormalized for cheap "active member" indicators; refreshed on activity
  last_active_in_mission_at timestamptz,
  primary key (mission_id, user_id)
);
create index mission_members_user_idx on public.mission_members (user_id);

-- ── weekly_prompts ──────────────────────────────────────────────────────
-- Rotating discussion prompt per mission (AI-generated or admin-set, PRD §3.3).
-- Exactly one active prompt per mission at a time is enforced by app logic +
-- the partial unique index below.
create table public.weekly_prompts (
  id          uuid primary key default extensions.gen_random_uuid(),
  mission_id  uuid not null references public.missions(id) on delete cascade,
  prompt      text not null,
  source      text not null default 'ai' check (source in ('ai', 'admin')),
  is_active   boolean not null default true,
  starts_at   timestamptz not null default now(),
  ends_at     timestamptz,
  created_by  uuid references public.users(id) on delete set null,  -- admin who set it, if any
  created_at  timestamptz not null default now()
);
create unique index weekly_prompts_one_active_per_mission
  on public.weekly_prompts (mission_id) where (is_active);
create index weekly_prompts_mission_idx on public.weekly_prompts (mission_id, starts_at desc);

-- Cached member count for fast mission cards. Maintained by trigger.
alter table public.missions add column member_count integer not null default 0;

create or replace function public.sync_mission_member_count()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT') then
    update public.missions set member_count = member_count + 1 where id = new.mission_id;
  elsif (tg_op = 'DELETE') then
    update public.missions set member_count = greatest(member_count - 1, 0) where id = old.mission_id;
  end if;
  return null;
end;
$$;
create trigger mission_members_count_sync
  after insert or delete on public.mission_members
  for each row execute function public.sync_mission_member_count();
