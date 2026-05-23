-- Run this entire file in your Supabase SQL Editor (supabase.com → project → SQL Editor)
-- It is safe to re-run; all statements use IF NOT EXISTS / OR REPLACE.

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

alter table public.profiles enable row level security;

-- Any authenticated user can read profiles (needed for pairing-code lookup)
drop policy if exists "Auth users read profiles" on public.profiles;
create policy "Auth users read profiles" on public.profiles
  for select to authenticated using (true);

drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id);

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

alter table public.homework enable row level security;

drop policy if exists "Students CRUD own homework" on public.homework;
create policy "Students CRUD own homework" on public.homework for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Parents read linked homework" on public.homework;
create policy "Parents read linked homework" on public.homework for select
  using (
    exists (
      select 1 from public.parent_student_links psl
      where psl.parent_id = auth.uid() and psl.student_id = public.homework.user_id
    )
  );

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

alter table public.events enable row level security;

drop policy if exists "Students CRUD own events" on public.events;
create policy "Students CRUD own events" on public.events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Parents read linked events" on public.events;
create policy "Parents read linked events" on public.events for select
  using (
    exists (
      select 1 from public.parent_student_links psl
      where psl.parent_id = auth.uid() and psl.student_id = public.events.user_id
    )
  );

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

alter table public.parent_student_links enable row level security;

drop policy if exists "Parents manage own links" on public.parent_student_links;
create policy "Parents manage own links" on public.parent_student_links for all
  using (auth.uid() = parent_id)
  with check (auth.uid() = parent_id);

drop policy if exists "Students read own links" on public.parent_student_links;
create policy "Students read own links" on public.parent_student_links for select
  using (auth.uid() = student_id);
