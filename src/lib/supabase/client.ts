import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '')
  .trim()
  .replace(/\/+$/, '');
const supabaseAnonKey = (
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''
).trim();

function getSupabaseConfigError() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return 'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.';
  }

  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.endsWith('.supabase.co')) {
    return 'Supabase URL must start with https:// and end with .supabase.co.';
  }

  if (supabaseAnonKey.startsWith('Bearer ')) {
    return 'Supabase anon key must not include a Bearer prefix.';
  }

  if (
    !supabaseAnonKey.startsWith('eyJ') &&
    !supabaseAnonKey.startsWith('sb_publishable')
  ) {
    return 'Supabase anon key must be a legacy anon JWT or an sb_publishable key.';
  }

  return null;
}

export const supabaseConfigError = getSupabaseConfigError();

export const supabaseConfigured = supabaseConfigError === null;

export const supabase = supabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
