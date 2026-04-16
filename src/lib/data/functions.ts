import { supabase } from '../supabaseClient';

export async function invokeAuthedFunction<TResponse>(name: string, payload: unknown): Promise<TResponse> {
  const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
  if (sessionErr) throw sessionErr;

  const accessToken = sessionData.session?.access_token;
  if (!accessToken) throw new Error('세션이 만료되었어요. 다시 로그인해 주세요.');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      apikey: supabaseAnonKey,
      authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify(payload ?? {})
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
    throw new Error(`${name} failed (${response.status})`);
  }

  const out = (await response.json().catch(() => null)) as TResponse | null;
  if (!out) throw new Error(`Empty response from ${name}`);
  return out;
}
