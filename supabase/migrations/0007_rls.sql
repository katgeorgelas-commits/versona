-- ════════════════════════════════════════════════════════════════════════
-- 0007_rls — Row Level Security
-- ════════════════════════════════════════════════════════════════════════
-- Policies are written against auth.uid() for when real auth ships. In dev with
-- mock auth, the server uses the SERVICE ROLE key (which bypasses RLS), and the
-- app layer scopes every query to the mock user — so feature work proceeds now
-- and these policies are already correct for production.
--
-- Helper to resolve the current app user id from the auth session.
create or replace function public.current_user_id()
returns uuid language sql stable as $$
  select id from public.users where auth_user_id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql stable as $$
  select coalesce((select is_admin from public.users where auth_user_id = auth.uid()), false);
$$;

-- Enable RLS everywhere.
alter table public.users                    enable row level security;
alter table public.profiles                 enable row level security;
alter table public.ai_profiles              enable row level security;
alter table public.missions                 enable row level security;
alter table public.mission_members          enable row level security;
alter table public.weekly_prompts           enable row level security;
alter table public.posts                    enable row level security;
alter table public.replies                  enable row level security;
alter table public.reactions                enable row level security;
alter table public.saved_posts              enable row level security;
alter table public.follows                  enable row level security;
alter table public.connections              enable row level security;
alter table public.threads                  enable row level security;
alter table public.messages                 enable row level security;
alter table public.message_reactions        enable row level security;
alter table public.message_request_log      enable row level security;
alter table public.notifications            enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.push_subscriptions       enable row level security;

-- ── users ───────────────────────────────────────────────────────────────
-- Public profiles are world-readable; 'connections'/'private' are restricted.
create policy users_select on public.users for select using (
  status = 'active' and (
    profile_visibility = 'public'
    or id = public.current_user_id()
    or (profile_visibility = 'connections' and public.are_connected(id, public.current_user_id()))
    or public.is_admin()
  )
);
create policy users_update_self on public.users for update
  using (id = public.current_user_id()) with check (id = public.current_user_id());

-- ── profiles ────────────────────────────────────────────────────────────
create policy profiles_select on public.profiles for select using (
  exists (select 1 from public.users u where u.id = profiles.user_id)  -- visibility enforced via users join in app
);
create policy profiles_write_self on public.profiles for all
  using (user_id = public.current_user_id()) with check (user_id = public.current_user_id());

-- ── ai_profiles (private) ───────────────────────────────────────────────
create policy ai_profiles_owner on public.ai_profiles for all
  using (user_id = public.current_user_id() or public.is_admin())
  with check (user_id = public.current_user_id());

-- ── missions (curated, public-read) ─────────────────────────────────────
create policy missions_select on public.missions for select using (is_active or public.is_admin());
create policy mission_members_select on public.mission_members for select using (true);
create policy mission_members_self on public.mission_members for all
  using (user_id = public.current_user_id()) with check (user_id = public.current_user_id());
create policy weekly_prompts_select on public.weekly_prompts for select using (true);

-- ── feed ────────────────────────────────────────────────────────────────
create policy posts_select on public.posts for select using (not is_removed or public.is_admin());
create policy posts_insert on public.posts for insert with check (author_id = public.current_user_id());
create policy posts_update_self on public.posts for update
  using (author_id = public.current_user_id() or public.is_admin());

create policy replies_select on public.replies for select using (not is_removed or public.is_admin());
create policy replies_insert on public.replies for insert with check (author_id = public.current_user_id());
create policy replies_update_self on public.replies for update
  using (author_id = public.current_user_id() or public.is_admin());

create policy reactions_select on public.reactions for select using (true);
create policy reactions_self on public.reactions for all
  using (user_id = public.current_user_id()) with check (user_id = public.current_user_id());

create policy saved_posts_self on public.saved_posts for all
  using (user_id = public.current_user_id()) with check (user_id = public.current_user_id());

-- ── connections / follows / signals ─────────────────────────────────────
create policy follows_select on public.follows for select using (true);
create policy follows_self on public.follows for all
  using (follower_id = public.current_user_id()) with check (follower_id = public.current_user_id());

create policy connections_select on public.connections for select using (
  requester_id = public.current_user_id() or recipient_id = public.current_user_id() or public.is_admin()
);
create policy connections_insert on public.connections for insert
  with check (requester_id = public.current_user_id());
create policy connections_update_party on public.connections for update using (
  recipient_id = public.current_user_id() or requester_id = public.current_user_id()
);

-- help_signals policies parked with the "I can help" feature — see docs/PARKED.md

-- ── messaging (participants only) ───────────────────────────────────────
create policy threads_select on public.threads for select using (
  user_a = public.current_user_id() or user_b = public.current_user_id() or public.is_admin()
);
create policy threads_insert on public.threads for insert
  with check (initiated_by = public.current_user_id());
create policy threads_update_party on public.threads for update using (
  user_a = public.current_user_id() or user_b = public.current_user_id()
);

create policy messages_select on public.messages for select using (
  exists (select 1 from public.threads t where t.id = messages.thread_id
          and (t.user_a = public.current_user_id() or t.user_b = public.current_user_id()))
  or public.is_admin()
);
create policy messages_insert on public.messages for insert with check (
  sender_id = public.current_user_id()
  and exists (select 1 from public.threads t where t.id = thread_id
              and (t.user_a = public.current_user_id() or t.user_b = public.current_user_id()))
);
create policy message_reactions_self on public.message_reactions for all
  using (user_id = public.current_user_id()) with check (user_id = public.current_user_id());
create policy message_request_log_self on public.message_request_log for all
  using (sender_id = public.current_user_id()) with check (sender_id = public.current_user_id());

-- ── notifications (recipient only) ──────────────────────────────────────
create policy notifications_recipient on public.notifications for select
  using (recipient_id = public.current_user_id());
create policy notifications_update_recipient on public.notifications for update
  using (recipient_id = public.current_user_id());
create policy notification_preferences_self on public.notification_preferences for all
  using (user_id = public.current_user_id()) with check (user_id = public.current_user_id());
create policy push_subscriptions_self on public.push_subscriptions for all
  using (user_id = public.current_user_id()) with check (user_id = public.current_user_id());
