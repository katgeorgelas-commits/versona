-- ════════════════════════════════════════════════════════════════════════
-- seed.sql — curated missions + demo users (runs on `supabase db reset`)
-- ════════════════════════════════════════════════════════════════════════
-- These power local dev with mock auth. Demo users have no auth.users row yet
-- (auth is built last); the mock session selects one of them by username.

-- ── Curated missions (PRD §3.3: seed 8–12) ──────────────────────────────
insert into public.missions (slug, name, brief, accent_color, icon, display_order) values
  ('launching-my-first-business', 'Launching My First Business',
   'For first-time founders in the messy early days. Share what you''re building, what''s breaking, and find people a few steps ahead.',
   '#7c3aed', 'rocket', 1),
  ('career-transition', 'Career Transition',
   'Changing fields, industries, or identities. A space for the in-between — guidance, support, and people who''ve made the leap.',
   '#ea580c', 'route', 2),
  ('becoming-a-better-manager', 'Becoming a Better Manager',
   'New and growing managers learning to lead humans. Trade hard-won lessons, vent the hard days, get real advice.',
   '#0ea5e9', 'users', 3),
  ('breaking-into-tech', 'Breaking Into Tech',
   'For people entering tech from anywhere. Demystify the path, swap resources, and meet others on the same climb.',
   '#16a34a', 'terminal', 4),
  ('navigating-layoffs', 'Navigating Layoffs',
   'Displaced, bought out, or between roles. A grounded, judgment-free space to regroup and move forward together.',
   '#db2777', 'life-buoy', 5),
  ('freelancing-full-time', 'Freelancing Full-Time',
   'Going independent and making it sustainable. Pricing, clients, feast-or-famine, and the freedom in between.',
   '#d97706', 'briefcase', 6),
  ('building-in-public', 'Building in Public',
   'Share the work as it happens. Progress, setbacks, metrics, and momentum — out loud, with people who get it.',
   '#9333ea', 'megaphone', 7),
  ('first-90-days', 'The First 90 Days',
   'Just started something new. Ramp up, build trust, and figure out the unwritten rules with others doing the same.',
   '#2563eb', 'calendar-clock', 8),
  ('returning-to-work', 'Returning to Work',
   'After a break — caregiving, health, sabbatical, or life. Rebuild confidence and momentum on your own terms.',
   '#0d9488', 'undo-2', 9),
  ('finding-my-people', 'Finding My People',
   'For anyone who just wants to meet collaborators, mentors, and friends in their field. Connection first, everything else follows.',
   '#e11d48', 'heart-handshake', 10);

-- ── Demo users (dev only) ────────────────────────────────────────────────
insert into public.users (id, username, display_name, email, is_admin, email_verified, last_active_at) values
  ('11111111-1111-1111-1111-111111111111', 'maya',  'Maya Okafor',   'maya@example.com',  false, true, now()),
  ('22222222-2222-2222-2222-222222222222', 'dev',   'Dev Patel',     'dev@example.com',   false, true, now() - interval '2 hours'),
  ('33333333-3333-3333-3333-333333333333', 'sasha', 'Sasha Romano',  'sasha@example.com', false, true, now() - interval '1 day'),
  ('44444444-4444-4444-4444-444444444444', 'admin', 'Versona Team',  'team@versona.com',  true,  true, now());

insert into public.profiles (user_id, headline, identity_snapshot, values, work_style, skills, current_focus, current_struggle, ambitions, completeness, onboarding_completed_at) values
  ('11111111-1111-1111-1111-111111111111',
   'Currently launching my first startup, struggling with customer acquisition',
   'Maya is a former federal analyst turned founder who cares deeply about doing honest work that helps people. She moves fast, thinks in systems, and is happiest building alongside people she trusts.',
   array['Honesty','Impact','Autonomy','Craft'],
   array['Deep focus over meetings','Thrives in ambiguity','Direct communicator'],
   array['Product strategy','Data analysis','Storytelling','Early-stage GTM'],
   'Getting my first 100 users for a tool that helps displaced workers find their footing.',
   'Figuring out customer acquisition without a marketing budget.',
   'Build a company that proves human-first hiring can win.',
   85, now() - interval '3 days'),
  ('22222222-2222-2222-2222-222222222222',
   'In transition from agency design to product, looking for people who''ve made the jump',
   'Dev is a designer moving from agency work into product. Curious, collaborative, and a little restless — he learns by shipping and wants teammates who push his thinking.',
   array['Growth','Curiosity','Collaboration'],
   array['Async-first','Structured communicator','Energized by feedback'],
   array['UX design','Design systems','Prototyping','Figma'],
   'Learning product thinking and rebuilding my portfolio around outcomes, not pixels.',
   'Imposter syndrome around the business side of product.',
   'Become a product designer at a mission-driven team.',
   70, now() - interval '5 days'),
  ('33333333-3333-3333-3333-333333333333',
   'Building in public — a newsletter for career switchers, 400 subscribers and growing',
   'Sasha is a writer and community-builder who turned her own career pivot into a public project. Warm, consistent, and generous with what she learns.',
   array['Generosity','Consistency','Community'],
   array['Lives in public','Morning maker','Encouraging communicator'],
   array['Writing','Community building','Newsletter growth','Public speaking'],
   'Growing my newsletter and turning it into a real community.',
   'Staying consistent without burning out.',
   'Turn my audience into a sustainable independent business.',
   80, now() - interval '1 day');

-- Memberships + a starter weekly prompt per active mission
insert into public.mission_members (mission_id, user_id)
select m.id, '11111111-1111-1111-1111-111111111111'
from public.missions m where m.slug in ('launching-my-first-business','building-in-public','finding-my-people');
insert into public.mission_members (mission_id, user_id)
select m.id, '22222222-2222-2222-2222-222222222222'
from public.missions m where m.slug in ('career-transition','breaking-into-tech','first-90-days');
insert into public.mission_members (mission_id, user_id)
select m.id, '33333333-3333-3333-3333-333333333333'
from public.missions m where m.slug in ('building-in-public','freelancing-full-time','finding-my-people');

insert into public.weekly_prompts (mission_id, prompt, source)
select id,
  'What''s the one thing you''re stuck on this week that someone here might have already solved?',
  'admin'
from public.missions where is_active;

-- Default notification prefs for demo users
insert into public.notification_preferences (user_id)
select id from public.users;
