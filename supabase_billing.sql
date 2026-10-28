-- Parent plan: 7-day trial, Stripe subscriptions, paywall switch (off until you turn it on).
-- Paste into Supabase → SQL Editor → Run. Safe to run more than once.
-- (Also included in supabase_schema.sql.)

-- ─── PARENT PLAN (billing) ───────────────────────────────────────────────────
-- The kid side is free. Parents get a 7-day trial that starts when they first
-- connect to a kid (Sept 5 if that happens over summer), then pay monthly or
-- for the school year through Stripe. Stripe's webhook (a Netlify function using
-- the service-role key) is the only thing that writes subscriptions.
-- Nothing is locked until app_settings.paywall_enabled is switched on.

create table if not exists public.app_settings (
  id              boolean primary key default true check (id),
  paywall_enabled boolean not null default false,
  trial_days      integer not null default 7
);
insert into public.app_settings (id) values (true) on conflict (id) do nothing;
alter table public.app_settings enable row level security;
drop policy if exists "Signed-in users read settings" on public.app_settings;
create policy "Signed-in users read settings" on public.app_settings
  for select to authenticated using (true);

create table if not exists public.subscriptions (
  parent_id              uuid primary key references auth.users(id) on delete cascade,
  status                 text not null default 'trial',   -- trial | active | paused | past_due | canceled
  plan                   text,                            -- monthly | yearly
  trial_ends_at          timestamptz,
  current_period_end     timestamptz,
  paused_until           timestamptz,
  summer_keep            boolean not null default false,  -- keep billing on over summer
  stripe_customer_id     text,
  stripe_subscription_id text,
  updated_at             timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
drop policy if exists "Parents read own subscription" on public.subscriptions;
create policy "Parents read own subscription" on public.subscriptions
  for select to authenticated using (auth.uid() = parent_id);

-- A trial that would start over summer (July 1 – Sept 4) starts on Sept 5 instead (Vancouver time)
create or replace function public.trial_start_for(ts timestamptz)
returns timestamptz language sql immutable as $$
  select case
    when extract(month from ts at time zone 'America/Vancouver') in (7, 8)
      or (extract(month from ts at time zone 'America/Vancouver') = 9 and extract(day from ts at time zone 'America/Vancouver') < 5)
      then make_timestamptz(extract(year from ts at time zone 'America/Vancouver')::int, 9, 5, 0, 0, 0, 'America/Vancouver')
    else ts
  end;
$$;

create or replace function public.start_parent_trial()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.subscriptions (parent_id, status, trial_ends_at)
  values (new.parent_id, 'trial',
          public.trial_start_for(now())
            + make_interval(days => coalesce((select trial_days from public.app_settings), 7)))
  on conflict (parent_id) do nothing;
  return new;
end $$;

drop trigger if exists on_parent_link_start_trial on public.parent_student_links;
create trigger on_parent_link_start_trial
  after insert on public.parent_student_links
  for each row execute function public.start_parent_trial();

-- Parents who were already connected get their trial from today
insert into public.subscriptions (parent_id, status, trial_ends_at)
select distinct l.parent_id, 'trial',
       public.trial_start_for(now()) + make_interval(days => coalesce((select trial_days from public.app_settings), 7))
from public.parent_student_links l
on conflict (parent_id) do nothing;

-- Accounts that never pay (the app's creators). Matched on email, so it still
-- works if an account is deleted and made again. Not readable from the app.
create table if not exists public.free_accounts (
  email text primary key,
  note  text
);
alter table public.free_accounts enable row level security;
insert into public.free_accounts (email, note) values
  ('jaygiraud@gmail.com', 'Creator'),
  ('noahkaigiraud@icloud.com', 'Creator')
on conflict (email) do nothing;

create or replace function public.is_free_account(p uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from auth.users u
    join public.free_accounts f on lower(f.email) = lower(u.email)
    where u.id = p
  );
$$;

-- Lets the app show "Free for creators" instead of trial banners
create or replace function public.my_account_is_free()
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_free_account(auth.uid());
$$;
revoke all on function public.is_free_account(uuid) from public, anon, authenticated;
revoke all on function public.my_account_is_free() from public, anon;
grant execute on function public.my_account_is_free() to authenticated;

-- Can this parent see their kids' stuff right now?
create or replace function public.parent_has_access(p uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select not coalesce((select paywall_enabled from public.app_settings), false)
      or public.is_free_account(p)
      or exists (
        select 1 from public.subscriptions s
        where s.parent_id = p and (
             s.status in ('active', 'paused')                                    -- paying, or paused for summer
          or (s.status = 'trial' and s.trial_ends_at > now())
          or (s.status in ('past_due', 'canceled') and s.current_period_end > now())  -- paid-up time left
        ));
$$;

create or replace function public.is_parent_of(student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.parent_student_links
    where parent_id = auth.uid() and student_id = student
  ) and public.parent_has_access(auth.uid());
$$;
