import type { ProspectRecord, ProspectBrief, AnalyzeProspectInput } from "@/lib/schemas"
import { AnalyzeProspectSchema } from "@/lib/schemas"
import { store } from "@/lib/store"
import { ingestionService } from "@/lib/services/ingestionService"
import {
  extractCompanyData,
  getFixtureForUrl,
} from "@/lib/prospects/extractor"
import { scoreProspectFit, buildMaturitySignals, buildRecommendedAngle } from "@/lib/prospects/scorer"
import { generateProspectBrief } from "@/lib/prospects/briefGenerator"
import { seedStartupProfile } from "@/lib/seed"

// ─── ID helper ────────────────────────────────────────────────────────────────

function makeProspectId(): string {
  return `pr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

// ─── Main service ─────────────────────────────────────────────────────────────

export const prospectService = {
  /** List all prospects, sorted by fitScore descending. */
  listProspects(): ProspectRecord[] {
    return store.prospects.list().sort((a, b) => b.fitScore - a.fitScore)
  },

  /** Get a single prospect by id. */
  getProspect(id: string): ProspectRecord | undefined {
    return store.prospects.get(id)
  },

  /**
   * Analyze a company URL and create/refresh a ProspectRecord.
   *
   * Pipeline:
   *   1. Validate the incoming payload
   *   2. Check if we have a fixture (mock mode) or ingest the URL (provider)
   *   3. Extract structured company data
   *   4. Score prospect fit
   *   5. Persist and return a ProspectRecord
   */
  async analyzeCompany(input: AnalyzeProspectInput): Promise<ProspectRecord> {
    const parsed = AnalyzeProspectSchema.safeParse(input)
    if (!parsed.success) {
      throw new Error(`Invalid input: ${parsed.error.issues.map((i) => i.message).join(", ")}`)
    }

    const { url, companyName } = parsed.data

    // 1. Try fixture first (mock mode — works without external env vars)
    const fixture = getFixtureForUrl(url)

    // 2. Extract company data — fixture takes precedence over live scrape
    let extraction = fixture
    if (!extraction) {
      const raw = await ingestionService.ingestUrl(url)
      extraction = extractCompanyData(raw, companyName)
    } else if (companyName) {
      // Allow name override even in fixture mode
      extraction = { ...extraction, companyName }
    }

    // 3. Score fit against the founder's startup profile
    const fitScore = scoreProspectFit(extraction, seedStartupProfile)
    const maturitySignals = buildMaturitySignals(extraction)
    const recommendedAngle = buildRecommendedAngle(extraction)

    // 4. Build and persist the ProspectRecord
    const prospect: ProspectRecord = {
      id: makeProspectId(),
      companyName: extraction.companyName,
      website: url,
      category: extraction.category,
      valueProp: extraction.valueProp,
      maturitySignals,
      hiringSignals: extraction.hiringSignals,
      fitScore,
      recommendedAngle,
      analyzedAt: new Date().toISOString(),
    }

    store.prospects.set(prospect)
    return prospect
  },

  /** Re-analyze an existing prospect (refreshes all derived fields). */
  async refreshProspect(id: string): Promise<ProspectRecord> {
    const existing = store.prospects.get(id)
    if (!existing) throw new Error(`Prospect ${id} not found`)
    return prospectService.analyzeCompany({
      url: existing.website,
      companyName: existing.companyName,
    })
  },

  /** Generate and persist a ProspectBrief for a given prospect. */
  generateBrief(prospectId: string): ProspectBrief {
    const prospect = store.prospects.get(prospectId)
    if (!prospect) throw new Error(`Prospect ${prospectId} not found`)

    // Get the fixture extraction if available for richer brief content
    const extraction = getFixtureForUrl(prospect.website) ?? undefined
    const brief = generateProspectBrief(prospect, extraction)
    store.briefs.set(brief)
    return brief
  },

  /** Get the latest generated brief for a prospect, if any. */
  getBrief(prospectId: string): ProspectBrief | undefined {
    return store.briefs.byProspectId(prospectId)
  },

  /** List all generated briefs. */
  listBriefs(): ProspectBrief[] {
    return store.briefs.list()
  },
}
