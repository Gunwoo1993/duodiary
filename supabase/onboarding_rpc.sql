-- Apply AFTER schema.sql / rls.sql
-- Adds couple connect code + onboarding fields + secure RPC to join/create couple.

-- 1) Columns
alter table public.couples
  add column if not exists connect_code text;

create unique index if not exists couples_connect_code_uq
  on public.couples(connect_code)
  where connect_code is not null;

alter table public.profiles
  add column if not exists phone_id text,
  add column if not exists onboarding_completed boolean not null default false;

create index if not exists profiles_phone_id_idx on public.profiles(phone_id);

-- 2) RPC: join or create couple by code + set/validate anniversary date
-- SECURITY DEFINER so it can lookup by connect_code without weakening RLS.
create or replace function public.join_or_create_couple_by_code(p_connect_code text, p_anniversary_date date)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_couple_id uuid;
  v_existing_date date;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  if p_connect_code is null or length(trim(p_connect_code)) < 8 then
    raise exception 'Invalid connect code';
  end if;
  if p_anniversary_date is null then
    raise exception 'Anniversary date required';
  end if;

  -- Find couple by connect_code (if any)
  select c.id, c.anniversary_date into v_couple_id, v_existing_date
  from public.couples c
  where c.connect_code = trim(p_connect_code)
  limit 1;

  if v_couple_id is null then
    -- Create new couple
    insert into public.couples(connect_code, anniversary_date)
    values (trim(p_connect_code), p_anniversary_date)
    returning id into v_couple_id;
  else
    -- Validate or set anniversary date
    if v_existing_date is null then
      update public.couples set anniversary_date = p_anniversary_date where id = v_couple_id;
    elsif v_existing_date <> p_anniversary_date then
      raise exception 'Wrong anniversary date';
    end if;
  end if;

  -- Add membership (idempotent)
  insert into public.couple_members(couple_id, user_id)
  values (v_couple_id, v_uid)
  on conflict do nothing;

  -- Mark profile fields for convenience (RLS allows self-update)
  update public.profiles
    set phone_id = trim(p_connect_code),
        onboarding_completed = true
  where id = v_uid;

  return v_couple_id;
end;
$$;

-- Allow authenticated users to execute RPC
revoke all on function public.join_or_create_couple_by_code(text, date) from public;
grant execute on function public.join_or_create_couple_by_code(text, date) to authenticated;

