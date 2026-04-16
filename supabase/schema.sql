-- Supabase schema for DuoDiary
-- Apply in Supabase SQL Editor (order matters).

-- Extensions
create extension if not exists "pgcrypto";

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  photo_url text,
  email text,
  created_at timestamptz not null default now()
);

-- Couples
create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  anniversary_date date,
  created_at timestamptz not null default now()
);

-- Couple membership (many-to-many)
create table if not exists public.couple_members (
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text,
  created_at timestamptz not null default now(),
  primary key (couple_id, user_id)
);

create index if not exists couple_members_user_id_idx on public.couple_members(user_id);

-- Diary entries
create table if not exists public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  content text not null,
  mood text not null,
  tags text[] not null default '{}',
  is_favorite boolean not null default false,
  photo_urls text[] not null default '{}',
  entry_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists diary_entries_couple_entry_at_idx on public.diary_entries(couple_id, entry_at desc);
create index if not exists diary_entries_author_id_idx on public.diary_entries(author_id);

-- Coupons (gifts)
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  title text not null,
  description text not null,
  message text,
  sender_id uuid not null references public.profiles(id) on delete restrict,
  receiver_id uuid not null references public.profiles(id) on delete restrict,
  status text not null check (status in ('available', 'used')),
  scheduled_for timestamptz,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists coupons_couple_created_at_idx on public.coupons(couple_id, created_at desc);
create index if not exists coupons_receiver_id_idx on public.coupons(receiver_id);
create index if not exists coupons_sender_id_idx on public.coupons(sender_id);

-- Anniversaries
create table if not exists public.anniversaries (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  title text not null,
  date date not null,
  created_at timestamptz not null default now()
);

create index if not exists anniversaries_couple_date_idx on public.anniversaries(couple_id, date asc);

-- Love notes (stories)
create table if not exists public.love_notes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  from_id uuid not null references public.profiles(id) on delete restrict,
  to_id uuid references public.profiles(id) on delete set null,
  emotion text,
  topic text,
  text text not null,
  created_at timestamptz not null default now()
);

create index if not exists love_notes_couple_created_at_idx on public.love_notes(couple_id, created_at desc);

