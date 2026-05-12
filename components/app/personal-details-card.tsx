"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { UserPersonalProfile } from "@/lib/schemas/user-personal-profile"

export function PersonalDetailsCard() {
  const [authConfigured, setAuthConfigured] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [jobTitle, setJobTitle] = useState("")
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/user-profile")
      .then((r) => r.json())
      .then(
        (data: {
          profile: UserPersonalProfile | null
          authConfigured?: boolean
          error?: string
        }) => {
          if (data.authConfigured === false) {
            setAuthConfigured(false)
            return
          }
          if (data.profile) {
            setFullName(data.profile.fullName ?? "")
            setPhone(data.profile.phone ?? "")
            setJobTitle(data.profile.jobTitle ?? "")
          }
        },
      )
      .catch(() => setMessage("Could not load your details."))
      .finally(() => setLoading(false))
  }, [])

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setSaving(true)
    try {
      const res = await fetch("/api/user-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim() || null,
          phone: phone.trim() || null,
          jobTitle: jobTitle.trim() || null,
        }),
      })
      const data = (await res.json()) as { profile?: UserPersonalProfile; error?: string }
      if (!res.ok) {
        setMessage(data.error ?? "Save failed")
        return
      }
      if (data.profile) {
        setMessage("Saved.")
      }
    } catch {
      setMessage("Save failed")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-[rgba(55,50,47,0.12)] bg-white shadow-[0px_0px_0px_0.9px_rgba(0,0,0,0.06)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-[#37322F]">Personal details</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-[#605A57]">Loading…</CardContent>
      </Card>
    )
  }

  if (!authConfigured) {
    return (
      <Card className="border-[rgba(55,50,47,0.12)] bg-white shadow-[0px_0px_0px_0.9px_rgba(0,0,0,0.06)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-[#37322F]">Personal details</CardTitle>
          <CardDescription className="text-[#605A57]">
            Configure Supabase in <span className="font-mono text-xs">.env.local</span> to store your account profile in
            the database.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border-[rgba(55,50,47,0.12)] bg-white shadow-[0px_0px_0px_0.9px_rgba(0,0,0,0.06)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-[#37322F]">Personal details</CardTitle>
        <CardDescription className="text-[#605A57]">
          Your name and contact info (stored in Supabase, tied to your login).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSave} className="flex flex-col gap-3 max-w-md">
          <div className="flex flex-col gap-1">
            <label htmlFor="pd-full-name" className="text-xs font-medium text-[#37322F]">
              Full name
            </label>
            <input
              id="pd-full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-10 rounded-lg border border-[rgba(2,6,23,0.08)] bg-white px-3 text-sm text-[#37322F] shadow-[0px_1px_2px_rgba(55,50,47,0.06)] outline-none ring-[#37322F]/15 focus:ring-[3px]"
              placeholder="Ada Lovelace"
              autoComplete="name"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="pd-phone" className="text-xs font-medium text-[#37322F]">
              Phone
            </label>
            <input
              id="pd-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-10 rounded-lg border border-[rgba(2,6,23,0.08)] bg-white px-3 text-sm text-[#37322F] shadow-[0px_1px_2px_rgba(55,50,47,0.06)] outline-none ring-[#37322F]/15 focus:ring-[3px]"
              placeholder="+1 …"
              autoComplete="tel"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="pd-job" className="text-xs font-medium text-[#37322F]">
              Job title
            </label>
            <input
              id="pd-job"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="h-10 rounded-lg border border-[rgba(2,6,23,0.08)] bg-white px-3 text-sm text-[#37322F] shadow-[0px_1px_2px_rgba(55,50,47,0.06)] outline-none ring-[#37322F]/15 focus:ring-[3px]"
              placeholder="Founder & CEO"
              autoComplete="organization-title"
            />
          </div>
          {message && <p className="text-sm text-[#49423D]">{message}</p>}
          <button
            type="submit"
            disabled={saving}
            className="relative mt-1 h-10 w-fit min-w-[120px] rounded-full bg-[#37322F] px-5 text-sm font-medium text-white shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save details"}
          </button>
        </form>
      </CardContent>
    </Card>
  )
}
