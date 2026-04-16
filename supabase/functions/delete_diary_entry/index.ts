import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

function corsHeaders(origin: string | null) {
  const o = origin && origin !== 'null' ? origin : '*';
  return {
    'access-control-allow-origin': o,
    'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info, x-supabase-api-version',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-max-age': '86400'
  };
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const headers = corsHeaders(origin);
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...headers, 'content-type': 'application/json' } });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const authHeader = req.headers.get('authorization');
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !authHeader) return new Response(JSON.stringify({ error: 'Missing required configuration or auth headers' }), { status: 400, headers: { ...headers, 'content-type': 'application/json' } });

  const authClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : '';
  const { data: uData, error: uErr } = await authClient.auth.getUser(token);
  if (uErr || !uData.user?.id) return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401, headers: { ...headers, 'content-type': 'application/json' } });

  const body = await req.json().catch(() => null) as { id?: string } | null;
  const entryId = body?.id?.trim();
  if (!entryId) return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...headers, 'content-type': 'application/json' } });

  const { data: entry, error: entryErr } = await admin.from('diary_entries').select('*').eq('id', entryId).maybeSingle();
  if (entryErr || !entry) return new Response(JSON.stringify({ error: entryErr?.message ?? 'Entry not found' }), { status: 404, headers: { ...headers, 'content-type': 'application/json' } });
  if ((entry as any).author_id !== uData.user.id) return new Response(JSON.stringify({ error: 'Only the author can delete this entry' }), { status: 403, headers: { ...headers, 'content-type': 'application/json' } });

  const { error: deleteErr } = await admin.from('diary_entries').delete().eq('id', entryId);
  if (deleteErr) return new Response(JSON.stringify({ error: deleteErr.message }), { status: 400, headers: { ...headers, 'content-type': 'application/json' } });
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...headers, 'content-type': 'application/json' } });
});
