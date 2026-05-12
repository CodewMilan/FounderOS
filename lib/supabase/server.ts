import { createServerClient } from "@supabase/ssr"
import type { CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

import { isAuthConfigured } from "@/lib/supabase/env"

type CookieToSet = { name: string; value: string; options: CookieOptions }

/** Server-side Supabase client (Route Handlers, Server Components). Returns null if env is missing. */
export async function createSupabaseServerClient() {
  if (!isAuthConfigured()) return null
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const cookieStore = cookies()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          /* Server Components cannot always set cookies */
        }
      },
    },
  })
}
