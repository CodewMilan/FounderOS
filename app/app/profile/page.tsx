"use client"

import { useState, useEffect } from "react"
import { FounderProfileForm } from "@/components/app/founder-profile-form"
import { FounderProfileView } from "@/components/app/founder-profile-view"
import { Skeleton } from "@/components/ui/skeleton"
import type { FounderProfile } from "@/lib/schemas/profile"
import { User } from "lucide-react"
import { PageHeading } from "@/components/app/page-heading"
import { PersonalDetailsCard } from "@/components/app/personal-details-card"

export default function ProfilePage() {
  const [profile, setProfile] = useState<FounderProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data: { profile: FounderProfile | null }) => {
        setProfile(data.profile)
        // If no profile, show form immediately
        if (!data.profile) setEditing(true)
      })
      .catch(() => setEditing(true))
      .finally(() => setLoading(false))
  }, [])

  function handleSaved(saved: FounderProfile) {
    setProfile(saved)
    setEditing(false)
  }

  return (
    <div data-testid="profile-page" className="flex flex-col gap-6 max-w-3xl">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <User className="size-4 text-[#605A57]" />
          <PageHeading>Founder Profile</PageHeading>
        </div>
        <p className="text-sm text-[#605A57]">
          FounderOS uses this to auto-fetch competitors, suggest funding matches, and personalise
          your workflows.
        </p>
      </div>

      <PersonalDetailsCard />

      {loading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>
      ) : editing || !profile ? (
        <FounderProfileForm initialProfile={profile} onSaved={handleSaved} />
      ) : (
        <FounderProfileView profile={profile} onEdit={() => setEditing(true)} />
      )}
    </div>
  )
}
