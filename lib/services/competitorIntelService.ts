/**
 * competitorIntelService
 *
 * Handles auto-fetching and enriching competitors from a founder profile.
 * Falls back to seeded mock data when OPENAI_API_KEY is not set or when
 * running in mock mode (SCRAPE_PROVIDER !== "real").
 */

import { store } from "@/lib/store"
import { mockCompetitorIntelState } from "@/lib/mocks/competitor-intel-mocks"
import type { FounderProfile } from "@/lib/schemas/profile"
import type {
  EnrichedCompetitor,
  CompetitorIntelState,
} from "@/lib/schemas/competitor-intel"

function makeCompId(): string {
  return `comp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// ─── Mock fetch ───────────────────────────────────────────────────────────────

function buildMockState(profile: FounderProfile): CompetitorIntelState {
  const comps = mockCompetitorIntelState.competitors.map((c) => ({
    ...c,
    id: makeCompId(),
  }))
  return {
    ...mockCompetitorIntelState,
    competitors: comps,
    lastFetchedAt: new Date().toISOString(),
  }
}

// ─── OpenAI-powered fetch ─────────────────────────────────────────────────────

async function callOpenAI(prompt: string): Promise<unknown> {
  const apiKey = process.env.OPENAI_API_KEY
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini"

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "You are a startup competitive intelligence analyst." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(30_000),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenAI failed: ${res.status} — ${text.slice(0, 200)}`)
  }

  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>
  }
  const raw = data.choices[0]?.message?.content
  if (!raw) throw new Error("Empty OpenAI response")
  return JSON.parse(raw)
}

async function fetchCompetitorsFromOpenAI(
  profile: FounderProfile
): Promise<EnrichedCompetitor[]> {
  const prompt = `
You are analyzing the competitive landscape for a startup.

Startup profile:
- Company: ${profile.companyName}
- Description: ${profile.description}
- Industry: ${profile.industry}
- Target customer: ${profile.targetCustomer}
- Stage: ${profile.stage}
- Geographies: ${profile.targetGeographies.join(", ")}
- Known competitors: ${profile.knownCompetitors || "none provided"}
- Problem: ${profile.problemSolved || "not specified"}
- Differentiator: ${profile.keyDifferentiator || "not specified"}

Return a JSON object with a "competitors" array of 4–5 real competitors.
Each competitor must have:
{
  "companyName": string,
  "websiteUrl": string (real URL starting with https://),
  "description": string (one line),
  "marketPosition": "leader" | "challenger" | "niche" | "emerging",
  "whyCompetitor": string (why they compete with this startup),
  "pricingModel": string,
  "estimatedPriceRange": string,
  "estimatedMonthlyPriceEntry": number (lowest monthly price in USD, 0 if free),
  "hasFreeTier": boolean,
  "keyFeatures": string[] (up to 8 features),
  "positioning": string (their main positioning line),
  "targetCustomer": string,
  "notableStrengths": string[] (2-3 strengths),
  "geographyFocus": string[],
  "radarScores": {
    "pricingCompetitiveness": number 1-10,
    "featureDepth": number 1-10,
    "marketPresence": number 1-10,
    "geographicReach": number 1-10,
    "targetClarity": number 1-10,
    "tractionSignals": number 1-10
  },
  "tractionSignals": {
    "hiringActivity": number 0-10,
    "productLaunchSignals": number 0-10,
    "socialProof": number 0-10,
    "integrationsCount": number 0-10
  },
  "positioningX": number 0-10 (breadth of features: 0=narrow, 10=broad),
  "positioningY": number 0-10 (price: 0=low/free, 10=very expensive)
}
`.trim()

  const result = (await callOpenAI(prompt)) as { competitors: unknown[] }
  const now = new Date().toISOString()

  return (result.competitors ?? []).map((c: unknown) => {
    const comp = c as Record<string, unknown>
    return {
      id: makeCompId(),
      companyName: String(comp.companyName ?? "Unknown"),
      websiteUrl: String(comp.websiteUrl ?? ""),
      description: String(comp.description ?? ""),
      marketPosition: (["leader", "challenger", "niche", "emerging"].includes(
        String(comp.marketPosition)
      )
        ? comp.marketPosition
        : "niche") as EnrichedCompetitor["marketPosition"],
      whyCompetitor: String(comp.whyCompetitor ?? ""),
      pricingModel: String(comp.pricingModel ?? ""),
      estimatedPriceRange: String(comp.estimatedPriceRange ?? ""),
      estimatedMonthlyPriceEntry:
        typeof comp.estimatedMonthlyPriceEntry === "number"
          ? comp.estimatedMonthlyPriceEntry
          : 0,
      hasFreeTier: Boolean(comp.hasFreeTier),
      keyFeatures: Array.isArray(comp.keyFeatures)
        ? (comp.keyFeatures as string[]).slice(0, 8)
        : [],
      positioning: String(comp.positioning ?? ""),
      targetCustomer: String(comp.targetCustomer ?? ""),
      notableStrengths: Array.isArray(comp.notableStrengths)
        ? (comp.notableStrengths as string[]).slice(0, 3)
        : [],
      geographyFocus: Array.isArray(comp.geographyFocus)
        ? (comp.geographyFocus as string[])
        : [],
      radarScores:
        comp.radarScores &&
        typeof comp.radarScores === "object"
          ? {
              pricingCompetitiveness: Number((comp.radarScores as Record<string, unknown>).pricingCompetitiveness ?? 5),
              featureDepth: Number((comp.radarScores as Record<string, unknown>).featureDepth ?? 5),
              marketPresence: Number((comp.radarScores as Record<string, unknown>).marketPresence ?? 5),
              geographicReach: Number((comp.radarScores as Record<string, unknown>).geographicReach ?? 5),
              targetClarity: Number((comp.radarScores as Record<string, unknown>).targetClarity ?? 5),
              tractionSignals: Number((comp.radarScores as Record<string, unknown>).tractionSignals ?? 5),
            }
          : undefined,
      tractionSignals:
        comp.tractionSignals &&
        typeof comp.tractionSignals === "object"
          ? {
              hiringActivity: Number((comp.tractionSignals as Record<string, unknown>).hiringActivity ?? 5),
              productLaunchSignals: Number((comp.tractionSignals as Record<string, unknown>).productLaunchSignals ?? 5),
              socialProof: Number((comp.tractionSignals as Record<string, unknown>).socialProof ?? 5),
              integrationsCount: Number((comp.tractionSignals as Record<string, unknown>).integrationsCount ?? 5),
            }
          : undefined,
      positioningX:
        typeof comp.positioningX === "number" ? comp.positioningX : 5,
      positioningY:
        typeof comp.positioningY === "number" ? comp.positioningY : 5,
      enrichedAt: now,
      isManuallyAdded: false,
    } satisfies EnrichedCompetitor
  })
}

