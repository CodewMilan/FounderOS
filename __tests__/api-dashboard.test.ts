import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { POST } from "@/app/api/dashboard/refresh/route"
import { store } from "@/lib/store"
import { seedCompetitorChanges, seedProspects, seedFundingOpportunities } from "@/lib/seed"

beforeEach(() => {
  store._reset()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("POST /api/dashboard/refresh", () => {
  it("returns 200", async () => {
    const res = await POST()
    expect(res.status).toBe(200)
  })

  it("returns a DashboardAggregate shape including trends", async () => {
    const res = await POST()
    const body = await res.json() as Record<string, unknown>
    expect(body).toHaveProperty("topCompetitorChanges")
    expect(body).toHaveProperty("hotProspects")
    expect(body).toHaveProperty("urgentFunding")
    expect(body).toHaveProperty("recommendedActions")
    expect(body).toHaveProperty("stats")
    expect(body).toHaveProperty("brief")
    expect(body).toHaveProperty("generatedAt")
    expect(body).toHaveProperty("trends")
  })

  it("trends field has required sub-keys", async () => {
    const res = await POST()
    const body = await res.json() as { trends: Record<string, unknown> }
    expect(body.trends).toHaveProperty("weeklyCompetitorCounts")
    expect(body.trends).toHaveProperty("weeklyCompetitorTotal")
    expect(body.trends).toHaveProperty("avgProspectFitScore")
    expect(body.trends).toHaveProperty("nonDilutiveFundingCount")
    expect(body.trends).toHaveProperty("trackedSourceCount")
    expect(body.trends).toHaveProperty("trackedSourcesByModule")
  })

  it("topCompetitorChanges is an array", async () => {
    const res = await POST()
    const body = await res.json() as { topCompetitorChanges: unknown[] }
    expect(Array.isArray(body.topCompetitorChanges)).toBe(true)
  })

  it("topCompetitorChanges contains at most 3 items", async () => {
    const res = await POST()
    const body = await res.json() as { topCompetitorChanges: unknown[] }
    expect(body.topCompetitorChanges.length).toBeLessThanOrEqual(3)
  })

  it("hotProspects is an array with fitScore >= 60", async () => {
    const res = await POST()
    const body = await res.json() as { hotProspects: { fitScore: number }[] }
    body.hotProspects.forEach((p) => expect(p.fitScore).toBeGreaterThanOrEqual(60))
  })

  it("stats contains correct counts from seed data", async () => {
    const res = await POST()
    const body = await res.json() as {
      stats: {
        competitorChanges: number
        highSeverityChanges: number
        topProspects: number
        fundingOpportunities: number
        upcomingDeadlines: number
      }
    }
    expect(body.stats.competitorChanges).toBe(seedCompetitorChanges.length)
    expect(body.stats.fundingOpportunities).toBe(seedFundingOpportunities.length)
    expect(body.stats.topProspects).toBe(
      seedProspects.filter((p) => p.fitScore >= 75).length
    )
  })

  it("brief has module === 'dashboard'", async () => {
    const res = await POST()
    const body = await res.json() as { brief: { module: string; title: string; bullets: string[] } }
    expect(body.brief.module).toBe("dashboard")
  })

  it("brief title is a non-empty string", async () => {
    const res = await POST()
    const body = await res.json() as { brief: { title: string } }
    expect(typeof body.brief.title).toBe("string")
    expect(body.brief.title.length).toBeGreaterThan(0)
  })

  it("brief has at least one bullet", async () => {
    const res = await POST()
    const body = await res.json() as { brief: { bullets: string[] } }
    expect(Array.isArray(body.brief.bullets)).toBe(true)
    expect(body.brief.bullets.length).toBeGreaterThan(0)
  })

  it("recommendedActions is an array", async () => {
    const res = await POST()
    const body = await res.json() as { recommendedActions: unknown[] }
    expect(Array.isArray(body.recommendedActions)).toBe(true)
  })

  it("recommendedActions items have label, module, and urgency", async () => {
    const res = await POST()
    const body = await res.json() as {
      recommendedActions: { id: string; label: string; module: string; urgency: string }[]
    }
    const validModules = ["competitors", "prospects", "funding"]
    const validUrgency = ["high", "medium", "low"]
    body.recommendedActions.forEach((a) => {
      expect(typeof a.label).toBe("string")
      expect(a.label.length).toBeGreaterThan(0)
      expect(validModules).toContain(a.module)
      expect(validUrgency).toContain(a.urgency)
    })
  })

  it("urgentFunding only contains items with deadline within 60 days of seed date", async () => {
    const SEED_REF = new Date("2026-05-10")
    const res = await POST()
    const body = await res.json() as { urgentFunding: { deadline?: string }[] }
    body.urgentFunding.forEach((opp) => {
      if (opp.deadline) {
        const days = Math.ceil(
          (new Date(opp.deadline).getTime() - SEED_REF.getTime()) / (1000 * 60 * 60 * 24)
        )
        expect(days).toBeLessThanOrEqual(60)
      }
    })
  })

  it("generatedAt is a valid ISO date string", async () => {
    const res = await POST()
    const body = await res.json() as { generatedAt: string }
    expect(() => new Date(body.generatedAt)).not.toThrow()
    expect(new Date(body.generatedAt).getTime()).not.toBeNaN()
  })

  it("returns correct data when store has no competitor changes", async () => {
    store._clearAll()
    const res = await POST()
    const body = await res.json() as {
      stats: { competitorChanges: number }
      topCompetitorChanges: unknown[]
    }
    expect(body.stats.competitorChanges).toBe(0)
    expect(body.topCompetitorChanges).toHaveLength(0)
  })
})

// ─── Dynamic scan behavior ────────────────────────────────────────────────────

describe("POST /api/dashboard/refresh — dynamic scan behavior", () => {
  beforeEach(() => {
    store._reset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("does not run the scan pipeline when SCRAPE_PROVIDER is not set", async () => {
    // Without SCRAPE_PROVIDER, the route should skip the scan and return seeded data
    vi.stubEnv("SCRAPE_PROVIDER", "")
    const res = await POST()
    expect(res.status).toBe(200)
    const body = await res.json() as { stats: { competitorChanges: number } }
    // Should still return the seeded count (scan was not run)
    expect(body.stats.competitorChanges).toBe(seedCompetitorChanges.length)
  })

  it("does not run the scan pipeline when SCRAPE_PROVIDER=mock", async () => {
    vi.stubEnv("SCRAPE_PROVIDER", "mock")
    const res = await POST()
    expect(res.status).toBe(200)
    const body = await res.json() as { stats: { competitorChanges: number } }
    expect(body.stats.competitorChanges).toBe(seedCompetitorChanges.length)
  })

  it("returns 200 with valid aggregate regardless of scan outcome", async () => {
    // Even if SCRAPE_PROVIDER is set and a scan would run,
    // the response must always be a valid aggregate
    const res = await POST()
    expect(res.status).toBe(200)
    const body = await res.json() as Record<string, unknown>
    expect(body).toHaveProperty("stats")
    expect(body).toHaveProperty("brief")
    expect(body).toHaveProperty("trends")
  })

  it("returns fallback data even when store is cleared", async () => {
    store._clearAll()
    const res = await POST()
    expect(res.status).toBe(200)
    const body = await res.json() as { stats: { competitorChanges: number }; brief: { bullets: unknown[] } }
    // Cleared store — competitor count is 0 but brief still has at least one bullet
    expect(body.stats.competitorChanges).toBe(0)
    expect(Array.isArray(body.brief.bullets)).toBe(true)
    expect(body.brief.bullets.length).toBeGreaterThan(0)
  })
})
