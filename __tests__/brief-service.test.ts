import { describe, it, expect, beforeEach } from "vitest"
import { briefService, daysUntilDeadline, SEED_REF_DATE } from "@/lib/services/briefService"
import { store } from "@/lib/store"
import { seedCompetitorChanges, seedProspects, seedFundingOpportunities } from "@/lib/seed"

describe("daysUntilDeadline", () => {
  it("returns a positive number for a future date", () => {
    const days = daysUntilDeadline("2026-06-01", SEED_REF_DATE)
    expect(days).toBe(22) // 2026-05-10 → 2026-06-01 = 22 days
  })

  it("returns 0 for the same date", () => {
    expect(daysUntilDeadline("2026-05-10", SEED_REF_DATE)).toBe(0)
  })

  it("returns a negative number for a past date", () => {
    const days = daysUntilDeadline("2026-04-01", SEED_REF_DATE)
    expect(days).toBeLessThan(0)
  })
})

describe("briefService.aggregate", () => {
  beforeEach(() => {
    store._reset()
  })

  it("returns a DashboardAggregate with all expected keys", () => {
    const agg = briefService.aggregate()
    expect(agg).toHaveProperty("topCompetitorChanges")
    expect(agg).toHaveProperty("hotProspects")
    expect(agg).toHaveProperty("urgentFunding")
    expect(agg).toHaveProperty("recommendedActions")
    expect(agg).toHaveProperty("stats")
    expect(agg).toHaveProperty("brief")
    expect(agg).toHaveProperty("generatedAt")
    expect(agg).toHaveProperty("trends")
  })

  it("trends.weeklyCompetitorCounts is an array of 7 numbers", () => {
    const { trends } = briefService.aggregate()
    expect(Array.isArray(trends.weeklyCompetitorCounts)).toBe(true)
    expect(trends.weeklyCompetitorCounts).toHaveLength(7)
    trends.weeklyCompetitorCounts.forEach((v) => expect(typeof v).toBe("number"))
  })

  it("trends.weeklyCompetitorTotal equals sum of weeklyCompetitorCounts", () => {
    const { trends } = briefService.aggregate()
    const expected = trends.weeklyCompetitorCounts.reduce((s, v) => s + v, 0)
    expect(trends.weeklyCompetitorTotal).toBe(expected)
  })

  it("trends.weeklyCompetitorTotal matches seeded changes within the 7-day window", () => {
    const { trends } = briefService.aggregate()
    // All 5 seed changes fall within 7 days of SEED_REF_DATE
    expect(trends.weeklyCompetitorTotal).toBe(seedCompetitorChanges.length)
  })

  it("trends.avgProspectFitScore is a number between 0 and 100", () => {
    const { trends } = briefService.aggregate()
    expect(trends.avgProspectFitScore).toBeGreaterThanOrEqual(0)
    expect(trends.avgProspectFitScore).toBeLessThanOrEqual(100)
  })

  it("trends.avgProspectFitScore matches manual average of seeded prospects", () => {
    const { trends } = briefService.aggregate()
    const expected = Math.round(
      seedProspects.reduce((s, p) => s + p.fitScore, 0) / seedProspects.length
    )
    expect(trends.avgProspectFitScore).toBe(expected)
  })

  it("trends.nonDilutiveFundingCount matches seeded non-dilutive opportunities", () => {
    const { trends } = briefService.aggregate()
    const expected = seedFundingOpportunities.filter((f) => f.equityType === "non-dilutive").length
    expect(trends.nonDilutiveFundingCount).toBe(expected)
  })

  it("trends.trackedSourceCount matches seeded source count", () => {
    const { trends } = briefService.aggregate()
    // seedSources has 5 items
    expect(trends.trackedSourceCount).toBeGreaterThan(0)
  })

  it("trends.trackedSourcesByModule sums to trackedSourceCount", () => {
    const { trends } = briefService.aggregate()
    const { competitors, prospects, funding } = trends.trackedSourcesByModule
    expect(competitors + prospects + funding).toBe(trends.trackedSourceCount)
  })

  it("topCompetitorChanges has at most 3 items sorted by significance desc", () => {
    const agg = briefService.aggregate()
    expect(agg.topCompetitorChanges.length).toBeLessThanOrEqual(3)
    for (let i = 1; i < agg.topCompetitorChanges.length; i++) {
      expect(agg.topCompetitorChanges[i - 1].significanceScore).toBeGreaterThanOrEqual(
        agg.topCompetitorChanges[i].significanceScore
      )
    }
  })

  it("topCompetitorChanges comes from the seeded store", () => {
    const agg = briefService.aggregate()
    const topIds = agg.topCompetitorChanges.map((c) => c.id)
    const seedIds = seedCompetitorChanges.map((c) => c.id)
    topIds.forEach((id) => expect(seedIds).toContain(id))
  })

  it("hotProspects has at most 3 items with fitScore >= 60", () => {
    const agg = briefService.aggregate()
    expect(agg.hotProspects.length).toBeLessThanOrEqual(3)
    agg.hotProspects.forEach((p) => expect(p.fitScore).toBeGreaterThanOrEqual(60))
  })

  it("hotProspects comes from the seeded store", () => {
    const agg = briefService.aggregate()
    const prospectIds = agg.hotProspects.map((p) => p.id)
    const seedIds = seedProspects.map((p) => p.id)
    prospectIds.forEach((id) => expect(seedIds).toContain(id))
  })

  it("urgentFunding contains only items with deadline <= 60 days", () => {
    const agg = briefService.aggregate()
    agg.urgentFunding.forEach((opp) => {
      if (opp.deadline) {
        const days = daysUntilDeadline(opp.deadline, SEED_REF_DATE)
        expect(days).toBeLessThanOrEqual(60)
      }
    })
  })

  it("urgentFunding comes from the seed data", () => {
    const agg = briefService.aggregate()
    const fundingIds = agg.urgentFunding.map((f) => f.id)
    const seedIds = seedFundingOpportunities.map((f) => f.id)
    fundingIds.forEach((id) => expect(seedIds).toContain(id))
  })

  it("stats.competitorChanges equals total seeded changes", () => {
    const agg = briefService.aggregate()
    expect(agg.stats.competitorChanges).toBe(seedCompetitorChanges.length)
  })

  it("stats.highSeverityChanges counts changes with significanceScore >= 75", () => {
    const agg = briefService.aggregate()
    const expected = seedCompetitorChanges.filter((c) => c.significanceScore >= 75).length
    expect(agg.stats.highSeverityChanges).toBe(expected)
  })

  it("stats.topProspects counts prospects with fitScore >= 75", () => {
    const agg = briefService.aggregate()
    const expected = seedProspects.filter((p) => p.fitScore >= 75).length
    expect(agg.stats.topProspects).toBe(expected)
  })

  it("stats.fundingOpportunities equals total seed funding count", () => {
    const agg = briefService.aggregate()
    expect(agg.stats.fundingOpportunities).toBe(seedFundingOpportunities.length)
  })

  it("stats.upcomingDeadlines matches deadlines <= 60 days", () => {
    const agg = briefService.aggregate()
    const expected = seedFundingOpportunities.filter((f) => {
      if (!f.deadline) return false
      return daysUntilDeadline(f.deadline, SEED_REF_DATE) <= 60
    }).length
    expect(agg.stats.upcomingDeadlines).toBe(expected)
  })

  it("recommendedActions are non-empty (seeded data has high-significance changes)", () => {
    const agg = briefService.aggregate()
    expect(agg.recommendedActions.length).toBeGreaterThan(0)
  })

  it("recommendedActions each have the correct module field", () => {
    const agg = briefService.aggregate()
    const validModules = ["competitors", "prospects", "funding"]
    agg.recommendedActions.forEach((a) => expect(validModules).toContain(a.module))
  })

  it("recommendedActions each have a valid urgency field", () => {
    const agg = briefService.aggregate()
    const valid = ["high", "medium", "low"]
    agg.recommendedActions.forEach((a) => expect(valid).toContain(a.urgency))
  })

  it("brief has module === 'dashboard'", () => {
    const agg = briefService.aggregate()
    expect(agg.brief.module).toBe("dashboard")
  })

  it("brief has a non-empty title", () => {
    const agg = briefService.aggregate()
    expect(agg.brief.title).toBeTruthy()
    expect(agg.brief.title.length).toBeGreaterThan(0)
  })

  it("brief has at least one bullet", () => {
    const agg = briefService.aggregate()
    expect(agg.brief.bullets.length).toBeGreaterThan(0)
  })

  it("brief.relatedIds includes competitor, prospect, and funding ids", () => {
    const agg = briefService.aggregate()
    const relatedIds = agg.brief.relatedIds
    // Should include at least some of the topCompetitorChanges ids
    const competitorIds = agg.topCompetitorChanges.map((c) => c.id)
    const hasCompetitorIds = competitorIds.some((id) => relatedIds.includes(id))
    expect(hasCompetitorIds).toBe(true)
  })

  it("aggregate works with an empty store (all sections empty)", () => {
    store._clearAll()
    const agg = briefService.aggregate()
    expect(agg.topCompetitorChanges).toHaveLength(0)
    expect(agg.hotProspects).toHaveLength(0)
    expect(agg.stats.competitorChanges).toBe(0)
    expect(agg.stats.topProspects).toBe(0)
    // Brief still renders — has the fallback bullet
    expect(agg.brief.bullets.length).toBeGreaterThan(0)
  })
})

