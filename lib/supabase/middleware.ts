import { createServerClient } from "@supabase/ssr"
import type { CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { isAuthConfigured } from "@/lib/supabase/env"

type CookieToSet = { name: string; value: string; options: CookieOptions }

function isSlackApi(pathname: string) {
  return pathname.startsWith("/api/slack")
}

function copyAuthCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach(({ name, value }) => {
    to.cookies.set(name, value)
  })
}

/**
 * Refreshes the Supabase session from cookies and enforces auth when configured.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  if (!isAuthConfigured()) {
    return response
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  if (pathname.startsWith("/login")) {
    if (user) {
      return NextResponse.redirect(new URL("/app", request.url))
    }
    return response
  }

  if (pathname.startsWith("/app") && !user) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (pathname.startsWith("/api") && !isSlackApi(pathname) && !user) {
    const denied = NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    copyAuthCookies(response, denied)
    return denied
  }

  return response
}
