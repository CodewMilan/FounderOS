import { describe, it, expect } from "vitest"
import {
  detectPageCategory,
  extractCompetitorName,
  extractPricingPlans,
  extractOpenRoles,
  extractHeadline,
  extractKeyMessages,
  extractCompetitorPage,
} from "@/lib/competitors/extractor"
import {
  pricingAfterFixture,
  hiringAfterFixture,
  changelogAfterFixture,
} from "@/lib/competitors/snapshots"
import type { RawExtraction } from "@/lib/schemas"

// ─── detectPageCategory ───────────────────────────────────────────────────────

describe("detectPageCategory", () => {
  it("detects 'pricing' from /pricing URL", () => {
    expect(detectPageCategory("https://linear.app/pricing", "")).toBe("pricing")
  })

  it("detects 'pricing' from /plans URL", () => {
    expect(detectPageCategory("https://example.com/plans", "")).toBe("pricing")
  })

  it("detects 'careers' from /careers URL", () => {
    expect(detectPageCategory("https://vercel.com/careers", "")).toBe("careers")
  })

  it("detects 'careers' from /jobs URL", () => {
    expect(detectPageCategory("https://example.com/jobs", "")).toBe("careers")
  })

  it("detects 'changelog' from /changelog URL", () => {
    expect(detectPageCategory("https://notion.so/changelog", "")).toBe("changelog")
  })

  it("detects 'changelog' from /releases URL", () => {
    expect(detectPageCategory("https://example.com/releases", "")).toBe("changelog")
  })

  it("detects 'blog' from /blog URL", () => {
    expect(detectPageCategory("https://figma.com/blog/announcement", "")).toBe("blog")
  })

  it("defaults to 'homepage' for unknown URL", () => {
    expect(detectPageCategory("https://example.com/about", "")).toBe("homepage")
  })

  it("detects 'pricing' from content signals when URL has no hint", () => {
    const content = "Our plans start at $12/seat per month"
    expect(detectPageCategory("https://example.com", content)).toBe("pricing")
  })

  it("detects 'careers' from content signals", () => {
    const content = "Join our team — we are hiring across all departments."
    expect(detectPageCategory("https://example.com/team", content)).toBe("careers")
  })

  it("detects 'changelog' from content signals", () => {
    const content = "# Changelog\nRelease notes for all versions."
    expect(detectPageCategory("https://example.com", content)).toBe("changelog")
  })
})

// ─── extractCompetitorName ────────────────────────────────────────────────────

describe("extractCompetitorName", () => {
  it("extracts name from page title", () => {
    expect(extractCompetitorName("https://linear.app/pricing", "Linear — Pricing")).toBe("Linear")
  })

  it("extracts name from domain when no title", () => {
    expect(extractCompetitorName("https://www.notion.so/pricing", undefined)).toBe("Notion")
  })

  it("capitalises the domain name", () => {
    expect(extractCompetitorName("https://vercel.com/careers", undefined)).toBe("Vercel")
  })

  it("uses title over domain", () => {
    expect(extractCompetitorName("https://example.com", "Acme Corp | Pricing")).toBe("Acme Corp")
  })
})

// ─── extractPricingPlans ──────────────────────────────────────────────────────

describe("extractPricingPlans", () => {
  it("extracts plan names from the pricing fixture", () => {
    const plans = extractPricingPlans(pricingAfterFixture)
    expect(plans.length).toBeGreaterThan(0)
    const names = plans.map((p) => p.name)
    expect(names).toContain("Free")
    expect(names).toContain("Pro")
    expect(names).toContain("Business")
  })

  it("extracts prices from plan sections", () => {
    const plans = extractPricingPlans(pricingAfterFixture)
    const pro = plans.find((p) => p.name === "Pro")
    expect(pro?.price).toBeDefined()
    expect(pro?.price).toMatch(/\$/)
  })

  it("extracts features as bullet-point items", () => {
    const markdown = `
## Pro
$12/seat/month

- Unlimited projects
- Priority support
- All integrations
`
    const plans = extractPricingPlans(markdown)
    expect(plans[0].features).toContain("Unlimited projects")
    expect(plans[0].features).toContain("Priority support")
  })

  it("handles markdown with no plans gracefully", () => {
    const plans = extractPricingPlans("Just some text with no headings.")
    expect(Array.isArray(plans)).toBe(true)
    expect(plans.length).toBe(0)
  })
})

// ─── extractOpenRoles ─────────────────────────────────────────────────────────

