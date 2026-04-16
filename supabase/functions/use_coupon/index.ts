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

type Payload = {
  id?: string;
  scheduled_for?: string;
};

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
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const authHeader = req.headers.get('authorization');

  if (!supabaseUrl || !anonKey || !serviceRoleKey || !authHeader) {
    return new Response(JSON.stringify({ error: 'Missing required configuration or auth headers' }), {
      status: 400,
      headers: { ...headers, 'content-type': 'application/json' }
    });
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
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

  const { data: uData, error: uErr } = await authClient.auth.getUser(token);
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
    body = null;
  }

  const couponId = body?.id?.trim();
  const scheduledFor = body?.scheduled_for?.trim();
  const userId = uData.user.id;
  if (!couponId || !scheduledFor) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { ...headers, 'content-type': 'application/json' }
    });
  }

  const { data: coupon, error: couponErr } = await admin
    .from('coupons')
    .select('*')
    .eq('id', couponId)
    .maybeSingle();
  if (couponErr || !coupon) {
    return new Response(JSON.stringify({ error: couponErr?.message ?? 'Coupon not found' }), {
      status: 404,
      headers: { ...headers, 'content-type': 'application/json' }
    });
  }

  if ((coupon as any).receiver_id !== userId) {
    return new Response(JSON.stringify({ error: 'Only the receiver can use this coupon' }), {
      status: 403,
      headers: { ...headers, 'content-type': 'application/json' }
    });
  }

  const { data: updated, error: updateErr } = await admin
    .from('coupons')
    .update({
      status: 'used',
      scheduled_for: scheduledFor,
      used_at: new Date().toISOString(),
    })
    .eq('id', couponId)
    .select('*')
    .single();

  if (updateErr || !updated) {
    return new Response(JSON.stringify({ error: updateErr?.message ?? 'Failed to use coupon' }), {
      status: 400,
      headers: { ...headers, 'content-type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ coupon: updated }), {
    status: 200,
    headers: { ...headers, 'content-type': 'application/json' }
  });
});
