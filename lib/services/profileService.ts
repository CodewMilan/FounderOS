import { store } from "@/lib/store"
import type { FounderProfile } from "@/lib/schemas/profile"
import { FounderProfileSchema, SaveFounderProfileSchema } from "@/lib/schemas/profile"

function makeId(): string {
  return `profile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export const profileService = {
  get(): FounderProfile | null {
    return store.profile.get()
  },

  save(input: unknown): FounderProfile {
    const parsed = SaveFounderProfileSchema.safeParse(input)
    if (!parsed.success) {
      throw new Error(`Invalid profile: ${parsed.error.message}`)
    }

    const now = new Date().toISOString()
    const existing = store.profile.get()
    const profile: FounderProfile = {
      ...parsed.data,
      id: existing?.id ?? makeId(),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }

    const validated = FounderProfileSchema.parse(profile)
    store.profile.set(validated)
    return validated
  },
}
