/**
 * Server-side Supabase client.
 * Uses the service role key — never import this in client components.
 *
 * Returns null when SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY are not set,
 * so all callers can fall back to the in-memory store gracefully.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let _client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) return null

  if (!_client) {
    _client = createClient(url, key, {
      auth: { persistSession: false },
    })
  }

  return _client
}
