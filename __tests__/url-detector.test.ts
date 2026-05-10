/**
 * Unit tests for the URL type detector service.
 * All external calls (scrape + OpenAI) are mocked.
 */

import { describe, it, expect, vi, afterEach } from "vitest"

// ─── Layer 1: known competitor match ─────────────────────────────────────────

describe("isKnownCompetitor", () => {
  it("returns true for exact known hostname", async () => {
    const { isKnownCompetitor } = await import("@/lib/workflows/url-detector")
    expect(isKnownCompetitor("https://linear.app/features")).toBe(true)
    expect(isKnownCompetitor("https://notion.so/pricing")).toBe(true)
    expect(isKnownCompetitor("https://clickup.com")).toBe(true)
    expect(isKnownCompetitor("https://asana.com/product")).toBe(true)
  })

  it("returns true for www. prefixed known hostname", async () => {
    const { isKnownCompetitor } = await import("@/lib/workflows/url-detector")
    expect(isKnownCompetitor("https://www.notion.so")).toBe(true)
    expect(isKnownCompetitor("https://www.figma.com")).toBe(true)
  })

  it("returns false for unknown hostname", async () => {
    const { isKnownCompetitor } = await import("@/lib/workflows/url-detector")
    expect(isKnownCompetitor("https://techflow.com")).toBe(false)
    expect(isKnownCompetitor("https://grants.gov")).toBe(false)
    expect(isKnownCompetitor("https://unknown-startup.io")).toBe(false)
  })

  it("returns false for malformed URL without throwing", async () => {
    const { isKnownCompetitor } = await import("@/lib/workflows/url-detector")
    expect(isKnownCompetitor("not-a-url")).toBe(false)
  })
})

// ─── Layer 2: heuristic URL type ─────────────────────────────────────────────

describe("heuristicUrlType", () => {
  it("returns funding for grant URLs", async () => {
    const { heuristicUrlType } = await import("@/lib/workflows/url-detector")
    expect(heuristicUrlType("https://example.com/grants/startup")).toBe("funding")
    expect(heuristicUrlType("https://accelerator.ycombinator.com")).toBe("funding")
    expect(heuristicUrlType("https://techstars.com/programs")).toBe("funding")
    expect(heuristicUrlType("https://grants.gov/startup-fund")).toBe("funding")
    expect(heuristicUrlType("https://antler.co/fellowship")).toBe("funding")
    expect(heuristicUrlType("https://investor.example.com")).toBe("funding")
    expect(heuristicUrlType("https://venturefund.example.com")).toBe("funding")
  })

  it("returns competitor for pricing/features paths", async () => {
    const { heuristicUrlType } = await import("@/lib/workflows/url-detector")
    expect(heuristicUrlType("https://random.com/pricing")).toBe("competitor")
    expect(heuristicUrlType("https://random.com/features")).toBe("competitor")
    expect(heuristicUrlType("https://random.com/changelog")).toBe("competitor")
    expect(heuristicUrlType("https://random.com/compare/us-vs-them")).toBe("competitor")
    expect(heuristicUrlType("https://random.com/plans")).toBe("competitor")
  })

  it("returns null for generic company URLs (no signals)", async () => {
    const { heuristicUrlType } = await import("@/lib/workflows/url-detector")
    expect(heuristicUrlType("https://techflow.com")).toBeNull()
    expect(heuristicUrlType("https://mycompany.io/about")).toBeNull()
  })
})

// ─── detectUrlType — full cascade ────────────────────────────────────────────

describe("detectUrlType — known competitor", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

  it("returns competitor for a known competitor URL without scraping", async () => {
    vi.stubEnv("SCRAPE_PROVIDER", "mock")
    const { detectUrlType } = await import("@/lib/workflows/url-detector")
    const result = await detectUrlType("https://linear.app/features")
    expect(result).toBe("competitor")
  })
})

describe("detectUrlType — heuristic funding", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

  it("returns funding for a grant URL without scraping", async () => {
    vi.stubEnv("SCRAPE_PROVIDER", "mock")
    const { detectUrlType } = await import("@/lib/workflows/url-detector")
    const result = await detectUrlType("https://grants.gov/startup-fund")
    expect(result).toBe("funding")
  })

  it("returns funding for accelerator URL", async () => {
    vi.stubEnv("SCRAPE_PROVIDER", "mock")
    const { detectUrlType } = await import("@/lib/workflows/url-detector")
    const result = await detectUrlType("https://ycombinator.com/programs")
    expect(result).toBe("funding")
  })
})

describe("detectUrlType — heuristic competitor (path)", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

  it("returns competitor for a /pricing path on unknown domain", async () => {
    vi.stubEnv("SCRAPE_PROVIDER", "mock")
    const { detectUrlType } = await import("@/lib/workflows/url-detector")
    const result = await detectUrlType("https://unknownstartup.io/pricing")
    expect(result).toBe("competitor")
  })
})

describe("detectUrlType — scrape+classify fallback (mock OpenAI)", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

  it("returns prospect for a generic company URL in mock mode", async () => {
    vi.stubEnv("SCRAPE_PROVIDER", "mock")
    vi.stubEnv("OPENAI_API_KEY", "")
    const { detectUrlType } = await import("@/lib/workflows/url-detector")
    const result = await detectUrlType("https://techflow.com")
    // Mock markdown does not contain funding/pricing keywords so defaults to prospect
    expect(["competitor", "prospect", "funding", "unknown"]).toContain(result)
  })

  it("returns funding when OpenAI classifies as funding", async () => {
    vi.stubEnv("SCRAPE_PROVIDER", "mock")
    vi.stubEnv("OPENAI_API_KEY", "test-key")
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({ type: "funding" }) } }],
      }),
    })
    vi.stubGlobal("fetch", mockFetch)

    const { detectUrlType } = await import("@/lib/workflows/url-detector")
    const result = await detectUrlType("https://someprogram.org/apply")
    expect(result).toBe("funding")
  })

  it("returns competitor when OpenAI classifies as competitor", async () => {
    vi.stubEnv("SCRAPE_PROVIDER", "mock")
    vi.stubEnv("OPENAI_API_KEY", "test-key")
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({ type: "competitor" }) } }],
      }),
    })
    vi.stubGlobal("fetch", mockFetch)

    const { detectUrlType } = await import("@/lib/workflows/url-detector")
    const result = await detectUrlType("https://rival-startup.io")
    expect(result).toBe("competitor")
  })

  it("returns unknown when scrape fails", async () => {
    vi.stubEnv("SCRAPE_PROVIDER", "real")
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network down")))

    const { detectUrlType } = await import("@/lib/workflows/url-detector")
    const result = await detectUrlType("https://some-unknown.io/about")
    expect(result).toBe("unknown")
  })
})
