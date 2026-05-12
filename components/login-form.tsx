"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

type Step = "email" | "otp"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [otpHint, setOtpHint] = useState(false)

  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const authError = searchParams.get("error")

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setOtpHint(false)
    if (!supabase) {
      setError("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.")
      return
    }
    setLoading(true)
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: origin ? `${origin}/auth/callback` : undefined,
      },
    })
    setLoading(false)
    if (otpError) {
      setError(otpError.message)
      return
    }
    setStep("otp")
    setOtpHint(true)
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!supabase) {
      setError("Supabase is not configured.")
      return
    }
    const token = otp.replace(/\s/g, "")
    if (token.length < 6) {
      setError("Enter the code from your email (usually 6 digits).")
      return
    }
    setLoading(true)
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token,
      type: "email",
    })
    setLoading(false)
    if (verifyError) {
      setError(verifyError.message)
      return
    }
    router.push("/app")
    router.refresh()
  }

  return (
    <div className="w-full max-w-[400px] rounded-[9px] border border-[rgba(55,50,47,0.12)] bg-white p-6 sm:p-8 shadow-[0px_0px_0px_0.9px_rgba(0,0,0,0.08)]">
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="font-serif text-2xl font-normal leading-tight text-[#37322F] sm:text-3xl">Sign in</h1>
        <p className="text-sm font-medium leading-5 text-[rgba(55,50,47,0.80)]">
          {step === "email"
            ? "Enter your work email. We will send you a one-time sign-in code."
            : `We sent a code to ${email}. Enter it below to continue.`}
        </p>
      </div>

      {!supabase && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-[rgba(55,50,47,0.12)] bg-[#F7F5F3] px-3 py-2 text-sm text-[#49423D]"
        >
          Add <span className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</span> and{" "}
          <span className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</span> to{" "}
          <span className="font-mono text-xs">.env.local</span>, then restart the dev server.
        </div>
      )}

      {(authError === "auth" || error) && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-[rgba(55,50,47,0.12)] bg-[#F7F5F3] px-3 py-2 text-sm text-[#49423D]"
        >
          {error ??
            "We could not complete sign-in. Check your Supabase email template includes a code ({{ .Token }}) and redirect URLs include /auth/callback."}
        </div>
      )}

      {otpHint && step === "otp" && (
        <div className="mb-4 rounded-lg border border-[rgba(55,50,47,0.08)] bg-[#F7F5F3] px-3 py-2 text-xs font-medium text-[#49423D]">
          Didn&apos;t get an email? Check spam, or wait a minute before requesting again.
        </div>
      )}

      {step === "email" ? (
        <form onSubmit={sendOtp} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-email" className="text-xs font-medium leading-4 text-[#37322F]">
              Email
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              className="h-11 w-full rounded-lg border border-[rgba(2,6,23,0.08)] bg-white px-3 text-sm font-medium text-[#37322F] shadow-[0px_1px_2px_rgba(55,50,47,0.06)] outline-none ring-[#37322F]/15 placeholder:text-[rgba(55,50,47,0.45)] focus:ring-[3px]"
              placeholder="you@company.com"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="relative mt-1 flex h-11 w-full items-center justify-center overflow-hidden rounded-full bg-[#37322F] px-4 text-sm font-medium leading-5 text-white shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset] disabled:opacity-60"
          >
            <span className="pointer-events-none absolute inset-x-0 top-0 h-[41px] bg-gradient-to-b from-[rgba(255,255,255,0)] to-[rgba(0,0,0,0.10)] mix-blend-multiply" />
            {loading ? "Sending…" : "Send sign-in code"}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyOtp} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-otp" className="text-xs font-medium leading-4 text-[#37322F]">
              One-time code
            </label>
            <input
              id="login-otp"
              name="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={otp}
              onChange={(ev) => setOtp(ev.target.value)}
              className="h-11 w-full rounded-lg border border-[rgba(2,6,23,0.08)] bg-white px-3 text-center font-mono text-lg tracking-[0.25em] text-[#37322F] shadow-[0px_1px_2px_rgba(55,50,47,0.06)] outline-none ring-[#37322F]/15 focus:ring-[3px]"
              placeholder="000000"
              maxLength={12}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="relative flex h-11 w-full items-center justify-center overflow-hidden rounded-full bg-[#37322F] px-4 text-sm font-medium leading-5 text-white shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset] disabled:opacity-60"
          >
            <span className="pointer-events-none absolute inset-x-0 top-0 h-[41px] bg-gradient-to-b from-[rgba(255,255,255,0)] to-[rgba(0,0,0,0.10)] mix-blend-multiply" />
            {loading ? "Signing in…" : "Verify and continue"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("email")
              setOtp("")
              setError(null)
              setOtpHint(false)
            }}
            className="text-center text-xs font-medium text-[#37322F] underline decoration-[rgba(55,50,47,0.25)] underline-offset-2"
          >
            Use a different email
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-xs font-medium text-[rgba(49,45,43,0.80)]">
        <Link href="/" className="text-[#37322F] underline decoration-[rgba(55,50,47,0.25)] underline-offset-2 hover:decoration-[#37322F]">
          Back to home
        </Link>
      </p>
    </div>
  )
}
