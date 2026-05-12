"use client"

import { useRouter } from "next/navigation"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

export function SignOutButton() {
  const router = useRouter()

  async function signOut() {
    const client = createSupabaseBrowserClient()
    if (client) {
      await client.auth.signOut()
    }
    router.push("/login")
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={() => void signOut()}
      className="px-2 sm:px-3 md:px-[12px] py-1 sm:py-[6px] overflow-hidden rounded-full border border-[rgba(2,6,23,0.08)] bg-[#F7F5F3] shadow-[0px_1px_2px_rgba(55,50,47,0.06)] flex justify-center items-center"
    >
      <span className="flex flex-col justify-center text-[#37322F] text-xs md:text-[13px] font-medium leading-5 font-sans">
        Log out
      </span>
    </button>
  )
}
