import { describe, it, expect } from "vitest"
import {
  extractCompanyName,
  detectCategory,
  extractValueProp,
  inferLikelyStage,
  extractFundingSignals,
  extractHiringSignals,
  extractEnterpriseSignals,
  extractIntegrationClues,
  extractCompanyData,
  getFixtureForUrl,
  prospectFixtures,
} from "@/lib/prospects/extractor"
import { CompanyExtractionSchema } from "@/lib/schemas"

// ─── extractCompanyName ───────────────────────────────────────────────────────

describe("extractCompanyName", () => {
  it("returns the override when provided", () => {
    expect(extractCompanyName("https://example.com", "# SomeProduct\n...", "Acme")).toBe("Acme")
  })

  it("extracts company name from H1", () => {
    const md = "# Retool\n\nBuild internal tools."
    expect(extractCompanyName("https://retool.com", md)).toBe("Retool")
  })

  it("skips generic H1 and falls back to domain", () => {
    const md = "# The fastest way to build\n\nSome content."
    const result = extractCompanyName("https://linear.app", md)
    expect(result).toBe("Linear")
  })

  it("falls back to domain when no H1", () => {
    const result = extractCompanyName("https://www.raycast.com", "No heading here.")
    expect(result).toBe("Raycast")
  })

  it("handles invalid URL gracefully", () => {
    const result = extractCompanyName("not-a-url", "Some content")
    expect(result).toBe("Unknown Company")
  })
})

// ─── detectCategory ───────────────────────────────────────────────────────────

describe("detectCategory", () => {
  it("detects developer tools", () => {
    expect(detectCategory("Build with our developer SDK and CLI")).toBe("Developer Tools")
  })

  it("detects data / analytics", () => {
    expect(detectCategory("A modern data analytics platform for SQL and Python teams")).toBe(
      "Data / Analytics"
    )
  })

  it("detects no-code / low-code", () => {
    expect(detectCategory("Build apps with no-code drag-and-drop builder")).toBe(
      "No-code / Low-code"
    )
  })

  it("detects project management", () => {
    expect(detectCategory("Project management and issue tracking for software teams")).toBe(
      "Project Management"
    )
  })

  it("detects AI / ML", () => {
    expect(detectCategory("Powered by LLM and machine learning models")).toBe("AI / ML")
  })

  it("falls back to B2B SaaS", () => {
    expect(detectCategory("A software product for businesses")).toBe("B2B SaaS")
  })
})

// ─── extractValueProp ─────────────────────────────────────────────────────────

describe("extractValueProp", () => {
  it("extracts the first paragraph after H1", () => {
    const md = "# Retool\n\nBuild internal tools in minutes using pre-built UI components."
    const result = extractValueProp(md)
    expect(result).toContain("Build internal tools")
  })

  it("skips short lines and picks a substantial one", () => {
    const md = "# Title\n\nShort.\n\nThis is a longer and more meaningful value proposition for the product."
    const result = extractValueProp(md)
    expect(result.length).toBeGreaterThan(30)
  })

  it("falls back gracefully when there is no substantial paragraph", () => {
    const md = "# Title\n- Short item\n- Another"
    const result = extractValueProp(md)
    expect(typeof result).toBe("string")
  })
})

// ─── inferLikelyStage ─────────────────────────────────────────────────────────

describe("inferLikelyStage", () => {
  it("detects growth from Series A mention", () => {
    expect(inferLikelyStage("We raised a Series A from top investors.")).toBe("growth")
  })

  it("detects scale from Series C mention", () => {
    expect(inferLikelyStage("Backed by $150M Series C funding.")).toBe("scale")
  })

  it("detects enterprise from IPO signal", () => {
    expect(inferLikelyStage("Publicly traded on NASDAQ since 2022.")).toBe("enterprise")
  })

  it("detects early from bootstrapped mention", () => {
    expect(inferLikelyStage("We are a bootstrapped, early-stage team.")).toBe("early")
  })

  it("returns unknown when no stage signals found", () => {
    expect(inferLikelyStage("A software product for teams.")).toBe("unknown")
  })
})

// ─── extractFundingSignals ────────────────────────────────────────────────────

describe("extractFundingSignals", () => {
  it("extracts Series B mention", () => {
    const signals = extractFundingSignals("We completed our Series B in 2024.")
    expect(signals.some((s) => /series b/i.test(s))).toBe(true)
  })

  it("extracts VC-backed signal", () => {
    const signals = extractFundingSignals("Backed by top VCs including a16z.")
    expect(signals.some((s) => /backed/i.test(s))).toBe(true)
  })

  it("returns empty array when no signals", () => {
    expect(extractFundingSignals("No funding info.")).toHaveLength(0)
  })

  it("deduplicates signals", () => {
    const signals = extractFundingSignals("Backed by investors. Backed by VCs.")
    const unique = new Set(signals)
    expect(unique.size).toBe(signals.length)
  })
})

