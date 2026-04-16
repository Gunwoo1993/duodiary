-- DuoDiary Initial Setup
-- Run this once after schema.sql and rls.sql
-- This creates: demo users, profiles, couple, couple_members, storage policy

-- 1. Create demo users (gunwoo1004, intan1717)
-- Note: In real Supabase, use the Auth dashboard "Create User" button
-- For local testing, use test credentials: password = "demo1234"

-- 2. Assuming users are already created with:
--   gunwoo1004@duodiary.local (uid: 'demo-user')
--   intan1717@duodiary.local   (uid: 'partner-user')

-- Create profiles
insert into public.profiles (id, display_name, email, photo_url)
values
  ('demo-user', '정건우', 'gunwoo1004@duodiary.local', '/avatars/husband.png'),
  ('partner-user', '정하은', 'intan1717@duodiary.local', '/avatars/wife.png')
on conflict (id) do update set
  display_name = excluded.display_name,
  email = excluded.email,
  photo_url = excluded.photo_url;

-- Create demo couple
insert into public.couples (id, anniversary_date)
values ('demo-couple', '2015-08-15')
on conflict (id) do nothing;

-- Add couple members
insert into public.couple_members (couple_id, user_id, role)
values
  ('demo-couple', 'demo-user', 'husband'),
  ('demo-couple', 'partner-user', 'wife')
on conflict (couple_id, user_id) do nothing;

-- Create initial anniversaries
insert into public.anniversaries (couple_id, title, date)
values
  ('demo-couple', '결혼일', '2015-08-15'),
  ('demo-couple', '와이프 생일', '1999-04-17'),
  ('demo-couple', '하은이 탄생일', '2025-10-02');

-- 3. Create storage bucket for diary media (if not exists)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'diary_media',
  'diary_media',
  true,
  52428800,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'video/webm'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Diary media public read" on storage.objects;
create policy "Diary media public read"
on storage.objects
for select
using (bucket_id = 'diary_media');

drop policy if exists "Diary media member upload" on storage.objects;
create policy "Diary media member upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'diary_media'
);

drop policy if exists "Diary media member delete" on storage.objects;
create policy "Diary media member delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'diary_media'
);
