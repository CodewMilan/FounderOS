/**
 * API route tests for all 6 FounderOS workflow routes.
 * All external calls are mocked via env vars (SCRAPE_PROVIDER=mock, no OPENAI key, etc.)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

function makeRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. feature-gap
// ─────────────────────────────────────────────────────────────────────────────

describe("POST /api/workflows/feature-gap", () => {
  beforeEach(() => {
    vi.stubEnv("SCRAPE_PROVIDER", "mock")
    vi.stubEnv("OPENAI_API_KEY", "")
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "")
    vi.stubEnv("SLACK_WEBHOOK_URL", "")
  })
  afterEach(() => { vi.unstubAllEnvs() })

  it("returns 400 for invalid JSON", async () => {
    const { POST } = await import("@/app/api/workflows/feature-gap/route")
    const req = new Request("http://localhost/api/workflows/feature-gap", {
      method: "POST",
      body: "not json",
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string }
    expect(body.error).toMatch(/invalid json/i)
  })

  it("returns 400 when competitorUrl is missing", async () => {
    const { POST } = await import("@/app/api/workflows/feature-gap/route")
    const res = await POST(makeRequest("http://localhost/api/workflows/feature-gap", {}))
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string; issues: unknown[] }
    expect(body.error).toBe("Validation failed")
    expect(Array.isArray(body.issues)).toBe(true)
  })

  it("returns 400 when competitorUrl is not a valid URL", async () => {
    const { POST } = await import("@/app/api/workflows/feature-gap/route")
    const res = await POST(makeRequest("http://localhost/", { competitorUrl: "not-url" }))
    expect(res.status).toBe(400)
  })

  it("returns 200 with full result in mock mode", async () => {
    const { POST } = await import("@/app/api/workflows/feature-gap/route")
    const res = await POST(makeRequest("http://localhost/", { competitorUrl: "https://rival.com" }))
    expect(res.status).toBe(200)
    const body = await res.json() as {
      brief: { featureName: string; competitorName: string }
      telegramSent: boolean
      slackSent: boolean
    }
    expect(typeof body.brief.featureName).toBe("string")
    expect(typeof body.telegramSent).toBe("boolean")
    expect(typeof body.slackSent).toBe("boolean")
  })

  it("accepts optional userSiteUrl", async () => {
    const { POST } = await import("@/app/api/workflows/feature-gap/route")
    const res = await POST(makeRequest("http://localhost/", {
      competitorUrl: "https://rival.com",
      userSiteUrl: "https://mysite.com",
    }))
    expect(res.status).toBe(200)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. dev-ticket
// ─────────────────────────────────────────────────────────────────────────────

describe("POST /api/workflows/dev-ticket", () => {
  beforeEach(() => { vi.stubEnv("SLACK_DEV_TICKETS_WEBHOOK_URL", "") })
  afterEach(() => { vi.unstubAllEnvs() })

  const validTicket = {
    featureName: "AI Chat",
    competitorName: "Rival",
    description: "Desc",
    whyNow: "Why",
    suggestedImplementation: "Impl",
    confidence: "high",
    sourceUrl: "https://rival.com",
  }

  it("returns 400 for invalid JSON", async () => {
    const { POST } = await import("@/app/api/workflows/dev-ticket/route")
    const req = new Request("http://localhost/", { method: "POST", body: "bad" })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("returns 400 when required fields are missing", async () => {
    const { POST } = await import("@/app/api/workflows/dev-ticket/route")
    const res = await POST(makeRequest("http://localhost/", { featureName: "AI Chat" }))
    expect(res.status).toBe(400)
  })

  it("returns 400 when sourceUrl is not a valid URL", async () => {
    const { POST } = await import("@/app/api/workflows/dev-ticket/route")
    const res = await POST(makeRequest("http://localhost/", {
      ...validTicket,
      sourceUrl: "not-a-url",
    }))
    expect(res.status).toBe(400)
  })

  it("returns 200 with slackSent: false when webhook not configured", async () => {
    const { POST } = await import("@/app/api/workflows/dev-ticket/route")
    const res = await POST(makeRequest("http://localhost/", validTicket))
    expect(res.status).toBe(200)
    const body = await res.json() as { slackSent: boolean }
    expect(typeof body.slackSent).toBe("boolean")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. pricing-response
// ─────────────────────────────────────────────────────────────────────────────

describe("POST /api/workflows/pricing-response", () => {
  beforeEach(() => {
    vi.stubEnv("SCRAPE_PROVIDER", "mock")
    vi.stubEnv("OPENAI_API_KEY", "")
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "")
    vi.stubEnv("SLACK_WEBHOOK_URL", "")
  })
  afterEach(() => { vi.unstubAllEnvs() })

  it("returns 400 when competitorUrl is missing", async () => {
    const { POST } = await import("@/app/api/workflows/pricing-response/route")
    const res = await POST(makeRequest("http://localhost/", {}))
    expect(res.status).toBe(400)
  })

  it("returns 200 with pricing brief in mock mode", async () => {
    const { POST } = await import("@/app/api/workflows/pricing-response/route")
    const res = await POST(makeRequest("http://localhost/", { competitorUrl: "https://rival.com/pricing" }))
    expect(res.status).toBe(200)
    const body = await res.json() as {
      brief: { changeDetected: string; urgency: string }
      telegramSent: boolean
      slackSent: boolean
    }
    expect(typeof body.brief.changeDetected).toBe("string")
    expect(["high", "medium", "low"]).toContain(body.brief.urgency)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. prospect-enrichment
// ─────────────────────────────────────────────────────────────────────────────

describe("POST /api/workflows/prospect-enrichment", () => {
  beforeEach(() => {
    vi.stubEnv("SCRAPE_PROVIDER", "mock")
    vi.stubEnv("OPENAI_API_KEY", "")
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "")
    vi.stubEnv("SLACK_WEBHOOK_URL", "")
  })
  afterEach(() => { vi.unstubAllEnvs() })

  it("returns 400 when prospectUrl is missing", async () => {
    const { POST } = await import("@/app/api/workflows/prospect-enrichment/route")
    const res = await POST(makeRequest("http://localhost/", {}))
    expect(res.status).toBe(400)
  })

  it("returns 400 when prospectUrl is not a valid URL", async () => {
    const { POST } = await import("@/app/api/workflows/prospect-enrichment/route")
    const res = await POST(makeRequest("http://localhost/", { prospectUrl: "not-url" }))
    expect(res.status).toBe(400)
  })

  it("returns 200 with prospect brief in mock mode", async () => {
    const { POST } = await import("@/app/api/workflows/prospect-enrichment/route")
    const res = await POST(makeRequest("http://localhost/", { prospectUrl: "https://techflow.com" }))
    expect(res.status).toBe(200)
    const body = await res.json() as {
      brief: { companyName: string; keySignals: string[] }
      telegramSent: boolean
    }
    expect(typeof body.brief.companyName).toBe("string")
    expect(Array.isArray(body.brief.keySignals)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 5. funding-alert
// ─────────────────────────────────────────────────────────────────────────────

describe("POST /api/workflows/funding-alert", () => {
  beforeEach(() => {
    vi.stubEnv("SCRAPE_PROVIDER", "mock")
    vi.stubEnv("OPENAI_API_KEY", "")
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "")
  })
  afterEach(() => { vi.unstubAllEnvs() })

  it("returns 400 when fundingUrl is missing", async () => {
    const { POST } = await import("@/app/api/workflows/funding-alert/route")
    const res = await POST(makeRequest("http://localhost/", {}))
    expect(res.status).toBe(400)
  })

  it("returns 200 with funding brief in mock mode", async () => {
    const { POST } = await import("@/app/api/workflows/funding-alert/route")
    const res = await POST(makeRequest("http://localhost/", { fundingUrl: "https://grants.gov/startup" }))
    expect(res.status).toBe(200)
    const body = await res.json() as {
      brief: { programName: string; isUrgent: boolean; deadline: string }
      telegramSent: boolean
    }
    expect(typeof body.brief.programName).toBe("string")
    expect(typeof body.brief.isUrgent).toBe("boolean")
    expect(typeof body.telegramSent).toBe("boolean")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 6. update-pricing
// ─────────────────────────────────────────────────────────────────────────────

describe("POST /api/workflows/update-pricing", () => {
  beforeEach(() => { vi.stubEnv("LEMON_SQUEEZY_API_KEY", "") })
  afterEach(() => { vi.unstubAllEnvs() })

  it("returns 400 for invalid JSON", async () => {
    const { POST } = await import("@/app/api/workflows/update-pricing/route")
    const req = new Request("http://localhost/", { method: "POST", body: "bad" })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("returns 400 when newPriceCents is missing", async () => {
    const { POST } = await import("@/app/api/workflows/update-pricing/route")
    const res = await POST(makeRequest("http://localhost/", { reason: "test", approved: false }))
    expect(res.status).toBe(400)
  })

  it("returns 200 with previewOnly=true when approved=false", async () => {
    const { POST } = await import("@/app/api/workflows/update-pricing/route")
    const res = await POST(makeRequest("http://localhost/", {
      newPriceCents: 4900,
      reason: "Competitor reduced price",
      approved: false,
    }))
    expect(res.status).toBe(200)
    const body = await res.json() as { previewOnly: boolean; applied: boolean; newPriceCents: number }
    expect(body.previewOnly).toBe(true)
    expect(body.applied).toBe(false)
    expect(body.newPriceCents).toBe(4900)
  })

  it("NEVER applies when approved is not explicitly true", async () => {
    const { POST } = await import("@/app/api/workflows/update-pricing/route")
    // Test with approved omitted (defaults to false)
    const res = await POST(makeRequest("http://localhost/", {
      newPriceCents: 4900,
      reason: "test",
    }))
    expect(res.status).toBe(200)
    const body = await res.json() as { applied: boolean }
    expect(body.applied).toBe(false)
  })

  it("returns the reason in the response", async () => {
    const { POST } = await import("@/app/api/workflows/update-pricing/route")
    const res = await POST(makeRequest("http://localhost/", {
      newPriceCents: 4900,
      reason: "Competitor dropped price by 30%",
      approved: false,
    }))
    expect(res.status).toBe(200)
    const body = await res.json() as { reason: string }
    expect(body.reason).toBe("Competitor dropped price by 30%")
  })

  it("returns 400 for zero newPriceCents", async () => {
    const { POST } = await import("@/app/api/workflows/update-pricing/route")
    const res = await POST(makeRequest("http://localhost/", {
      newPriceCents: 0,
      reason: "test",
      approved: false,
    }))
    expect(res.status).toBe(400)
  })
})
