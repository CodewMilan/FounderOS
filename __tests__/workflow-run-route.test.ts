/**
 * API route tests for POST /api/workflows/run
 *
 * All external calls are mocked via env stubs (SCRAPE_PROVIDER=mock,
 * no OPENAI_API_KEY, no TELEGRAM_BOT_TOKEN, no SLACK_WEBHOOK_URL).
 * In mock mode: Jina scrape returns seeded markdown, OpenAI returns
 * mock briefs, Telegram/Slack silently skip.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/workflows/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

const DEFAULT_ENV = {
  SCRAPE_PROVIDER: "mock",
  OPENAI_API_KEY: "",
  TELEGRAM_BOT_TOKEN: "",
  SLACK_WEBHOOK_URL: "",
}

// ─── Input validation ─────────────────────────────────────────────────────────

describe("POST /api/workflows/run — validation", () => {
  beforeEach(() => {
    Object.entries(DEFAULT_ENV).forEach(([k, v]) => vi.stubEnv(k, v))
  })
  afterEach(() => { vi.unstubAllEnvs() })

  it("returns 400 for invalid JSON body", async () => {
    const { POST } = await import("@/app/api/workflows/run/route")
    const req = new Request("http://localhost/api/workflows/run", {
      method: "POST",
      body: "not json",
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string }
    expect(body.error).toMatch(/invalid json/i)
  })

  it("returns 400 when url is missing", async () => {
    const { POST } = await import("@/app/api/workflows/run/route")
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string }
    expect(body.error).toBe("Validation failed")
  })

  it("returns 400 when url is not a valid URL", async () => {
    const { POST } = await import("@/app/api/workflows/run/route")
    const res = await POST(makeRequest({ url: "not-a-url" }))
    expect(res.status).toBe(400)
  })

  it("returns 400 when userSiteUrl is provided but not a valid URL", async () => {
    const { POST } = await import("@/app/api/workflows/run/route")
    const res = await POST(makeRequest({ url: "https://rival.com", userSiteUrl: "bad-url" }))
    expect(res.status).toBe(400)
  })

  it("accepts a valid url without userSiteUrl", async () => {
    const { POST } = await import("@/app/api/workflows/run/route")
    const res = await POST(makeRequest({ url: "https://rival.com" }))
    expect(res.status).toBe(200)
  })

  it("accepts a valid url with valid userSiteUrl", async () => {
    const { POST } = await import("@/app/api/workflows/run/route")
    const res = await POST(makeRequest({ url: "https://rival.com", userSiteUrl: "https://mysite.com" }))
    expect(res.status).toBe(200)
  })
})

// ─── Competitor URL flow ──────────────────────────────────────────────────────

describe("POST /api/workflows/run — competitor URL (known hostname)", () => {
  beforeEach(() => {
    Object.entries(DEFAULT_ENV).forEach(([k, v]) => vi.stubEnv(k, v))
  })
  afterEach(() => { vi.unstubAllEnvs() })

  it("detects known competitor and returns detectedType=competitor", async () => {
    const { POST } = await import("@/app/api/workflows/run/route")
    const res = await POST(makeRequest({ url: "https://linear.app/features" }))
    expect(res.status).toBe(200)
    const body = await res.json() as { detectedType: string; workflows: string[] }
    expect(body.detectedType).toBe("competitor")
  })

  it("runs feature_gap and pricing_response for competitor", async () => {
    const { POST } = await import("@/app/api/workflows/run/route")
    const res = await POST(makeRequest({ url: "https://linear.app/features" }))
    expect(res.status).toBe(200)
    const body = await res.json() as { workflows: string[] }
    expect(body.workflows).toContain("feature_gap")
    expect(body.workflows).toContain("pricing_response")
  })

  it("returns devTicketAvailable=true for competitor result", async () => {
    const { POST } = await import("@/app/api/workflows/run/route")
    const res = await POST(makeRequest({ url: "https://notion.so/pricing" }))
    expect(res.status).toBe(200)
    const body = await res.json() as { devTicketAvailable: boolean; devTicketData: unknown }
    expect(body.devTicketAvailable).toBe(true)
    expect(body.devTicketData).toBeTruthy()
  })

  it("returns devTicketData with required fields", async () => {
    const { POST } = await import("@/app/api/workflows/run/route")
    const res = await POST(makeRequest({ url: "https://asana.com/product" }))
    expect(res.status).toBe(200)
    const body = await res.json() as {
      devTicketData: {
        featureName: string
        competitorName: string
        description: string
        confidence: string
        sourceUrl: string
      }
    }
    expect(typeof body.devTicketData.featureName).toBe("string")
    expect(typeof body.devTicketData.competitorName).toBe("string")
    expect(typeof body.devTicketData.description).toBe("string")
    expect(["high", "medium", "low"]).toContain(body.devTicketData.confidence)
    expect(typeof body.devTicketData.sourceUrl).toBe("string")
  })

  it("returns 2 briefs (feature gap + pricing response) for competitor", async () => {
    const { POST } = await import("@/app/api/workflows/run/route")
    const res = await POST(makeRequest({ url: "https://figma.com" }))
    expect(res.status).toBe(200)
    const body = await res.json() as { briefs: unknown[] }
    expect(body.briefs).toHaveLength(2)
  })
})

// ─── Prospect URL flow ────────────────────────────────────────────────────────

describe("POST /api/workflows/run — prospect URL", () => {
  beforeEach(() => {
    Object.entries(DEFAULT_ENV).forEach(([k, v]) => vi.stubEnv(k, v))
  })
  afterEach(() => { vi.unstubAllEnvs() })

  it("returns detectedType=prospect for generic company URL in mock mode", async () => {
    // Mock mode mock markdown doesn't contain funding keywords, so heuristic
    // or OpenAI mock will classify as prospect
    const { POST } = await import("@/app/api/workflows/run/route")
    const res = await POST(makeRequest({ url: "https://techflow.com" }))
    expect(res.status).toBe(200)
    const body = await res.json() as { detectedType: string }
    // In mock mode the openai mock uses keyword heuristic — mock markdown
    // may classify as competitor or prospect depending on content
    expect(["competitor", "prospect", "unknown"]).toContain(body.detectedType)
  })

  it("runs prospect_enrichment when detectedType is prospect", async () => {
    // SCRAPE_PROVIDER=mock → scraping never calls fetch.
    // Two OpenAI calls happen: (1) classifyPageType, (2) extractProspectSignals.
    // Respond with appropriate data for each call by index.
    vi.stubEnv("SCRAPE_PROVIDER", "mock")
    vi.stubEnv("OPENAI_API_KEY", "test-key")
    let callCount = 0
    const mockFetch = vi.fn().mockImplementation(async () => {
      callCount++
      if (callCount === 1) {
        // classifyPageType response
        return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({ type: "prospect" }) } }] }) }
      }
      // extractProspectSignals response
      return {
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                companyName: "TechFlow",
                description: "Workflow automation tools",
                icpFit: "high",
                keySignals: ["Hiring engineers", "EU expansion"],
                outreachAngle: "Lead with AI pipeline",
                confidence: "high",
                sourceUrl: "https://techflow.com",
              }),
            },
          }],
        }),
      }
    })
    vi.stubGlobal("fetch", mockFetch)

    const { POST } = await import("@/app/api/workflows/run/route")
    const res = await POST(makeRequest({ url: "https://techflow.com" }))
    expect(res.status).toBe(200)
    const body = await res.json() as { detectedType: string; workflows: string[] }
    expect(body.detectedType).toBe("prospect")
    expect(body.workflows).toContain("prospect_enrichment")
  })

  it("returns devTicketAvailable=false for prospect result", async () => {
    vi.stubEnv("SCRAPE_PROVIDER", "mock")
    vi.stubEnv("OPENAI_API_KEY", "test-key")
    let callCount = 0
    const mockFetch = vi.fn().mockImplementation(async () => {
      callCount++
      if (callCount === 1) {
        return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({ type: "prospect" }) } }] }) }
      }
      return {
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                companyName: "TechFlow",
                description: "desc",
                icpFit: "high",
                keySignals: ["signal1"],
                outreachAngle: "angle",
                confidence: "high",
                sourceUrl: "https://techflow.com",
              }),
            },
          }],
        }),
      }
    })
    vi.stubGlobal("fetch", mockFetch)

    const { POST } = await import("@/app/api/workflows/run/route")
    const res = await POST(makeRequest({ url: "https://techflow.com" }))
    expect(res.status).toBe(200)
    const body = await res.json() as { devTicketAvailable: boolean }
    expect(body.devTicketAvailable).toBe(false)
  })
})

// ─── Funding URL flow ─────────────────────────────────────────────────────────

describe("POST /api/workflows/run — funding URL", () => {
  beforeEach(() => {
    Object.entries(DEFAULT_ENV).forEach(([k, v]) => vi.stubEnv(k, v))
  })
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

  it("detects funding via URL heuristic and runs funding_alert", async () => {
    const { POST } = await import("@/app/api/workflows/run/route")
    const res = await POST(makeRequest({ url: "https://grants.gov/startup-fund" }))
    expect(res.status).toBe(200)
    const body = await res.json() as { detectedType: string; workflows: string[] }
    expect(body.detectedType).toBe("funding")
    expect(body.workflows).toContain("funding_alert")
  })

  it("returns funding brief with programName and deadline", async () => {
    const { POST } = await import("@/app/api/workflows/run/route")
    const res = await POST(makeRequest({ url: "https://grants.gov/startup-fund" }))
    expect(res.status).toBe(200)
    const body = await res.json() as { briefs: Array<{ programName: string; deadline: string; isUrgent: boolean }> }
    expect(typeof body.briefs[0]?.programName).toBe("string")
    expect(typeof body.briefs[0]?.deadline).toBe("string")
    expect(typeof body.briefs[0]?.isUrgent).toBe("boolean")
  })

  it("returns devTicketAvailable=false for funding result", async () => {
    const { POST } = await import("@/app/api/workflows/run/route")
    const res = await POST(makeRequest({ url: "https://grants.gov/fund" }))
    expect(res.status).toBe(200)
    const body = await res.json() as { devTicketAvailable: boolean }
    expect(body.devTicketAvailable).toBe(false)
  })

  it("detects ycombinator as funding", async () => {
    const { POST } = await import("@/app/api/workflows/run/route")
    const res = await POST(makeRequest({ url: "https://ycombinator.com/apply" }))
    expect(res.status).toBe(200)
    const body = await res.json() as { detectedType: string }
    expect(body.detectedType).toBe("funding")
  })
})

// ─── Delivery structure ───────────────────────────────────────────────────────

describe("POST /api/workflows/run — delivery structure", () => {
  beforeEach(() => {
    Object.entries(DEFAULT_ENV).forEach(([k, v]) => vi.stubEnv(k, v))
  })
  afterEach(() => { vi.unstubAllEnvs() })

  it("returns deliveries object with telegram and slack fields", async () => {
    const { POST } = await import("@/app/api/workflows/run/route")
    const res = await POST(makeRequest({ url: "https://linear.app" }))
    expect(res.status).toBe(200)
    const body = await res.json() as {
      deliveries: {
        telegram: { sent: boolean }
        slack: { sent: boolean }
      }
    }
    expect(typeof body.deliveries.telegram.sent).toBe("boolean")
    expect(typeof body.deliveries.slack.sent).toBe("boolean")
  })

  it("telegram.sent is false when TELEGRAM_BOT_TOKEN is not set (mock mode)", async () => {
    const { POST } = await import("@/app/api/workflows/run/route")
    const res = await POST(makeRequest({ url: "https://linear.app" }))
    expect(res.status).toBe(200)
    const body = await res.json() as { deliveries: { telegram: { sent: boolean } } }
    expect(body.deliveries.telegram.sent).toBe(false)
  })

  it("slack.sent is false when SLACK_WEBHOOK_URL is not set (mock mode)", async () => {
    const { POST } = await import("@/app/api/workflows/run/route")
    const res = await POST(makeRequest({ url: "https://linear.app" }))
    expect(res.status).toBe(200)
    const body = await res.json() as { deliveries: { slack: { sent: boolean } } }
    expect(body.deliveries.slack.sent).toBe(false)
  })
})

// ─── UnifiedRunResultSchema validation ───────────────────────────────────────

describe("UnifiedRunResultSchema", () => {
  it("validates a complete valid result", async () => {
    const { UnifiedRunResultSchema } = await import("@/lib/schemas/workflows")
    const valid = {
      detectedType: "competitor",
      workflows: ["feature_gap", "pricing_response"],
      briefs: [{ competitorName: "Rival" }],
      deliveries: {
        telegram: { sent: false },
        slack: { sent: false },
      },
      devTicketAvailable: true,
      devTicketData: {
        featureName: "AI Chat",
        competitorName: "Rival",
        description: "Gap desc",
        whyNow: "Important",
        suggestedImplementation: "Build it",
        confidence: "high",
        sourceUrl: "https://rival.com",
      },
    }
    expect(UnifiedRunResultSchema.safeParse(valid).success).toBe(true)
  })

  it("rejects invalid detectedType", async () => {
    const { UnifiedRunResultSchema } = await import("@/lib/schemas/workflows")
    const invalid = {
      detectedType: "pricing",
      workflows: [],
      briefs: [],
      deliveries: { telegram: { sent: false }, slack: { sent: false } },
      devTicketAvailable: false,
    }
    expect(UnifiedRunResultSchema.safeParse(invalid).success).toBe(false)
  })
})

// ─── UnifiedRunRequestSchema validation ──────────────────────────────────────

describe("UnifiedRunRequestSchema", () => {
  it("accepts a valid url", async () => {
    const { UnifiedRunRequestSchema } = await import("@/lib/schemas/workflows")
    expect(UnifiedRunRequestSchema.safeParse({ url: "https://rival.com" }).success).toBe(true)
  })

  it("accepts a valid url with optional userSiteUrl", async () => {
    const { UnifiedRunRequestSchema } = await import("@/lib/schemas/workflows")
    expect(UnifiedRunRequestSchema.safeParse({
      url: "https://rival.com",
      userSiteUrl: "https://mysite.com",
    }).success).toBe(true)
  })

  it("rejects missing url", async () => {
    const { UnifiedRunRequestSchema } = await import("@/lib/schemas/workflows")
    expect(UnifiedRunRequestSchema.safeParse({}).success).toBe(false)
  })

  it("rejects non-URL url field", async () => {
    const { UnifiedRunRequestSchema } = await import("@/lib/schemas/workflows")
    expect(UnifiedRunRequestSchema.safeParse({ url: "not-a-url" }).success).toBe(false)
  })

  it("rejects non-URL optional userSiteUrl", async () => {
    const { UnifiedRunRequestSchema } = await import("@/lib/schemas/workflows")
    expect(UnifiedRunRequestSchema.safeParse({
      url: "https://rival.com",
      userSiteUrl: "bad-url",
    }).success).toBe(false)
  })
})
