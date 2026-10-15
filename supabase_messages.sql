-- Messaging between friends (text + photos). Paste into Supabase → SQL Editor → Run.
-- Safe to run more than once. (Also included in supabase_schema.sql.)

-- ─── MESSAGES (friends only; parents never see them) ─────────────────────────
create table if not exists public.messages (
  id           uuid primary key default gen_random_uuid(),
  sender_id    uuid references auth.users(id) on delete cascade not null,
  recipient_id uuid references auth.users(id) on delete cascade not null,
  body         text not null default '',
  created_at   timestamptz not null default now(),
  read_at      timestamptz
);
-- Photo messages: path in the chat-photos bucket, <sender>/<recipient>/<file>.jpg
alter table public.messages add column if not exists photo text;
alter table public.messages alter column body set default '';
alter table public.messages drop constraint if exists messages_body_check;
alter table public.messages drop constraint if exists messages_content_check;
alter table public.messages add constraint messages_content_check
  check (char_length(body) <= 1000 and (char_length(btrim(body)) >= 1 or photo is not null));
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
                where f.user_id = auth.uid() and f.friend_id = recipient_id)
    and (photo is null or (split_part(photo, '/', 1) = auth.uid()::text
                           and split_part(photo, '/', 2) = recipient_id::text)));
-- You can take back a message you sent
drop policy if exists "Unsend own messages" on public.messages;
create policy "Unsend own messages" on public.messages for delete to authenticated
  using (auth.uid() = sender_id);
-- No update policy: read receipts go through mark_messages_read below.

-- Mark everything a friend sent me as read
create or replace function public.mark_messages_read(p_friend uuid)
returns void
language sql security definer set search_path = public as $$
  update public.messages set read_at = now()
  where recipient_id = auth.uid() and sender_id = p_friend and read_at is null;
$$;

revoke all on function public.mark_messages_read(uuid)    from public, anon;
grant execute on function public.mark_messages_read(uuid)    to authenticated;

-- ─── CHAT PHOTOS (private storage bucket) ────────────────────────────────────
-- Files live at  <sender id>/<recipient id>/<file>.jpg. Only those two can open them;
-- parents have no access.
insert into storage.buckets (id, name, public)
values ('chat-photos', 'chat-photos', false)
on conflict (id) do nothing;

drop policy if exists "Send chat photos to friends" on storage.objects;
drop policy if exists "Read own chat photos"        on storage.objects;
drop policy if exists "Delete own chat photos"      on storage.objects;

create policy "Send chat photos to friends" on storage.objects for insert to authenticated
  with check (bucket_id = 'chat-photos'
              and (storage.foldername(name))[1] = auth.uid()::text
              and exists (select 1 from public.friendships f
                          where f.user_id = auth.uid()
                            and f.friend_id::text = (storage.foldername(name))[2]));
create policy "Read own chat photos" on storage.objects for select to authenticated
  using (bucket_id = 'chat-photos'
         and ((storage.foldername(name))[1] = auth.uid()::text
              or (storage.foldername(name))[2] = auth.uid()::text));
create policy "Delete own chat photos" on storage.objects for delete to authenticated
  using (bucket_id = 'chat-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Live delivery
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
