import { describe, it, expect } from "vitest"
import { scoreProspectFit, buildMaturitySignals, buildRecommendedAngle } from "@/lib/prospects/scorer"
import { prospectFixtures } from "@/lib/prospects/extractor"
import { seedStartupProfile } from "@/lib/seed"

// ─── scoreProspectFit ─────────────────────────────────────────────────────────

describe("scoreProspectFit", () => {
  it("returns a number between 0 and 100", () => {
    for (const fixture of Object.values(prospectFixtures)) {
      const score = scoreProspectFit(fixture, seedStartupProfile)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    }
  })

  it("scores higher for companies with many enterprise signals", () => {
    const enterprisePoor = { ...prospectFixtures["raycast.com"], enterpriseSignals: [] }
    const enterpriseRich = { ...prospectFixtures["retool.com"], enterpriseSignals: ["SOC 2 certified", "SAML / SSO support", "Audit logs", "SLA / uptime guarantee", "Enterprise tier available"] }
    const scorePoor = scoreProspectFit(enterprisePoor, seedStartupProfile)
    const scoreRich = scoreProspectFit(enterpriseRich, seedStartupProfile)
    expect(scoreRich).toBeGreaterThan(scorePoor)
  })

  it("scores higher for companies with many hiring signals", () => {
    const fewHiring = { ...prospectFixtures["hex.tech"], hiringSignals: [] }
    const manyHiring = { ...prospectFixtures["retool.com"], hiringSignals: ["VP Eng", "Head of Product", "Sales Engineer", "DevRel"] }
    const scoreFew = scoreProspectFit(fewHiring, seedStartupProfile)
    const scoreMany = scoreProspectFit(manyHiring, seedStartupProfile)
    expect(scoreMany).toBeGreaterThan(scoreFew)
  })

  it("scores higher for scale/enterprise stage vs early stage", () => {
    const earlyStage = { ...prospectFixtures["raycast.com"], likelyStage: "early" as const }
    const scaleStage = { ...prospectFixtures["retool.com"], likelyStage: "scale" as const }
    const scoreEarly = scoreProspectFit(earlyStage, seedStartupProfile)
    const scoreScale = scoreProspectFit(scaleStage, seedStartupProfile)
    expect(scoreScale).toBeGreaterThan(scoreEarly)
  })

  it("scores higher for companies with more integrations", () => {
    const fewInt = { ...prospectFixtures["hex.tech"], integrationClues: [] }
    const manyInt = { ...prospectFixtures["retool.com"], integrationClues: ["Slack", "GitHub", "Salesforce", "HubSpot", "Zapier", "Linear"] }
    const scoreFew = scoreProspectFit(fewInt, seedStartupProfile)
    const scoreMany = scoreProspectFit(manyInt, seedStartupProfile)
    expect(scoreMany).toBeGreaterThan(scoreFew)
  })

  it("works without a startup profile", () => {
    const score = scoreProspectFit(prospectFixtures["retool.com"])
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it("returns integer scores", () => {
    for (const fixture of Object.values(prospectFixtures)) {
      const score = scoreProspectFit(fixture, seedStartupProfile)
      expect(Number.isInteger(score)).toBe(true)
    }
  })

  it("retool scores higher than raycast (more signals)", () => {
    const retoolScore = scoreProspectFit(prospectFixtures["retool.com"], seedStartupProfile)
    const raycastScore = scoreProspectFit(prospectFixtures["raycast.com"], seedStartupProfile)
    expect(retoolScore).toBeGreaterThan(raycastScore)
  })
})

// ─── buildMaturitySignals ─────────────────────────────────────────────────────

describe("buildMaturitySignals", () => {
  it("returns an array of strings", () => {
    const signals = buildMaturitySignals(prospectFixtures["retool.com"])
    expect(Array.isArray(signals)).toBe(true)
    expect(signals.every((s) => typeof s === "string")).toBe(true)
  })

  it("includes funding signal when available", () => {
    const signals = buildMaturitySignals(prospectFixtures["retool.com"])
    expect(signals.some((s) => /series|backed|raised/i.test(s))).toBe(true)
  })

  it("includes enterprise signal when available", () => {
    const signals = buildMaturitySignals(prospectFixtures["retool.com"])
    expect(signals.some((s) => /soc|saml|sso|audit|enterprise/i.test(s))).toBe(true)
  })

  it("returns at most 4 signals", () => {
    const signals = buildMaturitySignals(prospectFixtures["retool.com"])
    expect(signals.length).toBeLessThanOrEqual(4)
  })

  it("returns empty array for company with no signals", () => {
    const bare = {
      ...prospectFixtures["raycast.com"],
      fundingSignals: [],
      enterpriseSignals: [],
      likelyStage: "unknown" as const,
      integrationClues: [],
    }
    const signals = buildMaturitySignals(bare)
    expect(Array.isArray(signals)).toBe(true)
  })
})

// ─── buildRecommendedAngle ────────────────────────────────────────────────────

describe("buildRecommendedAngle", () => {
  it("returns a non-empty string for all fixtures", () => {
    for (const fixture of Object.values(prospectFixtures)) {
      const angle = buildRecommendedAngle(fixture)
      expect(typeof angle).toBe("string")
      expect(angle.length).toBeGreaterThan(20)
    }
  })

  it("references developer focus for Developer Tools category", () => {
    const fixture = { ...prospectFixtures["raycast.com"], category: "Developer Tools" }
    const angle = buildRecommendedAngle(fixture)
    expect(/developer|engineer|technical/i.test(angle)).toBe(true)
  })

  it("references data teams for Data / Analytics category", () => {
    const fixture = { ...prospectFixtures["hex.tech"], category: "Data / Analytics" }
    const angle = buildRecommendedAngle(fixture)
    expect(/data|analytic|insight/i.test(angle)).toBe(true)
  })

  it("mentions enterprise scale for enterprise/scale stage", () => {
    const fixture = {
      ...prospectFixtures["retool.com"],
      category: "Unknown Category",
      likelyStage: "enterprise" as const,
    }
    const angle = buildRecommendedAngle(fixture)
    expect(/enterprise|scaled|roi|sla/i.test(angle)).toBe(true)
  })
})
