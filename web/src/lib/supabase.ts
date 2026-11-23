import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** Read-only anon client. Prefer build-time JSON dump in BIB-5 for Pages. */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null

export function assertSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY (see web/.env.example)',
    )
  }
  return supabase
}
