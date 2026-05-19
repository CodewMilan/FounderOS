"use client"

import { useEffect, useMemo, useState } from "react"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

type AuthUiState = { ready: boolean; signedIn: boolean }

/**
 * Tracks whether a Supabase browser session exists (for marketing / nav UI).
 * When there is no browser client (env missing), `ready` is true immediately so signed-out UI can render.
 * When a client exists, `ready` stays false until the first `getSession` resolves — avoids flashing "Log in" for signed-in users.
 */
export function useSupabaseSignedIn(): AuthUiState {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  const [state, setState] = useState<AuthUiState>(() =>
    supabase ? { ready: false, signedIn: false } : { ready: true, signedIn: false },
  )

  useEffect(() => {
    if (!supabase) return

    void supabase.auth.getSession().then(({ data: { session } }) => {
      setState({ ready: true, signedIn: !!session })
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((prev) => ({ ...prev, signedIn: !!session }))
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return state
}
