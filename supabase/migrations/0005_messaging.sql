-- ════════════════════════════════════════════════════════════════════════
-- 0005_messaging — threads, messages, requests, reactions, read receipts
-- ════════════════════════════════════════════════════════════════════════
-- DMs unlock after mutual connection (PRD §3.5). Non-connections may send a
-- rate-limited message REQUEST (max 5/day) that the recipient previews + accepts.
-- Encryption posture for MVP: TLS in transit + encrypted at rest + strict RLS.
-- True end-to-end encryption is a deferred V2 requirement (see docs/DECISIONS.md).

create type thread_state as enum ('request', 'accepted', 'blocked');

create table public.threads (
  id          uuid primary key default extensions.gen_random_uuid(),
  -- Canonical 2-party thread: user_a < user_b by uuid ordering (enforced in app)
  user_a      uuid not null references public.users(id) on delete cascade,
  user_b      uuid not null references public.users(id) on delete cascade,
  state       thread_state not null default 'request',
  initiated_by uuid not null references public.users(id) on delete cascade,
  last_message_at timestamptz,
  created_at  timestamptz not null default now(),
  check (user_a <> user_b)
);
create unique index threads_unique_pair on public.threads (user_a, user_b);
create index threads_user_a_idx on public.threads (user_a, last_message_at desc);
create index threads_user_b_idx on public.threads (user_b, last_message_at desc);

create table public.messages (
  id          uuid primary key default extensions.gen_random_uuid(),
  thread_id   uuid not null references public.threads(id) on delete cascade,
  sender_id   uuid not null references public.users(id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 4000),
  read_at     timestamptz,                          -- read receipt
  created_at  timestamptz not null default now()
);
create index messages_thread_idx on public.messages (thread_id, created_at);

-- Basic emoji reactions on messages
create table public.message_reactions (
  message_id  uuid not null references public.messages(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  emoji       text not null,
  created_at  timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);

-- Rate-limit ledger for message requests to non-connections (max 5/day).
-- App checks count(*) over the trailing 24h before inserting a request thread.
create table public.message_request_log (
  id          uuid primary key default extensions.gen_random_uuid(),
  sender_id   uuid not null references public.users(id) on delete cascade,
  recipient_id uuid not null references public.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);
create index message_request_log_sender_idx on public.message_request_log (sender_id, created_at desc);

create or replace function public.touch_thread_last_message()
returns trigger language plpgsql as $$
begin
  update public.threads set last_message_at = new.created_at where id = new.thread_id;
  return null;
end;
$$;
create trigger messages_touch_thread after insert on public.messages
  for each row execute function public.touch_thread_last_message();
