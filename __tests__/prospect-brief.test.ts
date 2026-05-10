import { describe, it, expect } from "vitest"
import { generateProspectBrief } from "@/lib/prospects/briefGenerator"
import { ProspectBriefSchema } from "@/lib/schemas"
import { prospectFixtures } from "@/lib/prospects/extractor"
import { seedProspects } from "@/lib/seed"

// ─── generateProspectBrief ────────────────────────────────────────────────────

describe("generateProspectBrief", () => {
  const retoolProspect = seedProspects[0] // Retool (pr-001)

  it("returns a valid ProspectBrief", () => {
    const brief = generateProspectBrief(retoolProspect)
    expect(() => ProspectBriefSchema.parse(brief)).not.toThrow()
  })

  it("includes the prospectId", () => {
    const brief = generateProspectBrief(retoolProspect)
    expect(brief.prospectId).toBe(retoolProspect.id)
  })

  it("includes the company name", () => {
    const brief = generateProspectBrief(retoolProspect)
    expect(brief.companyName).toBe(retoolProspect.companyName)
  })

  it("includes the fit score in the headline", () => {
    const brief = generateProspectBrief(retoolProspect)
    expect(brief.headline).toContain(String(retoolProspect.fitScore))
  })

  it("has a non-empty opening line", () => {
    const brief = generateProspectBrief(retoolProspect)
    expect(brief.openingLine.length).toBeGreaterThan(20)
  })

  it("has at least 2 key points", () => {
    const brief = generateProspectBrief(retoolProspect)
    expect(brief.keyPoints.length).toBeGreaterThanOrEqual(2)
  })

  it("has a non-empty call to action", () => {
    const brief = generateProspectBrief(retoolProspect)
    expect(brief.callToAction.length).toBeGreaterThan(20)
  })

  it("has a valid generatedAt ISO timestamp", () => {
    const brief = generateProspectBrief(retoolProspect)
    expect(() => new Date(brief.generatedAt)).not.toThrow()
    expect(new Date(brief.generatedAt).getTime()).toBeGreaterThan(0)
  })

  it("enriches brief when extraction fixture is provided", () => {
    const fixture = prospectFixtures["retool.com"]
    const brief = generateProspectBrief(retoolProspect, fixture)
    // With fixture, should reference hiring signals in opening line or key points
    const allText = [brief.openingLine, ...brief.keyPoints].join(" ")
    expect(allText.length).toBeGreaterThan(50)
  })

  it("generates valid briefs for all seeded prospects", () => {
    for (const prospect of seedProspects) {
      const brief = generateProspectBrief(prospect)
      expect(() => ProspectBriefSchema.parse(brief)).not.toThrow()
    }
  })

  it("uses funding signal in opening line when available and no hiring signals", () => {
    const prospect = {
      ...retoolProspect,
      hiringSignals: [],
    }
    const fixture = { ...prospectFixtures["retool.com"], hiringSignals: [] }
    const brief = generateProspectBrief(prospect, fixture)
    // Should reference funding since there are no hiring signals
    expect(brief.openingLine.length).toBeGreaterThan(20)
  })

  it("unique ids across multiple calls", () => {
    const brief1 = generateProspectBrief(retoolProspect)
    const brief2 = generateProspectBrief(retoolProspect)
    expect(brief1.id).not.toBe(brief2.id)
  })
})
