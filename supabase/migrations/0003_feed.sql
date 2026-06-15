-- ════════════════════════════════════════════════════════════════════════
-- 0003_feed — posts, replies, reactions, saves (PRD §3.4)
-- ════════════════════════════════════════════════════════════════════════
-- Chronological by default. AI-generated content is demoted, not hidden.
-- Reactions go beyond "like": "this resonates", "I needed this", "let's connect".

create type post_type     as enum ('question', 'discussion', 'prompt_response', 'update');
create type reaction_kind as enum ('resonates', 'needed_this', 'lets_connect', 'helpful');

-- ── posts ───────────────────────────────────────────────────────────────
create table public.posts (
  id            uuid primary key default extensions.gen_random_uuid(),
  author_id     uuid not null references public.users(id) on delete cascade,
  type          post_type not null default 'discussion',
  -- Rich text stored as sanitized HTML; plain-text mirror for search/AI detection
  body_html     text not null,
  body_text     text not null check (char_length(body_text) <= 1500),
  -- Optional mission tag (a post can live in the home/discovery feed untagged)
  mission_id    uuid references public.missions(id) on delete set null,
  -- If this responds to the mission's weekly prompt
  weekly_prompt_id uuid references public.weekly_prompts(id) on delete set null,
  -- Up to 3 skill/topic tags
  topics        text[] not null default '{}' check (array_length(topics, 1) is null or array_length(topics, 1) <= 3),
  image_url     text,
  -- AI-content demotion signals (PRD §3.4, §3.6)
  ai_flagged    boolean not null default false,     -- heuristic OR user flag set this
  ai_score      real,                               -- 0..1 model estimate of "AI-generated"
  ai_flag_source text check (ai_flag_source in ('heuristic', 'user', 'both')),
  -- Denormalized engagement counters (maintained by triggers) for cheap ranking
  reply_count    integer not null default 0,
  reaction_count integer not null default 0,
  save_count     integer not null default 0,
  is_removed    boolean not null default false,      -- soft delete (admin moderation)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index posts_created_idx        on public.posts (created_at desc);
create index posts_mission_created_idx on public.posts (mission_id, created_at desc);
create index posts_author_idx          on public.posts (author_id, created_at desc);
create trigger posts_set_updated_at before update on public.posts
  for each row execute function public.set_updated_at();

-- ── replies ─────────────────────────────────────────────────────────────
create table public.replies (
  id          uuid primary key default extensions.gen_random_uuid(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  author_id   uuid not null references public.users(id) on delete cascade,
  body_html   text not null,
  body_text   text not null check (char_length(body_text) <= 500),
  -- One level of nesting (reply-to-reply) supported via parent
  parent_reply_id uuid references public.replies(id) on delete cascade,
  ai_flagged  boolean not null default false,
  is_removed  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index replies_post_idx on public.replies (post_id, created_at);
create trigger replies_set_updated_at before update on public.replies
  for each row execute function public.set_updated_at();

-- ── reactions ───────────────────────────────────────────────────────────
-- A user may leave at most one reaction of each kind per post.
create table public.reactions (
  id          uuid primary key default extensions.gen_random_uuid(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  kind        reaction_kind not null,
  created_at  timestamptz not null default now(),
  unique (post_id, user_id, kind)
);
create index reactions_post_idx on public.reactions (post_id);

-- ── saved_posts ─────────────────────────────────────────────────────────
create table public.saved_posts (
  user_id    uuid not null references public.users(id) on delete cascade,
  post_id    uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

-- ── counter maintenance ─────────────────────────────────────────────────
create or replace function public.sync_post_counters()
returns trigger language plpgsql as $$
declare
  delta int := case when tg_op = 'INSERT' then 1 else -1 end;
  target uuid := case when tg_op = 'INSERT' then
    coalesce(new.post_id) else coalesce(old.post_id) end;
begin
  if tg_table_name = 'replies' then
    update public.posts set reply_count = greatest(reply_count + delta, 0) where id = target;
  elsif tg_table_name = 'reactions' then
    update public.posts set reaction_count = greatest(reaction_count + delta, 0) where id = target;
  elsif tg_table_name = 'saved_posts' then
    update public.posts set save_count = greatest(save_count + delta, 0) where id = target;
  end if;
  return null;
end;
$$;
create trigger replies_counter     after insert or delete on public.replies     for each row execute function public.sync_post_counters();
create trigger reactions_counter   after insert or delete on public.reactions   for each row execute function public.sync_post_counters();
create trigger saved_posts_counter after insert or delete on public.saved_posts for each row execute function public.sync_post_counters();