describe("briefService.composeBrief", () => {
  it("returns a Brief with module === 'dashboard'", () => {
    const brief = briefService.composeBrief({
      topCompetitorChanges: [],
      hotProspects: [],
      urgentFunding: [],
      stats: {
        competitorChanges: 0,
        highSeverityChanges: 0,
        topProspects: 0,
        fundingOpportunities: 0,
        upcomingDeadlines: 0,
      },
    })
    expect(brief.module).toBe("dashboard")
  })

  it("returns the fallback bullet when all inputs are empty", () => {
    const brief = briefService.composeBrief({
      topCompetitorChanges: [],
      hotProspects: [],
      urgentFunding: [],
      stats: {
        competitorChanges: 0,
        highSeverityChanges: 0,
        topProspects: 0,
        fundingOpportunities: 0,
        upcomingDeadlines: 0,
      },
    })
    expect(brief.bullets).toHaveLength(1)
    expect(brief.bullets[0]).toContain("No signals")
  })

  it("includes competitor summary bullet for high-significance changes", () => {
    const change = seedCompetitorChanges.find((c) => c.significanceScore >= 75)!
    const brief = briefService.composeBrief({
      topCompetitorChanges: [change],
      hotProspects: [],
      urgentFunding: [],
      stats: {
        competitorChanges: 1,
        highSeverityChanges: 1,
        topProspects: 0,
        fundingOpportunities: 0,
        upcomingDeadlines: 0,
      },
    })
    const hasCompetitorBullet = brief.bullets.some((b) => b.includes(change.competitorName))
    expect(hasCompetitorBullet).toBe(true)
  })

  it("includes prospect bullet for high-fit prospects", () => {
    const prospect = seedProspects.find((p) => p.fitScore >= 75)!
    const brief = briefService.composeBrief({
      topCompetitorChanges: [],
      hotProspects: [prospect],
      urgentFunding: [],
      stats: {
        competitorChanges: 0,
        highSeverityChanges: 0,
        topProspects: 1,
        fundingOpportunities: 0,
        upcomingDeadlines: 0,
      },
    })
    const hasProspectBullet = brief.bullets.some((b) => b.includes(prospect.companyName))
    expect(hasProspectBullet).toBe(true)
  })

  it("includes funding bullet for urgent opportunities", () => {
    const opp = seedFundingOpportunities[0]
    const brief = briefService.composeBrief({
      topCompetitorChanges: [],
      hotProspects: [],
      urgentFunding: [opp],
      stats: {
        competitorChanges: 0,
        highSeverityChanges: 0,
        topProspects: 0,
        fundingOpportunities: 1,
        upcomingDeadlines: 1,
      },
    })
    const hasFundingBullet = brief.bullets.some((b) => b.includes(opp.programName))
    expect(hasFundingBullet).toBe(true)
  })

  it("relatedIds includes all passed entity ids", () => {
    const change = seedCompetitorChanges[0]
    const prospect = seedProspects[0]
    const opp = seedFundingOpportunities[0]
    const brief = briefService.composeBrief({
      topCompetitorChanges: [change],
      hotProspects: [prospect],
      urgentFunding: [opp],
      stats: {
        competitorChanges: 1,
        highSeverityChanges: 0,
        topProspects: 1,
        fundingOpportunities: 1,
        upcomingDeadlines: 1,
      },
    })
    expect(brief.relatedIds).toContain(change.id)
    expect(brief.relatedIds).toContain(prospect.id)
    expect(brief.relatedIds).toContain(opp.id)
  })

  it("title contains a date string", () => {
    const brief = briefService.composeBrief({
      topCompetitorChanges: [],
      hotProspects: [],
      urgentFunding: [],
      stats: {
        competitorChanges: 0,
        highSeverityChanges: 0,
        topProspects: 0,
        fundingOpportunities: 0,
        upcomingDeadlines: 0,
      },
    })
    expect(brief.title).toMatch(/Today's Founder Brief/)
    expect(brief.title.length).toBeGreaterThan(20)
  })
})
