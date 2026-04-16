import { supabase } from '../supabaseClient';
import type { Profile } from './types';

const DEMO_AVATAR_MAP: Record<string, string> = {
  'gunwoo1004@duodiary.local': '/avatars/husband.png',
  'intan1717@duodiary.local': '/avatars/wife.png'
};

function getFallbackDisplayName(email: string | null): string | null {
  if (!email) return null;
  const alias = email.split('@')[0];
  if (alias === 'gunwoo1004') return '정건우';
  if (alias === 'intan1717') return '정하은';
  return alias.replace(/[-_.\d]+/g, ' ').replace(/\s+/g, ' ').trim() || alias;
}

export async function getMyProfile(): Promise<Profile | null> {
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const uid = userRes.user?.id;
  if (!uid) return null;

  const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
  if (error) throw error;
  return (data ?? null) as Profile | null;
}

export async function getProfileByEmail(email: string): Promise<Profile | null> {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', normalizedEmail)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as Profile | null;
}

export async function upsertMyProfile(input: {
  display_name?: string | null;
  photo_url?: string | null;
  email?: string | null;
}): Promise<Profile> {
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const uid = userRes.user?.id;
  if (!uid) throw new Error('Not authenticated');

  const email = input.email ?? userRes.user?.email ?? null;
  const display_name =
    input.display_name ??
    userRes.user?.user_metadata?.full_name ??
    getFallbackDisplayName(email);
  const photo_url =
    input.photo_url ??
    userRes.user?.user_metadata?.avatar_url ??
    (email ? DEMO_AVATAR_MAP[email] ?? null : null);

  const row = {
    id: uid,
    display_name,
    photo_url,
    email
  };

  const { data, error } = await supabase.from('profiles').upsert(row).select('*').single();
  if (error) throw error;
  return data as Profile;
}

export async function updateMyProfileFields(input: { phone_id?: string | null; onboarding_completed?: boolean }) {
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const uid = userRes.user?.id;
  if (!uid) throw new Error('Not authenticated');

  const payload: Record<string, any> = {};
  if ('phone_id' in input) payload.phone_id = input.phone_id;
  if ('onboarding_completed' in input) payload.onboarding_completed = input.onboarding_completed;

  const { error } = await supabase.from('profiles').update(payload).eq('id', uid);
  if (error) throw error;
}
