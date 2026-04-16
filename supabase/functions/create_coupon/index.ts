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
  couple_id?: string;
  title?: string;
  description?: string;
  message?: string | null;
  receiver_id?: string;
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

  const senderId = uData.user.id;
  const coupleId = body?.couple_id?.trim();
  const receiverId = body?.receiver_id?.trim();
  const title = body?.title?.trim();
  const description = body?.description?.trim();
  const message = body?.message?.trim() || null;

  if (!coupleId || !receiverId || !title || !description) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { ...headers, 'content-type': 'application/json' }
    });
  }

  const { data: memberships, error: membershipErr } = await admin
    .from('couple_members')
    .select('user_id')
    .eq('couple_id', coupleId);
  if (membershipErr) {
    return new Response(JSON.stringify({ error: membershipErr.message }), {
      status: 400,
      headers: { ...headers, 'content-type': 'application/json' }
    });
  }

  const memberIds = new Set((memberships ?? []).map((row) => row.user_id as string));
  if (!memberIds.has(senderId)) {
    return new Response(JSON.stringify({ error: 'Sender is not part of this family space' }), {
      status: 403,
      headers: { ...headers, 'content-type': 'application/json' }
    });
  }
  if (!memberIds.has(receiverId)) {
    return new Response(JSON.stringify({ error: 'Receiver is not part of this family space' }), {
      status: 400,
      headers: { ...headers, 'content-type': 'application/json' }
    });
  }

  const { data: coupon, error: couponErr } = await admin
    .from('coupons')
    .insert({
      couple_id: coupleId,
      title,
      description,
      message,
      sender_id: senderId,
      receiver_id: receiverId,
      status: 'available',
    })
    .select('*')
    .single();

  if (couponErr || !coupon) {
    return new Response(JSON.stringify({ error: couponErr?.message ?? 'Failed to create coupon' }), {
      status: 400,
      headers: { ...headers, 'content-type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ coupon }), {
    status: 200,
    headers: { ...headers, 'content-type': 'application/json' }
  });
});
