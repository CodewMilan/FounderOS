import { describe, it, expect } from "vitest"
import {
  SourceSchema,
  CompetitorChangeSchema,
  ProspectRecordSchema,
  FundingOpportunitySchema,
  StartupProfileSchema,
  BriefSchema,
  SignalSchema,
} from "@/lib/schemas"
import {
  seedSources,
  seedCompetitorChanges,
  seedProspects,
  seedFundingOpportunities,
  seedStartupProfile,
  seedBriefs,
  seedSignals,
} from "@/lib/seed"

describe("Seed data validates against schemas", () => {
  it("all seed sources are valid", () => {
    for (const source of seedSources) {
      expect(() => SourceSchema.parse(source)).not.toThrow()
    }
  })

  it("all competitor changes are valid", () => {
    for (const change of seedCompetitorChanges) {
      expect(() => CompetitorChangeSchema.parse(change)).not.toThrow()
    }
  })

  it("all prospect records are valid", () => {
    for (const prospect of seedProspects) {
      expect(() => ProspectRecordSchema.parse(prospect)).not.toThrow()
    }
  })

  it("all funding opportunities are valid", () => {
    for (const opp of seedFundingOpportunities) {
      expect(() => FundingOpportunitySchema.parse(opp)).not.toThrow()
    }
  })

  it("startup profile is valid", () => {
    expect(() => StartupProfileSchema.parse(seedStartupProfile)).not.toThrow()
  })

  it("all briefs are valid", () => {
    for (const brief of seedBriefs) {
      expect(() => BriefSchema.parse(brief)).not.toThrow()
    }
  })

  it("all signals are valid", () => {
    for (const signal of seedSignals) {
      expect(() => SignalSchema.parse(signal)).not.toThrow()
    }
  })

  it("has at least 3 competitor changes", () => {
    expect(seedCompetitorChanges.length).toBeGreaterThanOrEqual(3)
  })

  it("has at least 3 prospect records", () => {
    expect(seedProspects.length).toBeGreaterThanOrEqual(3)
  })

  it("has at least 3 funding opportunities", () => {
    expect(seedFundingOpportunities.length).toBeGreaterThanOrEqual(3)
  })

  it("competitor changes have scores in 0–100 range", () => {
    for (const c of seedCompetitorChanges) {
      expect(c.significanceScore).toBeGreaterThanOrEqual(0)
      expect(c.significanceScore).toBeLessThanOrEqual(100)
    }
  })

  it("funding opportunities have scores in 0–100 range", () => {
    for (const f of seedFundingOpportunities) {
      expect(f.fitScore).toBeGreaterThanOrEqual(0)
      expect(f.fitScore).toBeLessThanOrEqual(100)
    }
  })
})
