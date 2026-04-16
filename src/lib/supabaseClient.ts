import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const isSupabaseEnvConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Do not crash the whole app during module import when env vars are missing.
// This lets the app fall back to demo/login mode instead of rendering a blank page.
const fallbackUrl = 'https://placeholder.supabase.co';
const fallbackAnonKey = 'placeholder-anon-key';

export const supabase = createClient(isSupabaseEnvConfigured ? supabaseUrl! : fallbackUrl, isSupabaseEnvConfigured ? supabaseAnonKey! : fallbackAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