describe("extractOpenRoles", () => {
  it("extracts job titles from the hiring fixture", () => {
    const roles = extractOpenRoles(hiringAfterFixture)
    expect(roles.length).toBeGreaterThan(0)
  })

  it("assigns departments from section headings", () => {
    const roles = extractOpenRoles(hiringAfterFixture)
    const engineeringRoles = roles.filter((r) => r.department === "Engineering")
    expect(engineeringRoles.length).toBeGreaterThan(0)
  })

  it("extracts location from parentheses", () => {
    const roles = extractOpenRoles(hiringAfterFixture)
    const remoteRole = roles.find((r) => r.location === "Remote")
    expect(remoteRole).toBeDefined()
  })

  it("strips location from the title", () => {
    const roles = extractOpenRoles(hiringAfterFixture)
    for (const role of roles) {
      expect(role.title).not.toContain("(Remote)")
      expect(role.title).not.toContain("(New York)")
    }
  })

  it("returns empty array for non-careers content", () => {
    const roles = extractOpenRoles("# Pricing\n\n## Pro\n$12/month")
    expect(roles).toHaveLength(0)
  })
})

// ─── extractHeadline ─────────────────────────────────────────────────────────

describe("extractHeadline", () => {
  it("extracts an H1 heading", () => {
    const md = "# The Smartest Way to Manage Your Workflow\n\nSome content"
    expect(extractHeadline(md)).toBe("The Smartest Way to Manage Your Workflow")
  })

  it("returns undefined when no H1 exists", () => {
    expect(extractHeadline("## Not a top-level heading")).toBeUndefined()
  })
})

// ─── extractKeyMessages ───────────────────────────────────────────────────────

describe("extractKeyMessages", () => {
  it("extracts H2 headings as key messages", () => {
    const md = "# Product\n\n## Core features\nContent here\n\n## Integrations\nMore content"
    const messages = extractKeyMessages(md)
    expect(messages).toContain("Core features")
    expect(messages).toContain("Integrations")
  })

  it("returns at most 5 messages", () => {
    const sections = Array.from({ length: 10 }, (_, i) => `## Section ${i}\nContent`).join("\n")
    const messages = extractKeyMessages(sections)
    expect(messages.length).toBeLessThanOrEqual(5)
  })
})

// ─── extractCompetitorPage ────────────────────────────────────────────────────

describe("extractCompetitorPage", () => {
  const makeExtraction = (url: string, markdown: string): RawExtraction => ({
    id: "re-test",
    sourceId: "src-test",
    url,
    fetchedAt: "2026-05-10T10:00:00.000Z",
    contentType: "markdown",
    markdown,
    textPreview: markdown.slice(0, 200),
    status: "ok",
  })

  it("returns a pricing extraction for a pricing URL", () => {
    const ex = makeExtraction("https://example.com/pricing", pricingAfterFixture)
    const result = extractCompetitorPage(ex)
    expect(result.pageCategory).toBe("pricing")
    expect(result.plans).toBeDefined()
    expect(result.plans!.length).toBeGreaterThan(0)
  })

  it("returns a careers extraction for a careers URL", () => {
    const ex = makeExtraction("https://example.com/careers", hiringAfterFixture)
    const result = extractCompetitorPage(ex)
    expect(result.pageCategory).toBe("careers")
    expect(result.openRoles).toBeDefined()
    expect(result.openRoles!.length).toBeGreaterThan(0)
  })

  it("returns a changelog extraction for a changelog URL", () => {
    const ex = makeExtraction("https://example.com/changelog", changelogAfterFixture)
    const result = extractCompetitorPage(ex)
    expect(result.pageCategory).toBe("changelog")
  })

  it("sets sourceId from the extraction", () => {
    const ex = makeExtraction("https://example.com/pricing", pricingAfterFixture)
    const result = extractCompetitorPage(ex, "ExampleCo")
    expect(result.sourceId).toBe("src-test")
  })

  it("uses the provided competitorName override", () => {
    const ex = makeExtraction("https://example.com/pricing", pricingAfterFixture)
    const result = extractCompetitorPage(ex, "MyCompetitor")
    expect(result.competitorName).toBe("MyCompetitor")
  })

  it("includes a headline when H1 exists in content", () => {
    const ex = makeExtraction("https://example.com/pricing", "# Welcome\n\n## Pro\n$10/month")
    const result = extractCompetitorPage(ex)
    expect(result.headline).toBe("Welcome")
  })

  it("result has required fields", () => {
    const ex = makeExtraction("https://example.com/pricing", pricingAfterFixture)
    const result = extractCompetitorPage(ex)
    expect(result.id).toBeDefined()
    expect(result.extractedAt).toBe("2026-05-10T10:00:00.000Z")
    expect(result.rawContent).toBe(pricingAfterFixture)
  })
})