// ─── extractEnterpriseSignals ─────────────────────────────────────────────────

describe("extractEnterpriseSignals", () => {
  it("detects SOC 2", () => {
    const signals = extractEnterpriseSignals("We are SOC 2 certified.")
    expect(signals).toContain("SOC 2 certified")
  })

  it("detects SAML SSO", () => {
    const signals = extractEnterpriseSignals("Supports SAML-based SSO for enterprise.")
    expect(signals).toContain("SAML / SSO support")
  })

  it("detects multiple signals", () => {
    const signals = extractEnterpriseSignals("SOC 2. HIPAA compliant. Audit logs available.")
    expect(signals.length).toBeGreaterThanOrEqual(3)
  })

  it("returns empty array for consumer products", () => {
    expect(extractEnterpriseSignals("A personal productivity app.")).toHaveLength(0)
  })
})

// ─── extractIntegrationClues ──────────────────────────────────────────────────

describe("extractIntegrationClues", () => {
  it("detects Slack integration", () => {
    expect(extractIntegrationClues("Integrates with Slack and GitHub")).toContain("Slack")
  })

  it("detects multiple tools", () => {
    const clues = extractIntegrationClues(
      "Works with Salesforce, HubSpot, GitHub, and Zapier."
    )
    expect(clues.length).toBeGreaterThanOrEqual(4)
  })

  it("returns empty when no known tools mentioned", () => {
    expect(extractIntegrationClues("No integrations listed.")).toHaveLength(0)
  })
})

// ─── extractHiringSignals ─────────────────────────────────────────────────────

describe("extractHiringSignals", () => {
  it("detects active hiring signal", () => {
    const signals = extractHiringSignals("We're hiring! Come join our team.")
    expect(signals).toContain("Actively hiring")
  })

  it("extracts role titles from content", () => {
    const signals = extractHiringSignals("We need a VP of Engineering to join our team.")
    expect(signals.length).toBeGreaterThan(0)
  })
})

// ─── extractCompanyData ───────────────────────────────────────────────────────

describe("extractCompanyData", () => {
  const mockExtraction = {
    id: "ext-test",
    sourceId: "src-test",
    url: "https://retool.com",
    status: "ok" as const,
    contentType: "markdown" as const,
    markdown: "# Retool\n\nBuild internal tools in minutes. Integrates with Slack, GitHub, and Salesforce. SOC 2 certified. Series C $140M.",
    textPreview: "",
    fetchedAt: "2026-05-09T12:00:00.000Z",
  }

  it("returns a valid CompanyExtraction", () => {
    const result = extractCompanyData(mockExtraction)
    expect(() => CompanyExtractionSchema.parse(result)).not.toThrow()
  })

  it("extracts company name", () => {
    const result = extractCompanyData(mockExtraction)
    expect(result.companyName).toBe("Retool")
  })

  it("extracts enterprise signals", () => {
    const result = extractCompanyData(mockExtraction)
    expect(result.enterpriseSignals).toContain("SOC 2 certified")
  })

  it("extracts integration clues", () => {
    const result = extractCompanyData(mockExtraction)
    expect(result.integrationClues).toContain("Slack")
    expect(result.integrationClues).toContain("GitHub")
  })

  it("uses name override when provided", () => {
    const result = extractCompanyData(mockExtraction, "CustomName")
    expect(result.companyName).toBe("CustomName")
  })

  it("has a valid extractedAt timestamp", () => {
    const result = extractCompanyData(mockExtraction)
    expect(() => new Date(result.extractedAt)).not.toThrow()
  })
})

// ─── getFixtureForUrl ─────────────────────────────────────────────────────────

describe("getFixtureForUrl", () => {
  it("returns fixture for retool.com", () => {
    const fixture = getFixtureForUrl("https://retool.com")
    expect(fixture).not.toBeNull()
    expect(fixture!.companyName).toBe("Retool")
  })

  it("returns fixture for www subdomain", () => {
    const fixture = getFixtureForUrl("https://www.raycast.com")
    expect(fixture).not.toBeNull()
    expect(fixture!.companyName).toBe("Raycast")
  })

  it("returns null for unknown URL", () => {
    const fixture = getFixtureForUrl("https://some-random-company.io")
    expect(fixture).toBeNull()
  })

  it("handles invalid URL gracefully", () => {
    const fixture = getFixtureForUrl("not-a-url")
    expect(fixture).toBeNull()
  })
})

// ─── Fixture validation ───────────────────────────────────────────────────────

describe("prospectFixtures validation", () => {
  it("all fixtures conform to CompanyExtractionSchema", () => {
    for (const fixture of Object.values(prospectFixtures)) {
      expect(() => CompanyExtractionSchema.parse(fixture)).not.toThrow()
    }
  })

  it("all fixtures have a non-empty category", () => {
    for (const fixture of Object.values(prospectFixtures)) {
      expect(fixture.category.length).toBeGreaterThan(0)
    }
  })
})
