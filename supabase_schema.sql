-- ════════════════════════════════════════════════════════════════════════════
--  my agenda — Supabase schema
--  Run this whole file in Supabase → SQL Editor → New query → Run.
--  It is safe to re-run: every statement is idempotent.
-- ════════════════════════════════════════════════════════════════════════════


-- ─── PROFILES ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  role          text not null default 'student',
  display_name  text,
  pairing_code  text,
  school_name   text,
  school_city   text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- The table may already exist (for example from Supabase's starter template),
-- so make sure every column the app uses is there.
alter table public.profiles add column if not exists role               text not null default 'student';
alter table public.profiles add column if not exists display_name       text;
alter table public.profiles add column if not exists pairing_code       text;
alter table public.profiles add column if not exists school_name        text;
alter table public.profiles add column if not exists school_city        text;
alter table public.profiles add column if not exists created_at         timestamptz default now();
alter table public.profiles add column if not exists updated_at         timestamptz default now();
alter table public.profiles add column if not exists push_token         text;
alter table public.profiles add column if not exists classes            jsonb;
alter table public.profiles add column if not exists points             integer default 0;
alter table public.profiles add column if not exists streak             integer default 0;
alter table public.profiles add column if not exists last_activity_date text;
alter table public.profiles add column if not exists grade              integer;
alter table public.profiles add column if not exists avatar             text;     -- small data: URI
alter table public.profiles add column if not exists onboarded          boolean default false;
alter table public.profiles add column if not exists timetable          jsonb;     -- slots + weekday rotation

-- An older app ("ScholarQuest") used this same database and left required
-- columns (name, account_type, loc, day_offset…) that this app never fills in.
-- Make any such leftover column optional so sign-ups and saves aren't rejected.
do $$
declare r record;
begin
  for r in
    select c.table_name, c.column_name
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name in ('profiles', 'homework', 'events', 'parent_student_links', 'nudges')
      and c.is_nullable = 'NO'
      and c.column_default is null
      and not (c.table_name, c.column_name) in (
        ('profiles', 'id'), ('homework', 'id'), ('homework', 'user_id'), ('homework', 'title'),
        ('events', 'id'), ('events', 'user_id'), ('events', 'title'),
        ('parent_student_links', 'id'), ('parent_student_links', 'parent_id'), ('parent_student_links', 'student_id'),
        ('nudges', 'id'), ('nudges', 'parent_id'), ('nudges', 'student_id'))
  loop
    execute format('alter table public.%I alter column %I drop not null', r.table_name, r.column_name);
  end loop;
end $$;

-- Carry over names and parent/student roles from the older app's columns
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'name') then
    execute 'update public.profiles set display_name = name where display_name is null and name is not null and trim(name) <> ''''';
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'account_type') then
    execute 'update public.profiles set role = ''parent'', pairing_code = null where account_type = ''parent'' and role <> ''parent''';
  end if;
end $$;

-- Students from the older app never did this app's setup, so send them through it
update public.profiles set onboarded = false
where role = 'student' and classes is null and timetable is null and onboarded is true;

-- Pairing codes must be unique so a code always points at exactly one student
do $$
begin
  create unique index if not exists profiles_pairing_code_key
    on public.profiles (pairing_code) where pairing_code is not null;
exception when unique_violation then
  raise notice 'Duplicate pairing codes exist; unique index skipped';
end $$;

alter table public.profiles enable row level security;

-- Remove every older access rule on the app's tables before adding the new ones.
-- (Rules combine with OR, so one leftover "everyone can read" rule would expose data.)
do $$
declare r record;
begin
  for r in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles', 'homework', 'events', 'parent_student_links', 'nudges', 'activity', 'friendships', 'messages')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

drop policy if exists "Auth users read profiles"      on public.profiles;
drop policy if exists "Users read own profile"        on public.profiles;
drop policy if exists "Parents read linked profiles"  on public.profiles;
drop policy if exists "Users insert own profile"      on public.profiles;
drop policy if exists "Users update own profile"      on public.profiles;

