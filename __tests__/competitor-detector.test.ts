import { describe, it, expect } from "vitest"
import {
  computeDiff,
  classifyChange,
  scoreSignificance,
  generateSummary,
  generateSuggestedAction,
  detectChanges,
} from "@/lib/competitors/detector"
import {
  pricingBeforeFixture,
  pricingAfterFixture,
  hiringBeforeFixture,
  hiringAfterFixture,
  changelogBeforeFixture,
  changelogAfterFixture,
} from "@/lib/competitors/snapshots"
import type { CompetitorSnapshot } from "@/lib/schemas"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSnapshot(
  overrides: Partial<CompetitorSnapshot> & { content: string }
): CompetitorSnapshot {
  return {
    id: "snap-test",
    sourceId: "src-test",
    competitorName: "TestCo",
    pageCategory: "pricing",
    url: "https://testco.com/pricing",
    capturedAt: "2026-05-10T00:00:00.000Z",
    ...overrides,
  }
}

// ─── computeDiff ──────────────────────────────────────────────────────────────

describe("computeDiff", () => {
  it("returns hasChanges=false for identical content", () => {
    const diff = computeDiff("hello world", "hello world")
    expect(diff.hasChanges).toBe(false)
  })

  it("returns hasChanges=true when content differs", () => {
    const diff = computeDiff("line A\nline B", "line A\nline C")
    expect(diff.hasChanges).toBe(true)
  })

  it("detects added lines", () => {
    const diff = computeDiff("line A", "line A\nline B (new)")
    expect(diff.addedLines).toContain("line B (new)")
  })

  it("detects removed lines", () => {
    const diff = computeDiff("line A\nline B (old)", "line A")
    expect(diff.removedLines).toContain("line B (old)")
  })

  it("computes a change ratio between 0 and 1", () => {
    const diff = computeDiff("a\nb\nc", "a\nb\nd")
    expect(diff.changeRatio).toBeGreaterThan(0)
    expect(diff.changeRatio).toBeLessThanOrEqual(1)
  })

  it("change ratio is 0 for identical content", () => {
    const diff = computeDiff("same content", "same content")
    expect(diff.changeRatio).toBe(0)
  })

  it("change ratio is 1 for completely different content", () => {
    const diff = computeDiff("alpha", "beta")
    expect(diff.changeRatio).toBe(1)
  })

  it("works correctly on pricing fixture pair", () => {
    const diff = computeDiff(pricingBeforeFixture, pricingAfterFixture)
    expect(diff.hasChanges).toBe(true)
    expect(diff.addedLines.length).toBeGreaterThan(0)
  })

  it("works correctly on hiring fixture pair", () => {
    const diff = computeDiff(hiringBeforeFixture, hiringAfterFixture)
    expect(diff.hasChanges).toBe(true)
    expect(diff.addedLines.length).toBeGreaterThan(0)
  })
})

// ─── classifyChange ───────────────────────────────────────────────────────────

describe("classifyChange", () => {
  const trivialDiff = computeDiff("a", "b")

  it("classifies pricing page as 'pricing'", () => {
    expect(classifyChange("pricing", trivialDiff)).toBe("pricing")
  })

  it("classifies careers page as 'hiring'", () => {
    expect(classifyChange("careers", trivialDiff)).toBe("hiring")
  })

  it("classifies changelog page as 'product'", () => {
    expect(classifyChange("changelog", trivialDiff)).toBe("product")
  })

  it("classifies blog page as 'announcement' by default", () => {
    expect(classifyChange("blog", trivialDiff)).toBe("announcement")
  })

  it("classifies blog page with funding signals as 'announcement'", () => {
    const diff = computeDiff("", "We raised a Series B of $52M")
    expect(classifyChange("blog", diff)).toBe("announcement")
  })

  it("classifies homepage with price signals as 'pricing'", () => {
    const diff = computeDiff("", "Our plans start at $12/seat")
    expect(classifyChange("homepage", diff)).toBe("pricing")
  })

  it("classifies homepage with launch signals as 'product'", () => {
    const diff = computeDiff("", "We launched our new feature today")
    expect(classifyChange("homepage", diff)).toBe("product")
  })
})

// ─── scoreSignificance ────────────────────────────────────────────────────────

