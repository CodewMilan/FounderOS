import { store } from "@/lib/store"
import { getSupabaseClient } from "@/lib/services/supabaseClient"
import type { FounderProfile } from "@/lib/schemas/profile"
import { FounderProfileSchema, SaveFounderProfileSchema } from "@/lib/schemas/profile"

function makeId(): string {
  return `profile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// ─── Supabase row → FounderProfile ────────────────────────────────────────────

/**
 * Supabase returns timestamptz as "2026-05-10T09:50:00+00:00".
 * Zod's z.string().datetime() requires the "Z" suffix format.
 * Always convert to ISO 8601 UTC ("Z") before parsing.
 */
function toUtcIso(value: unknown): string {
  return new Date(String(value)).toISOString()
}

function rowToProfile(row: Record<string, unknown>): FounderProfile {
  return FounderProfileSchema.parse({
    id: row.id,
    companyName: row.company_name,
    websiteUrl: row.website_url ?? "",
    description: row.description,
    industry: row.industry,
    targetGeographies: row.target_geographies,
    targetCustomer: row.target_customer,
    stage: row.stage,
    pricingModel: row.pricing_model,
    pricingPageUrl: row.pricing_page_url ?? "",
    knownCompetitors: row.known_competitors ?? "",
    problemSolved: row.problem_solved ?? "",
    keyDifferentiator: row.key_differentiator ?? "",
    createdAt: toUtcIso(row.created_at),
    updatedAt: toUtcIso(row.updated_at),
  })
}

// ─── profileService ───────────────────────────────────────────────────────────

export const profileService = {
  async get(): Promise<FounderProfile | null> {
    const supabase = getSupabaseClient()

    if (supabase) {
      const { data, error } = await supabase
        .from("founder_profiles")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error("[profileService] Supabase get error:", error.message)
        // Fall through to in-memory store
      } else if (data) {
        try {
          const profile = rowToProfile(data as Record<string, unknown>)
          // Sync back into the in-memory store so the rest of the app can read it
          store.profile.set(profile)
          return profile
        } catch (parseErr) {
          console.error("[profileService] Failed to parse Supabase row:", parseErr)
          // Fall through to in-memory store
        }
      } else {
        return null
      }
    }

    return store.profile.get()
  },

  async save(input: unknown): Promise<FounderProfile> {
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

    const supabase = getSupabaseClient()

    if (supabase) {
      const { error } = await supabase.from("founder_profiles").upsert(
        {
          id: validated.id,
          company_name: validated.companyName,
          website_url: validated.websiteUrl ?? null,
          description: validated.description,
          industry: validated.industry,
          target_geographies: validated.targetGeographies,
          target_customer: validated.targetCustomer,
          stage: validated.stage,
          pricing_model: validated.pricingModel,
          pricing_page_url: validated.pricingPageUrl ?? null,
          known_competitors: validated.knownCompetitors ?? null,
          problem_solved: validated.problemSolved ?? null,
          key_differentiator: validated.keyDifferentiator ?? null,
          created_at: validated.createdAt,
          updated_at: validated.updatedAt,
        },
        { onConflict: "id" }
      )

      if (error) {
        console.error("[profileService] Supabase upsert error:", error.message)
        // Fall through — still save to in-memory store so the request succeeds
      }
    }

    store.profile.set(validated)
    return validated
  },
}
