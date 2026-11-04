-- Parent notifications + red number on the app icon.
-- Paste into Supabase → SQL Editor → Run. Safe to run more than once.
-- (Also included in supabase_schema.sql.)

-- ─── PARENT NOTIFICATIONS + APP-ICON BADGE ──────────────────────────────────
-- Web push for the Home Screen app: when a kid finishes homework, linked parents
-- get a notification and a red number on the app icon (finished since they last
-- opened the app). Sent by a Netlify function with the service-role key.
create table if not exists public.push_subscriptions (
  endpoint   text primary key,
  user_id    uuid references auth.users(id) on delete cascade not null,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
drop policy if exists "Users read own push subscriptions" on public.push_subscriptions;
create policy "Users read own push subscriptions" on public.push_subscriptions
  for select to authenticated using (auth.uid() = user_id);

create table if not exists public.parent_prefs (
  parent_id       uuid primary key references auth.users(id) on delete cascade,
  notify_mode     text not null default 'each' check (notify_mode in ('each', 'daily', 'off')),
  last_seen_at    timestamptz not null default now(),
  last_summary_at timestamptz
);
alter table public.parent_prefs enable row level security;
drop policy if exists "Parents read own prefs" on public.parent_prefs;
create policy "Parents read own prefs" on public.parent_prefs
  for select to authenticated using (auth.uid() = parent_id);

-- Save this phone for notifications (a phone moves to whoever signs in on it)
create or replace function public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text)
returns void language sql security definer set search_path = public as $$
  insert into public.push_subscriptions (endpoint, user_id, p256dh, auth)
  values (p_endpoint, auth.uid(), p_p256dh, p_auth)
  on conflict (endpoint) do update set user_id = auth.uid(), p256dh = excluded.p256dh, auth = excluded.auth, created_at = now();
$$;

create or replace function public.remove_push_subscription(p_endpoint text)
returns void language sql security definer set search_path = public as $$
  delete from public.push_subscriptions where endpoint = p_endpoint and user_id = auth.uid();
$$;

-- Parent opened the app: the badge count starts again from zero
create or replace function public.mark_parent_seen()
returns void language sql security definer set search_path = public as $$
  insert into public.parent_prefs (parent_id, last_seen_at) values (auth.uid(), now())
  on conflict (parent_id) do update set last_seen_at = now();
$$;

create or replace function public.set_notify_mode(p_mode text)
returns void language sql security definer set search_path = public as $$
  insert into public.parent_prefs (parent_id, notify_mode) values (auth.uid(), p_mode)
  on conflict (parent_id) do update set notify_mode = excluded.notify_mode;
$$;

revoke all on function public.save_push_subscription(text, text, text) from public, anon;
revoke all on function public.remove_push_subscription(text) from public, anon;
revoke all on function public.mark_parent_seen() from public, anon;
revoke all on function public.set_notify_mode(text) from public, anon;
grant execute on function public.save_push_subscription(text, text, text) to authenticated;
grant execute on function public.remove_push_subscription(text) to authenticated;
grant execute on function public.mark_parent_seen() to authenticated;
grant execute on function public.set_notify_mode(text) to authenticated;