describe("scoreSignificance", () => {
  it("scores pricing above baseline of 65", () => {
    const diff = computeDiff(pricingBeforeFixture, pricingAfterFixture)
    const score = scoreSignificance("pricing", diff)
    expect(score).toBeGreaterThanOrEqual(65)
  })

  it("scores hiring above baseline of 35", () => {
    const diff = computeDiff(hiringBeforeFixture, hiringAfterFixture)
    const score = scoreSignificance("careers", diff)
    expect(score).toBeGreaterThanOrEqual(35)
  })

  it("boosts score for SSO bundling in pricing changes", () => {
    const diff = computeDiff(
      "## Enterprise\nCustom — SAML SSO in Enterprise only.",
      "## Business\nSSO included. SAML bundled for all business plans."
    )
    const withBoost = scoreSignificance("pricing", diff)
    const baselineDiff = computeDiff("just some text", "just some other text")
    const withoutBoost = scoreSignificance("pricing", baselineDiff)
    expect(withBoost).toBeGreaterThan(withoutBoost)
  })

  it("boosts score for leadership hires", () => {
    const diff = computeDiff(
      "- Backend Engineer",
      "- Head of Sales\n- VP of Marketing\n- Backend Engineer"
    )
    const withLeadership = scoreSignificance("careers", diff)
    const basicDiff = computeDiff("- Backend Engineer", "- Frontend Engineer")
    const withoutLeadership = scoreSignificance("careers", basicDiff)
    expect(withLeadership).toBeGreaterThan(withoutLeadership)
  })

  it("boosts score for AI signals in product changes", () => {
    const diff = computeDiff("", "New AI automation features for all plans")
    const withAI = scoreSignificance("changelog", diff)
    const basicDiff = computeDiff("", "Minor bug fixes and improvements")
    const withoutAI = scoreSignificance("changelog", basicDiff)
    expect(withAI).toBeGreaterThan(withoutAI)
  })

  it("never exceeds 100", () => {
    // Combine all possible boosts
    const diff = computeDiff(
      "",
      [
        "$500/month price increase",
        "SSO included, SAML bundled, audit logs for all",
        "AI machine learning automation launch ship release",
        "Series A raised $50M, series B investment",
        "- Head of Sales\n- VP Marketing\n- Director of Eng\n- Staff Engineer\n- Head of Product\n" +
          "- Head of Design\n- Chief Revenue Officer\n- VP of Finance",
      ].join("\n")
    )
    const score = scoreSignificance("pricing", diff)
    expect(score).toBeLessThanOrEqual(100)
  })

  it("never goes below 0", () => {
    const diff = computeDiff("", "")
    const score = scoreSignificance("homepage", diff)
    expect(score).toBeGreaterThanOrEqual(0)
  })
})

// ─── generateSummary ─────────────────────────────────────────────────────────

describe("generateSummary", () => {
  it("returns a non-empty string", () => {
    const diff = computeDiff(pricingBeforeFixture, pricingAfterFixture)
    const summary = generateSummary("Linear", "pricing", diff)
    expect(typeof summary).toBe("string")
    expect(summary.length).toBeGreaterThan(10)
  })

  it("includes the competitor name in the summary", () => {
    const diff = computeDiff(pricingBeforeFixture, pricingAfterFixture)
    expect(generateSummary("Linear", "pricing", diff)).toContain("Linear")
  })

  it("pricing with SSO signals mentions bundling or SSO", () => {
    const diff = computeDiff(
      "## Enterprise\nSSO only in Enterprise",
      "## Business\nSSO included and bundled for all"
    )
    const summary = generateSummary("TestCo", "pricing", diff)
    expect(summary.toLowerCase()).toMatch(/sso|bundl|reposit/i)
  })

  it("hiring summary mentions role count", () => {
    const diff = computeDiff(hiringBeforeFixture, hiringAfterFixture)
    const summary = generateSummary("Vercel", "careers", diff)
    expect(summary.toLowerCase()).toMatch(/role|hire|hiring|position/i)
  })

  it("changelog summary references updates", () => {
    const diff = computeDiff(changelogBeforeFixture, changelogAfterFixture)
    const summary = generateSummary("Notion", "changelog", diff)
    expect(summary.toLowerCase()).toMatch(/ship|updat|new|changelog/i)
  })
})

// ─── generateSuggestedAction ──────────────────────────────────────────────────

