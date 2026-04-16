import { supabase } from '../supabaseClient';
import type { Couple, Profile } from './types';
import { invokeAuthedFunction } from './functions';
import { upsertMyProfile } from './profiles';

export async function getMyCouple(): Promise<Couple | null> {
  // Uses membership table; RLS ensures user can only see their couples.
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const uid = userRes.user?.id;
  if (!uid) return null;

  const { data: member, error: memberErr } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', uid)
    .limit(1)
    .maybeSingle();
  if (memberErr) throw memberErr;
  if (!member?.couple_id) return null;

  const { data: couple, error: coupleErr } = await supabase.from('couples').select('*').eq('id', member.couple_id).single();
  if (coupleErr) throw coupleErr;
  return couple as Couple;
}

export async function updateAnniversaryDate(coupleId: string, date: string | null) {
  const out = await invokeAuthedFunction<{ couple?: Couple; error?: string }>('update_anniversary_date', {
    couple_id: coupleId,
    anniversary_date: date,
  });
  if (!out?.couple) throw new Error(out?.error || 'Failed to update anniversary');
}

export async function createMyCouple(params?: { anniversary_date?: string | null }): Promise<Couple> {
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const uid = userRes.user?.id;
  if (!uid) throw new Error('Not authenticated');

  // Ensure profile row exists before relation inserts.
  await upsertMyProfile({});

  // Force-refresh session to avoid stale/invalid JWT on function invoke.
  const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession();
  if (refreshErr) {
    const msg = String((refreshErr as any)?.message ?? refreshErr ?? '').toLowerCase();
    if (msg.includes('invalid jwt')) {
      await supabase.auth.signOut();
      throw new Error('세션이 깨졌어요. 이메일로 다시 로그인해 주세요.');
    }
    throw refreshErr;
  }
  if (!refreshed.session?.access_token) {
    throw new Error('세션이 만료되었어요. 이메일로 다시 로그인해 주세요.');
  }

  // Use service-role Edge Function with explicit user access token.
  // This avoids accidentally sending API-key tokens as bearer auth.
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/create_my_couple`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      apikey: supabaseAnonKey,
      authorization: `Bearer ${refreshed.session.access_token}`
    },
    body: JSON.stringify({ anniversary_date: params?.anniversary_date ?? null })
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    if (text) {
      try {
        const parsed = JSON.parse(text) as { error?: string; message?: string };
        throw new Error(parsed.error || parsed.message || text);
      } catch {
        throw new Error(text);
      }
    }
    throw new Error(`create_my_couple failed (${response.status})`);
  }

  const out = (await response.json().catch(() => null)) as { couple?: Couple; error?: string } | null;
  if (!out?.couple) throw new Error(out?.error || 'Failed to create couple');
  return out.couple;
}

export async function getPartnerProfile(coupleId: string): Promise<Profile | null> {
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const uid = userRes.user?.id;
  if (!uid) return null;

  const { data: members, error } = await supabase
    .from('couple_members')
    .select('user_id')
    .eq('couple_id', coupleId);
  if (error) throw error;

  const partnerId = (members ?? []).map((m: any) => m.user_id).find((id: string) => id && id !== uid);
  if (!partnerId) return null;

  const { data: profile, error: pErr } = await supabase.from('profiles').select('*').eq('id', partnerId).maybeSingle();
  if (pErr) throw pErr;
  return (profile ?? null) as Profile | null;
}

export async function joinOrCreateCoupleByCode(params: { connectCode: string; anniversaryDate: string }) {
  const { data, error } = await supabase.rpc('join_or_create_couple_by_code', {
    p_connect_code: params.connectCode,
    p_anniversary_date: params.anniversaryDate
  });
  if (error) throw error;
  return data as string; // couple uuid
}
