// Supabase Edge Function: login_by_email
// WARNING: This intentionally bypasses email ownership verification.
// Anyone who knows an email can obtain a valid session for that email.

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

type Payload = { email?: string; redirectTo?: string };

serve(async (req) => {
  const origin = req.headers.get('origin');
  const headers = corsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...headers, 'content-type': 'application/json' }
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY' }), {
      status: 500,
      headers: { ...headers, 'content-type': 'application/json' }
    });
  }

  let body: Payload | null = null;
  try {
    body = (await req.json()) as Payload;
  } catch {
    body = null;
  }

  const email = (body?.email ?? '').trim().toLowerCase();
  const redirectTo = (body?.redirectTo ?? origin ?? '').trim();

  if (!email) {
    return new Response(JSON.stringify({ error: 'Email required' }), {
      status: 400,
      headers: { ...headers, 'content-type': 'application/json' }
    });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });

  // Ensure the user exists (best-effort). If user already exists, this will error and we ignore.
  try {
    await admin.auth.admin.createUser({ email, email_confirm: true });
  } catch {
    // ignore
  }

  // Generate a magic link and return OTP so the client can verify directly.
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: redirectTo ? { redirectTo } : undefined
  });

  if (error || !data?.properties?.email_otp) {
    return new Response(JSON.stringify({ error: error?.message ?? 'Failed to generate link' }), {
      status: 400,
      headers: { ...headers, 'content-type': 'application/json' }
    });
  }

  return new Response(
    JSON.stringify({
      email,
      email_otp: data.properties.email_otp
    }),
    {
    status: 200,
    headers: { ...headers, 'content-type': 'application/json' }
    }
  );
});

