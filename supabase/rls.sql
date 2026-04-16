-- DuoDiary RLS policies (Supabase)
-- Assumes tables exist (apply after schema.sql).

-- Helper function: is member of couple
create or replace function public.is_couple_member(p_couple_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.couple_members cm
    where cm.couple_id = p_couple_id
      and cm.user_id = auth.uid()
  );
$$;

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.diary_entries enable row level security;
alter table public.coupons enable row level security;
alter table public.anniversaries enable row level security;
alter table public.love_notes enable row level security;

-- PROFILES
drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self
on public.profiles
for select
using (id = auth.uid());

-- Allow reading partner profile for same couple (needed for UI)
drop policy if exists profiles_select_same_couple on public.profiles;
create policy profiles_select_same_couple
on public.profiles
for select
using (
  exists (
    select 1
    from public.couple_members me
    join public.couple_members other
      on other.couple_id = me.couple_id
    where me.user_id = auth.uid()
      and other.user_id = public.profiles.id
  )
);

drop policy if exists profiles_upsert_self on public.profiles;
create policy profiles_upsert_self
on public.profiles
for insert
with check (id = auth.uid());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

-- COUPLES
drop policy if exists couples_select_members on public.couples;
create policy couples_select_members
on public.couples
for select
using (public.is_couple_member(id));

drop policy if exists couples_insert_authenticated on public.couples;
create policy couples_insert_authenticated
on public.couples
for insert
with check (auth.uid() is not null);

drop policy if exists couples_update_members on public.couples;
create policy couples_update_members
on public.couples
for update
using (public.is_couple_member(id))
with check (public.is_couple_member(id));

-- COUPLE_MEMBERS
drop policy if exists couple_members_select_members on public.couple_members;
create policy couple_members_select_members
on public.couple_members
for select
using (public.is_couple_member(couple_id));

-- Allow inserting self membership (enables "create my couple" client flow).
-- Partner connect-by-email still recommended via Edge Function.
drop policy if exists couple_members_insert_self on public.couple_members;
create policy couple_members_insert_self
on public.couple_members
for insert
with check (user_id = auth.uid());

-- DIARY_ENTRIES
drop policy if exists diary_select_members on public.diary_entries;
create policy diary_select_members
on public.diary_entries
for select
using (public.is_couple_member(couple_id));

drop policy if exists diary_insert_author on public.diary_entries;
create policy diary_insert_author
on public.diary_entries
for insert
with check (public.is_couple_member(couple_id) and author_id = auth.uid());

drop policy if exists diary_update_author on public.diary_entries;
create policy diary_update_author
on public.diary_entries
for update
using (public.is_couple_member(couple_id) and author_id = auth.uid())
with check (public.is_couple_member(couple_id) and author_id = auth.uid());

drop policy if exists diary_delete_author on public.diary_entries;
create policy diary_delete_author
on public.diary_entries
for delete
using (public.is_couple_member(couple_id) and author_id = auth.uid());

-- COUPONS
drop policy if exists coupons_select_members on public.coupons;
create policy coupons_select_members
on public.coupons
for select
using (public.is_couple_member(couple_id));

drop policy if exists coupons_insert_sender on public.coupons;
create policy coupons_insert_sender
on public.coupons
for insert
with check (public.is_couple_member(couple_id) and sender_id = auth.uid());

-- Receiver can mark used / schedule
drop policy if exists coupons_update_receiver on public.coupons;
create policy coupons_update_receiver
on public.coupons
for update
using (public.is_couple_member(couple_id) and receiver_id = auth.uid())
with check (public.is_couple_member(couple_id) and receiver_id = auth.uid());

-- Sender can refund (set back to available)
drop policy if exists coupons_update_sender_refund on public.coupons;
create policy coupons_update_sender_refund
on public.coupons
for update
using (public.is_couple_member(couple_id) and sender_id = auth.uid())
with check (public.is_couple_member(couple_id) and sender_id = auth.uid());

-- ANNIVERSARIES
drop policy if exists anniversaries_select_members on public.anniversaries;
create policy anniversaries_select_members
on public.anniversaries
for select
using (public.is_couple_member(couple_id));

drop policy if exists anniversaries_insert_members on public.anniversaries;
create policy anniversaries_insert_members
on public.anniversaries
for insert
with check (public.is_couple_member(couple_id));

drop policy if exists anniversaries_update_members on public.anniversaries;
create policy anniversaries_update_members
on public.anniversaries
for update
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id));

drop policy if exists anniversaries_delete_members on public.anniversaries;
create policy anniversaries_delete_members
on public.anniversaries
for delete
using (public.is_couple_member(couple_id));

-- LOVE_NOTES
drop policy if exists love_notes_select_members on public.love_notes;
create policy love_notes_select_members
on public.love_notes
for select
using (public.is_couple_member(couple_id));

drop policy if exists love_notes_insert_from on public.love_notes;
create policy love_notes_insert_from
on public.love_notes
for insert
with check (public.is_couple_member(couple_id) and from_id = auth.uid());