create policy "Users read own profile" on public.profiles
  for select to authenticated using (auth.uid() = id);

create policy "Users insert own profile" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

create policy "Users update own profile" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);


-- ─── PAIRING-CODE GENERATOR + NEW-USER TRIGGER ───────────────────────────────
create or replace function public.generate_pairing_code()
returns text language plpgsql as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code  text;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    end loop;
    exit when not exists (select 1 from public.profiles where pairing_code = code);
  end loop;
  return code;
end $$;

-- Every new auth user gets a profile immediately — even before they confirm
-- their email — with the role and name they picked on the sign-up screen.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  r text := coalesce(new.raw_user_meta_data->>'role', 'student');
begin
  if r not in ('student', 'parent') then r := 'student'; end if;
  insert into public.profiles (id, role, display_name, pairing_code)
  values (
    new.id,
    r,
    nullif(trim(coalesce(new.raw_user_meta_data->>'display_name', '')), ''),
    case when r = 'student' then public.generate_pairing_code() end
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: accounts created before this trigger existed
insert into public.profiles (id, role, display_name, pairing_code)
select u.id,
       case when u.raw_user_meta_data->>'role' = 'parent' then 'parent' else 'student' end,
       nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
       case when coalesce(u.raw_user_meta_data->>'role', 'student') <> 'parent'
            then public.generate_pairing_code() end
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-- Students who existed before pairing codes were server-generated
update public.profiles set pairing_code = public.generate_pairing_code()
where role = 'student' and pairing_code is null;


-- ─── PARENT-STUDENT LINKS ────────────────────────────────────────────────────
create table if not exists public.parent_student_links (
  id           uuid default gen_random_uuid() primary key,
  parent_id    uuid references auth.users(id) on delete cascade not null,
  student_id   uuid references auth.users(id) on delete cascade not null,
  pairing_code text not null,
  student_name text,
  linked_at    timestamptz default now(),
  unique(parent_id, student_id)
);

alter table public.parent_student_links add column if not exists pairing_code text;
alter table public.parent_student_links add column if not exists student_name text;
alter table public.parent_student_links add column if not exists linked_at    timestamptz default now();
do $$
begin
  create unique index if not exists parent_student_links_pair_key
    on public.parent_student_links (parent_id, student_id);
exception when unique_violation then
  raise notice 'Duplicate parent links exist; unique index skipped';
end $$;

alter table public.parent_student_links enable row level security;

-- Links are only ever created by link_student_by_code(), which checks the code.
-- Only the parent can remove a link; students cannot disconnect a parent.
drop policy if exists "Parents manage own links"     on public.parent_student_links;
drop policy if exists "Parents read own links"       on public.parent_student_links;
drop policy if exists "Parents delete own links"     on public.parent_student_links;
drop policy if exists "Students read own links"      on public.parent_student_links;
drop policy if exists "Students delete own links"    on public.parent_student_links;

create policy "Parents read own links" on public.parent_student_links
  for select to authenticated using (auth.uid() = parent_id);
create policy "Parents delete own links" on public.parent_student_links
  for delete to authenticated using (auth.uid() = parent_id);
create policy "Students read own links" on public.parent_student_links
  for select to authenticated using (auth.uid() = student_id);

-- Helper used by the policies below
create or replace function public.is_parent_of(student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.parent_student_links
    where parent_id = auth.uid() and student_id = student
  );
$$;

-- Parents can read the profile (points, streak, classes…) of a linked student
create policy "Parents read linked profiles" on public.profiles
  for select to authenticated using (public.is_parent_of(id));


-- ─── HOMEWORK ────────────────────────────────────────────────────────────────
create table if not exists public.homework (
  id          text primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  class_id    text,
  subject     text,
  class_color text,
  title       text not null,
  notes       text,
  tag         text,
  due         text,
  due_date    timestamptz,
  due_urgent  boolean default false,
  reminder    text,
  points      integer default 10,
  done        boolean default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
alter table public.homework add column if not exists class_id    text;
alter table public.homework add column if not exists subject     text;
alter table public.homework add column if not exists class_color text;
alter table public.homework add column if not exists notes       text;
alter table public.homework add column if not exists tag         text;
alter table public.homework add column if not exists due         text;
alter table public.homework add column if not exists due_date    timestamptz;
alter table public.homework add column if not exists due_urgent  boolean default false;
alter table public.homework add column if not exists reminder    text;
alter table public.homework add column if not exists points      integer default 10;
alter table public.homework add column if not exists done        boolean default false;
alter table public.homework add column if not exists created_at  timestamptz default now();
alter table public.homework add column if not exists updated_at  timestamptz default now();
alter table public.homework add column if not exists photos  text[] default '{}';
alter table public.homework add column if not exists done_at timestamptz;

alter table public.homework enable row level security;

drop policy if exists "Students CRUD own homework"   on public.homework;
drop policy if exists "Parents read linked homework" on public.homework;
create policy "Students CRUD own homework" on public.homework for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Parents read linked homework" on public.homework for select to authenticated
  using (public.is_parent_of(user_id));


-- ─── EVENTS ──────────────────────────────────────────────────────────────────
create table if not exists public.events (
  id         text primary key,
  user_id    uuid references auth.users(id) on delete cascade not null,
  title      text not null,
  kind       text,
  type       text,
  icon       text,
  time       text,
  end_time   text,
  date       timestamptz,
  location   text,
  reminder   text,
  done       boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.events add column if not exists kind       text;
alter table public.events add column if not exists type       text;
alter table public.events add column if not exists icon       text;
alter table public.events add column if not exists time       text;
alter table public.events add column if not exists end_time   text;
alter table public.events add column if not exists date       timestamptz;
alter table public.events add column if not exists location   text;
alter table public.events add column if not exists reminder   text;
alter table public.events add column if not exists done       boolean default false;
alter table public.events add column if not exists created_at timestamptz default now();
alter table public.events add column if not exists updated_at timestamptz default now();
alter table public.events add column if not exists repeat       text;          -- 'weekly' or null
alter table public.events add column if not exists repeat_until timestamptz;   -- null = until removed
alter table public.events add column if not exists skip_dates   text[] default '{}';

alter table public.events enable row level security;

drop policy if exists "Students CRUD own events"   on public.events;
drop policy if exists "Parents read linked events" on public.events;
create policy "Students CRUD own events" on public.events for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Parents read linked events" on public.events for select to authenticated
  using (public.is_parent_of(user_id));


-- ─── ACTIVITY (what the parent's feed shows) ─────────────────────────────────
create table if not exists public.activity (
  id         uuid default gen_random_uuid() primary key,
  student_id uuid references auth.users(id) on delete cascade not null,
  type       text not null,          -- hw_added | hw_done | event_added | streak
  text       text not null,
  subject    text,
  color      text,
  created_at timestamptz default now()
);
create index if not exists activity_student_created on public.activity (student_id, created_at desc);

alter table public.activity enable row level security;

drop policy if exists "Students write own activity"   on public.activity;
drop policy if exists "Students read own activity"    on public.activity;
drop policy if exists "Parents read linked activity"  on public.activity;
create policy "Students write own activity" on public.activity for insert to authenticated
  with check (auth.uid() = student_id);
create policy "Students read own activity" on public.activity for select to authenticated
  using (auth.uid() = student_id);
create policy "Parents read linked activity" on public.activity for select to authenticated
  using (public.is_parent_of(student_id));


-- ─── NUDGES ──────────────────────────────────────────────────────────────────
create table if not exists public.nudges (
  id           uuid default gen_random_uuid() primary key,
  parent_id    uuid references auth.users(id) on delete cascade not null,
  student_id   uuid references auth.users(id) on delete cascade not null,
  message      text not null default 'How''s the homework going? 👋',
  sent_at      timestamptz default now(),
  seen         boolean default false
);
alter table public.nudges add column if not exists message text not null default 'How''s the homework going? 👋';
alter table public.nudges add column if not exists sent_at timestamptz default now();
alter table public.nudges add column if not exists seen    boolean default false;
alter table public.nudges enable row level security;

drop policy if exists "Parents insert nudges"    on public.nudges;
drop policy if exists "Parents read own nudges"  on public.nudges;
drop policy if exists "Students read own nudges" on public.nudges;
drop policy if exists "Students mark nudge seen" on public.nudges;
create policy "Parents insert nudges" on public.nudges for insert to authenticated
  with check (auth.uid() = parent_id and public.is_parent_of(student_id));
create policy "Parents read own nudges" on public.nudges for select to authenticated
  using (auth.uid() = parent_id);
create policy "Students read own nudges" on public.nudges for select to authenticated
  using (auth.uid() = student_id);
create policy "Students mark nudge seen" on public.nudges for update to authenticated
  using (auth.uid() = student_id) with check (auth.uid() = student_id);


-- ─── FRIENDSHIPS (mutual — one row per direction) ────────────────────────────
create table if not exists public.friendships (
  user_id    uuid references auth.users(id) on delete cascade not null,
  friend_id  uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (user_id, friend_id)
);
alter table public.friendships enable row level security;

drop policy if exists "Users read own friendships" on public.friendships;
create policy "Users read own friendships" on public.friendships for select to authenticated
  using (auth.uid() = user_id);


-- ─── MESSAGES (friends only; parents never see them) ─────────────────────────
create table if not exists public.messages (
  id           uuid primary key default gen_random_uuid(),
  sender_id    uuid references auth.users(id) on delete cascade not null,
  recipient_id uuid references auth.users(id) on delete cascade not null,
  body         text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at   timestamptz not null default now(),
  read_at      timestamptz
);
create index if not exists messages_recipient_idx on public.messages (recipient_id, created_at desc);
create index if not exists messages_sender_idx    on public.messages (sender_id, created_at desc);
alter table public.messages enable row level security;

-- Only the two people in a conversation can read it
drop policy if exists "Read own messages" on public.messages;
create policy "Read own messages" on public.messages for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = recipient_id);
-- You can only send as yourself, only to someone in your squad, and not pre-read
drop policy if exists "Send to friends" on public.messages;
create policy "Send to friends" on public.messages for insert to authenticated
  with check (
    auth.uid() = sender_id and read_at is null
    and exists (select 1 from public.friendships f
                where f.user_id = auth.uid() and f.friend_id = recipient_id));
-- You can take back a message you sent
drop policy if exists "Unsend own messages" on public.messages;
create policy "Unsend own messages" on public.messages for delete to authenticated
  using (auth.uid() = sender_id);
-- No update policy: read receipts go through mark_messages_read below.


-- ─── RPC FUNCTIONS (the only way to use a pairing code) ──────────────────────

-- Parent enters a kid's code → link is created. Never reveals other students.
create or replace function public.link_student_by_code(p_code text)
returns table (student_id uuid, display_name text, school_name text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  me uuid := auth.uid();
  s  public.profiles;
begin
  if me is null then raise exception 'not_signed_in'; end if;
  if not exists (select 1 from public.profiles where id = me and role = 'parent') then
    raise exception 'not_a_parent';
  end if;
  select * into s from public.profiles
   where pairing_code = upper(trim(p_code)) and role = 'student';
  if not found then raise exception 'code_not_found'; end if;

  insert into public.parent_student_links (parent_id, student_id, pairing_code, student_name)
  values (me, s.id, s.pairing_code, s.display_name)
  on conflict (parent_id, student_id) do nothing;

  return query select s.id, s.display_name, s.school_name;
end $$;

-- Student's view of who is connected to them
create or replace function public.get_my_parents()
returns table (parent_id uuid, display_name text, linked_at timestamptz)
language sql stable security definer set search_path = public as $$
  select l.parent_id, p.display_name, l.linked_at
  from public.parent_student_links l
  join public.profiles p on p.id = l.parent_id
  where l.student_id = auth.uid()
  order by l.linked_at;
$$;

-- Push tokens of every parent linked to the calling student
create or replace function public.get_parent_push_tokens()
returns setof text
language sql stable security definer set search_path = public as $$
  select p.push_token
  from public.parent_student_links l
  join public.profiles p on p.id = l.parent_id
  where l.student_id = auth.uid() and p.push_token is not null;
$$;

-- Student adds a friend by their code. Friendship is mutual.
create or replace function public.add_friend_by_code(p_code text)
returns text
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  f  public.profiles;
begin
  if me is null then return 'not_signed_in'; end if;
  select * into f from public.profiles
   where pairing_code = upper(trim(p_code)) and role = 'student';
  if not found then return 'not_found'; end if;
  if f.id = me then return 'self'; end if;
  if exists (select 1 from public.friendships where user_id = me and friend_id = f.id) then
    return 'already';
  end if;
  insert into public.friendships (user_id, friend_id) values (me, f.id), (f.id, me)
  on conflict do nothing;
  return 'added';
end $$;

create or replace function public.remove_friend(p_friend uuid)
returns void
language sql security definer set search_path = public as $$
  delete from public.friendships
  where (user_id = auth.uid() and friend_id = p_friend)
     or (user_id = p_friend and friend_id = auth.uid());
$$;

-- Friends list with only the fields friends are allowed to see
create or replace function public.get_friends()
returns table (id uuid, display_name text, school_name text, grade integer,
               points integer, streak integer, last_activity_date text, avatar text)
language sql stable security definer set search_path = public as $$
  select p.id, p.display_name, p.school_name, p.grade,
         coalesce(p.points, 0), coalesce(p.streak, 0), p.last_activity_date, p.avatar
  from public.friendships f
  join public.profiles p on p.id = f.friend_id
  where f.user_id = auth.uid();
$$;

-- Mark everything a friend sent me as read
create or replace function public.mark_messages_read(p_friend uuid)
returns void
language sql security definer set search_path = public as $$
  update public.messages set read_at = now()
  where recipient_id = auth.uid() and sender_id = p_friend and read_at is null;
$$;

revoke all on function public.mark_messages_read(uuid)    from public, anon;
grant execute on function public.mark_messages_read(uuid)    to authenticated;
revoke all on function public.link_student_by_code(text)  from public, anon;
revoke all on function public.get_my_parents()            from public, anon;
revoke all on function public.get_parent_push_tokens()    from public, anon;
revoke all on function public.add_friend_by_code(text)    from public, anon;
revoke all on function public.remove_friend(uuid)         from public, anon;
revoke all on function public.get_friends()               from public, anon;
grant execute on function public.link_student_by_code(text)  to authenticated;
grant execute on function public.get_my_parents()            to authenticated;
grant execute on function public.get_parent_push_tokens()    to authenticated;
grant execute on function public.add_friend_by_code(text)    to authenticated;
grant execute on function public.remove_friend(uuid)         to authenticated;
grant execute on function public.get_friends()               to authenticated;


-- ─── HOMEWORK PHOTOS (private storage bucket) ────────────────────────────────
-- Files live at  <student id>/<homework id>/<n>.jpg
insert into storage.buckets (id, name, public)
values ('homework-photos', 'homework-photos', false)
on conflict (id) do nothing;

drop policy if exists "Students upload own photos"  on storage.objects;
drop policy if exists "Students read own photos"    on storage.objects;
drop policy if exists "Students delete own photos"  on storage.objects;
drop policy if exists "Parents read linked photos"  on storage.objects;

create policy "Students upload own photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'homework-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Students read own photos" on storage.objects for select to authenticated
  using (bucket_id = 'homework-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Students delete own photos" on storage.objects for delete to authenticated
  using (bucket_id = 'homework-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Parents read linked photos" on storage.objects for select to authenticated
  using (bucket_id = 'homework-photos'
         and public.is_parent_of(((storage.foldername(name))[1])::uuid));


-- ─── REALTIME ────────────────────────────────────────────────────────────────
-- Live updates: nudges → student, homework/events/activity → parent,
-- links → student ("parent connected" on the pairing screen), messages → friends.
do $$
declare t text;
begin
  foreach t in array array['nudges', 'homework', 'events', 'activity', 'parent_student_links', 'messages'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
