-- Supabase Storage setup for DuoDiary media uploads
-- Run this in Supabase SQL Editor once for the current project.

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