describe("generateSuggestedAction", () => {
  it("returns a non-empty action string", () => {
    const diff = computeDiff(pricingBeforeFixture, pricingAfterFixture)
    const action = generateSuggestedAction("Linear", "pricing", "pricing", diff)
    expect(typeof action).toBe("string")
    expect(action.length).toBeGreaterThan(10)
  })

  it("pricing action mentions competitive deck or pricing", () => {
    const diff = computeDiff(pricingBeforeFixture, pricingAfterFixture)
    const action = generateSuggestedAction("Linear", "pricing", "pricing", diff)
    expect(action.toLowerCase()).toMatch(/competi|pric|deck|material/i)
  })

  it("hiring action with enterprise signals mentions enterprise", () => {
    const diff = computeDiff("", "- Enterprise Account Executive (New York)")
    const action = generateSuggestedAction("Vercel", "careers", "hiring", diff)
    expect(action.toLowerCase()).toMatch(/enterprise|pipeline|market/i)
  })

  it("product action mentions comparison or differentiation", () => {
    const diff = computeDiff("", "AI automations now available")
    const action = generateSuggestedAction("Notion", "changelog", "product", diff)
    expect(action.toLowerCase()).toMatch(/ai|differentiat|comparison|deck/i)
  })
})

// ─── detectChanges ────────────────────────────────────────────────────────────

describe("detectChanges", () => {
  it("returns null for identical snapshots", () => {
    const snap = makeSnapshot({ content: pricingAfterFixture })
    expect(detectChanges(snap, snap)).toBeNull()
  })

  it("returns a CompetitorChange when content differs", () => {
    const prev = makeSnapshot({ content: pricingBeforeFixture })
    const curr = makeSnapshot({
      id: "snap-test-2",
      content: pricingAfterFixture,
      capturedAt: "2026-05-10T10:00:00.000Z",
    })
    const change = detectChanges(prev, curr)
    expect(change).not.toBeNull()
  })

  it("detected change has correct competitorName", () => {
    const prev = makeSnapshot({ content: pricingBeforeFixture })
    const curr = makeSnapshot({
      id: "snap-test-2",
      content: pricingAfterFixture,
      competitorName: "MyRival",
    })
    const change = detectChanges(prev, curr)
    expect(change?.competitorName).toBe("MyRival")
  })

  it("pricing snapshot diff produces 'pricing' changeType", () => {
    const prev = makeSnapshot({ content: pricingBeforeFixture, pageCategory: "pricing" })
    const curr = makeSnapshot({
      id: "snap-test-2",
      content: pricingAfterFixture,
      pageCategory: "pricing",
    })
    const change = detectChanges(prev, curr)
    expect(change?.changeType).toBe("pricing")
  })

  it("careers snapshot diff produces 'hiring' changeType", () => {
    const prev = makeSnapshot({
      content: hiringBeforeFixture,
      pageCategory: "careers",
      url: "https://testco.com/careers",
    })
    const curr = makeSnapshot({
      id: "snap-test-2",
      content: hiringAfterFixture,
      pageCategory: "careers",
      url: "https://testco.com/careers",
    })
    const change = detectChanges(prev, curr)
    expect(change?.changeType).toBe("hiring")
  })

  it("detected change has significanceScore in 0–100 range", () => {
    const prev = makeSnapshot({ content: pricingBeforeFixture })
    const curr = makeSnapshot({ id: "snap-test-2", content: pricingAfterFixture })
    const change = detectChanges(prev, curr)
    expect(change!.significanceScore).toBeGreaterThanOrEqual(0)
    expect(change!.significanceScore).toBeLessThanOrEqual(100)
  })

  it("detected change has non-empty summary", () => {
    const prev = makeSnapshot({ content: pricingBeforeFixture })
    const curr = makeSnapshot({ id: "snap-test-2", content: pricingAfterFixture })
    const change = detectChanges(prev, curr)
    expect(change!.summary.length).toBeGreaterThan(5)
  })

  it("detected change has both previousSnapshot and currentSnapshot", () => {
    const prev = makeSnapshot({ content: pricingBeforeFixture })
    const curr = makeSnapshot({ id: "snap-test-2", content: pricingAfterFixture })
    const change = detectChanges(prev, curr)
    expect(change!.previousSnapshot).toBe(pricingBeforeFixture)
    expect(change!.currentSnapshot).toBe(pricingAfterFixture)
  })

  it("changelog diff produces 'product' changeType", () => {
    const prev = makeSnapshot({ content: changelogBeforeFixture, pageCategory: "changelog", url: "https://example.com/changelog" })
    const curr = makeSnapshot({ id: "snap-test-2", content: changelogAfterFixture, pageCategory: "changelog", url: "https://example.com/changelog" })
    const change = detectChanges(prev, curr)
    expect(change?.changeType).toBe("product")
  })
})
