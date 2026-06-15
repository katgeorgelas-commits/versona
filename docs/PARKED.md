# Parked Features

Features intentionally pulled from the active MVP build, preserved here so they
can be revived without redesign. Nothing here is deployed.

---

## "Work with me" / "I can help" signals

**Parked on 2026-06-12** at the founder's request — revisit after core community
loop (onboarding → profile → missions → feed → connections → DMs) is proven.

The person-to-person opportunity primitive from Kat's Research:
- **"Work with me"** — a profile-level flag signaling you're open to collaboration. Visible to all.
- **"I can help"** — tapped on someone's post or profile to signal you have something to offer them specifically.

Open question when reviving: keep these **free signals** (PRD framing) or attach
the **credits** model floated in the Parking Lot doc. Decide before rebuilding.

### To revive — schema

Add the column back to `public.users` (was in `0001_foundation.sql`):

```sql
work_with_me_enabled boolean not null default true,
```

Add a new migration (e.g. `0008_help_signals.sql`):

```sql
-- "I can help" — directed offer to a specific person, optionally on a post.
create table public.help_signals (
  id          uuid primary key default extensions.gen_random_uuid(),
  from_user_id uuid not null references public.users(id) on delete cascade,
  to_user_id   uuid not null references public.users(id) on delete cascade,
  post_id     uuid references public.posts(id) on delete cascade,  -- null = profile-level
  message     text check (char_length(message) <= 300),
  created_at  timestamptz not null default now(),
  check (from_user_id <> to_user_id)
);
create index help_signals_to_idx on public.help_signals (to_user_id, created_at desc);

alter table public.help_signals enable row level security;
create policy help_signals_select on public.help_signals for select using (
  from_user_id = public.current_user_id() or to_user_id = public.current_user_id()
);
create policy help_signals_insert on public.help_signals for insert
  with check (from_user_id = public.current_user_id());
```

### To revive — app

- Re-add `"help_signal"` to `NotificationType` in `src/types/app.ts` and the
  `notification_type` enum in `0006_notifications.sql`.
- Re-add `work_with_me_enabled` and the `help_signals` table to
  `src/types/database.ts` (or just run `npm run db:types`).
- Notification triggers: "I can help" received → notify recipient (PRD §5).
- UI: a "Work with me" toggle in profile settings + badge on the profile; an
  "I can help" action on posts and profiles.