// ─── Public service ────────────────────────────────────────────────────────────

export const competitorIntelService = {
  getState(): CompetitorIntelState | null {
    return store.competitorIntel.get()
  },

  /**
   * Auto-fetch competitors from a founder profile.
   * Uses OpenAI if key is present, otherwise falls back to mock data.
   */
  async fetchForProfile(profile: FounderProfile): Promise<CompetitorIntelState> {
    const useMock =
      !process.env.OPENAI_API_KEY ||
      process.env.SCRAPE_PROVIDER !== "real"

    let state: CompetitorIntelState
    if (useMock) {
      state = buildMockState(profile)
    } else {
      try {
        const competitors = await fetchCompetitorsFromOpenAI(profile)
        state = {
          competitors,
          lastFetchedAt: new Date().toISOString(),
          yourFeatures: [],
          yourHasFreeTier: profile.pricingModel === "Freemium" || profile.pricingModel === "Free",
          yourMonthlyPriceEntry: undefined,
          yourPositioningX: 5,
          yourPositioningY: 5,
        }
      } catch (err) {
        console.error("[competitorIntelService] OpenAI fetch failed — using mock", err)
        state = buildMockState(profile)
      }
    }

    store.competitorIntel.set(state)
    return state
  },

  /**
   * Enrich a single competitor (mock implementation — uses existing stored data).
   */
  async enrichCompetitor(competitorId: string, _websiteUrl: string): Promise<EnrichedCompetitor | null> {
    const existing = store.competitorIntel.get()
    if (!existing) return null

    const comp = existing.competitors.find((c) => c.id === competitorId)
    if (!comp) return null

    const enriched: EnrichedCompetitor = {
      ...comp,
      enrichedAt: new Date().toISOString(),
    }
    store.competitorIntel.updateCompetitor(competitorId, enriched)
    return enriched
  },

  addManually(data: { websiteUrl: string; companyName?: string }): EnrichedCompetitor {
    const comp: EnrichedCompetitor = {
      id: makeCompId(),
      companyName: data.companyName ?? new URL(data.websiteUrl).hostname.replace("www.", ""),
      websiteUrl: data.websiteUrl,
      description: "Manually added competitor — enrich to see details.",
      marketPosition: "niche",
      whyCompetitor: "Manually added by founder.",
      keyFeatures: [],
      notableStrengths: [],
      geographyFocus: [],
      hasFreeTier: false,
      isManuallyAdded: true,
      enrichedAt: undefined,
    }
    store.competitorIntel.addCompetitor(comp)
    return comp
  },

  removeCompetitor(id: string): void {
    store.competitorIntel.removeCompetitor(id)
  },
}
