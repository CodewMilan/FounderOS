import Link from "next/link"
import type { Metadata } from "next"
import { Suspense } from "react"
import { LoginForm } from "@/components/login-form"

export const metadata: Metadata = {
  title: "Sign in — FounderOS",
  description: "Sign in to FounderOS with your Supabase account.",
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-start overflow-x-hidden bg-[#F7F5F3]">
      <div className="relative flex w-full max-w-none flex-col items-center px-4 sm:px-6 md:px-8 lg:w-[1060px] lg:max-w-[1060px] lg:px-0">
        <div className="absolute left-4 top-0 z-0 h-full w-px bg-[rgba(55,50,47,0.12)] shadow-[1px_0px_0px_white] sm:left-6 md:left-8 lg:left-0" />
        <div className="absolute right-4 top-0 z-0 h-full w-px bg-[rgba(55,50,47,0.12)] shadow-[1px_0px_0px_white] sm:right-6 md:right-8 lg:right-0" />

        <div className="relative z-10 flex w-full flex-col items-center border-b border-[rgba(55,50,47,0.06)] pt-[9px]">
          <div className="absolute left-0 top-0 z-20 flex h-12 w-full items-center justify-center px-6 sm:h-14 sm:px-8 md:h-16 md:px-12 lg:h-[84px] lg:px-0">
            <div className="absolute left-0 top-6 h-0 w-full border-t border-[rgba(55,50,47,0.12)] shadow-[0px_1px_0px_white] sm:top-7 md:top-8 lg:top-[42px]" />
            <div className="relative z-30 flex h-10 w-full max-w-[calc(100%-32px)] items-center justify-between overflow-hidden rounded-[50px] border border-[rgba(2,6,23,0.08)] bg-[#F7F5F3] py-1.5 pl-3 pr-2 shadow-[0px_0px_0px_2px_white] backdrop-blur-sm sm:h-11 sm:max-w-[calc(100%-48px)] sm:py-2 sm:pl-4 sm:pr-3 md:h-12 md:max-w-[calc(100%-64px)] md:px-4 lg:max-w-[700px] lg:w-[700px]">
              <Link href="/" className="text-sm font-medium leading-5 text-[#2F3037] sm:text-base md:text-lg lg:text-xl">
                FounderOS
              </Link>
              <Link
                href="/"
                className="flex items-center justify-center overflow-hidden rounded-full bg-white px-2 py-1 shadow-[0px_1px_2px_rgba(55,50,47,0.12)] sm:px-3 sm:py-[6px] md:px-[14px]"
              >
                <span className="text-xs font-medium leading-5 text-[#37322F] md:text-[13px]">Home</span>
              </Link>
            </div>
          </div>

          <div className="flex w-full flex-col items-center px-2 pb-16 pt-28 sm:px-4 sm:pb-20 sm:pt-32 md:pt-36 lg:pt-40">
            <Suspense fallback={<div className="h-[320px] w-full max-w-[400px] animate-pulse rounded-[9px] bg-white/60" />}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
