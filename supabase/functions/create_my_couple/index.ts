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

type Payload = { anniversary_date?: string | null };

serve(async (req) => {
  const origin = req.headers.get('origin');
  const headers = corsHeaders(origin);

  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...headers, 'content-type': 'application/json' }
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const authHeader = req.headers.get('authorization');

  if (!supabaseUrl || !serviceRoleKey || !authHeader) {
    return new Response(JSON.stringify({ error: 'Missing required configuration or auth headers' }), {
      status: 400,
      headers: { ...headers, 'content-type': 'application/json' }
    });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });

  const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return new Response(JSON.stringify({ error: 'Missing bearer token' }), {
      status: 401,
      headers: { ...headers, 'content-type': 'application/json' }
    });
  }

  const { data: uData, error: uErr } = await admin.auth.getUser(token);
  if (uErr || !uData.user?.id) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { ...headers, 'content-type': 'application/json' }
    });
  }

  let body: Payload | null = null;
  try {
    body = (await req.json()) as Payload;
  } catch {
    body = {};
  }

  const uid = uData.user.id;
  const anniversaryDate = body?.anniversary_date ?? null;

  // Ensure profile exists for FK constraints.
  const { error: profileErr } = await admin.from('profiles').upsert({
    id: uid,
    email: uData.user.email ?? null,
    display_name: (uData.user.user_metadata?.full_name as string | undefined) ?? null,
    photo_url: (uData.user.user_metadata?.avatar_url as string | undefined) ?? null
  });
  if (profileErr) {
    return new Response(JSON.stringify({ error: profileErr.message }), {
      status: 400,
      headers: { ...headers, 'content-type': 'application/json' }
    });
  }

  const { data: couple, error: coupleErr } = await admin
    .from('couples')
    .insert({ anniversary_date: anniversaryDate })
    .select('*')
    .single();
  if (coupleErr || !couple) {
    return new Response(JSON.stringify({ error: coupleErr?.message ?? 'Failed to create couple' }), {
      status: 400,
      headers: { ...headers, 'content-type': 'application/json' }
    });
  }

  const { error: memberErr } = await admin.from('couple_members').insert({
    couple_id: (couple as any).id,
    user_id: uid
  });
  if (memberErr) {
    return new Response(JSON.stringify({ error: memberErr.message }), {
      status: 400,
      headers: { ...headers, 'content-type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ couple }), {
    status: 200,
    headers: { ...headers, 'content-type': 'application/json' }
  });
});

