/**
 * Tests for the Competitor Intelligence → Telegram Alert workflow.
 *
 * All external provider calls (Anakin, OpenAI, Telegram) are mocked so
 * no live network requests are made during testing.
 */

import React from "react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { CompetitorAlertPanel } from "@/components/app/competitor-alert-panel"

// ─── Shared mock data ─────────────────────────────────────────────────────────

const MOCK_MARKDOWN = `# Rival Inc\n## Features\n- AI Chat\n## Pricing\n- Pro: $49/mo`

const MOCK_RAW_EXTRACTION = {
  id: "re-mock-123",
  sourceId: "",
  url: "https://rival.com",
  fetchedAt: new Date().toISOString(),
  contentType: "markdown" as const,
  title: "Rival Inc",
  markdown: MOCK_MARKDOWN,
  textPreview: MOCK_MARKDOWN.slice(0, 300),
  status: "ok" as const,
}

const MOCK_ANALYSIS_RESULT = {
  competitorName: "Rival Inc",
  detectedFeatures: [
    { name: "AI Chat", description: "Instant customer AI chat", pageContext: "Features" },
  ],
  detectedPricingChanges: [
    { summary: "Pro plan raised to $49/mo", oldSignal: "$39/mo", newSignal: "$49/mo" },
  ],
  recommendedWorkflowType: "feature_gap" as const,
}

const MOCK_BRIEF_FEATURE =
  "🔍 *Competitor Feature Alert*\n*Competitor:* Rival Inc\n*New Feature Detected:* AI Chat\n*What it does:* Instant customer AI chat\n*Your gap:* You don't offer this\n*Why it matters:* Customers will compare\n*Suggested action:* Add AI chat to roadmap\n*Confidence:* medium\n*Source:* https://rival.com"

// ─────────────────────────────────────────────────────────────────────────────
// 1. SCHEMA VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

describe("CompetitorAlertRequestSchema", () => {
  it("accepts a valid feature_gap request", async () => {
    const { CompetitorAlertRequestSchema } = await import("@/lib/schemas/competitor-alert")
    const result = CompetitorAlertRequestSchema.safeParse({
      competitorUrl: "https://rival.com",
      workflowType: "feature_gap",
    })
    expect(result.success).toBe(true)
  })

  it("accepts a request with optional userSiteUrl", async () => {
    const { CompetitorAlertRequestSchema } = await import("@/lib/schemas/competitor-alert")
    const result = CompetitorAlertRequestSchema.safeParse({
      competitorUrl: "https://rival.com",
      userSiteUrl: "https://mysite.com",
      workflowType: "auto",
    })
    expect(result.success).toBe(true)
  })

  it("defaults workflowType to 'auto' when not provided", async () => {
    const { CompetitorAlertRequestSchema } = await import("@/lib/schemas/competitor-alert")
    const result = CompetitorAlertRequestSchema.safeParse({
      competitorUrl: "https://rival.com",
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.workflowType).toBe("auto")
  })

  it("rejects an invalid competitorUrl", async () => {
    const { CompetitorAlertRequestSchema } = await import("@/lib/schemas/competitor-alert")
    const result = CompetitorAlertRequestSchema.safeParse({
      competitorUrl: "not-a-url",
      workflowType: "auto",
    })
    expect(result.success).toBe(false)
  })

  it("rejects an invalid workflowType", async () => {
    const { CompetitorAlertRequestSchema } = await import("@/lib/schemas/competitor-alert")
    const result = CompetitorAlertRequestSchema.safeParse({
      competitorUrl: "https://rival.com",
      workflowType: "unknown_type",
    })
    expect(result.success).toBe(false)
  })

  it("rejects an invalid userSiteUrl", async () => {
    const { CompetitorAlertRequestSchema } = await import("@/lib/schemas/competitor-alert")
    const result = CompetitorAlertRequestSchema.safeParse({
      competitorUrl: "https://rival.com",
      userSiteUrl: "not-a-url",
    })
    expect(result.success).toBe(false)
  })
})

describe("AnalysisResultSchema", () => {
  it("validates a complete analysis result", async () => {
    const { AnalysisResultSchema } = await import("@/lib/schemas/competitor-alert")
    const result = AnalysisResultSchema.safeParse(MOCK_ANALYSIS_RESULT)
    expect(result.success).toBe(true)
  })

  it("validates with empty arrays", async () => {
    const { AnalysisResultSchema } = await import("@/lib/schemas/competitor-alert")
    const result = AnalysisResultSchema.safeParse({
      competitorName: "Rival Inc",
      detectedFeatures: [],
      detectedPricingChanges: [],
      recommendedWorkflowType: "pricing_response",
    })
    expect(result.success).toBe(true)
  })

  it("rejects a missing competitorName", async () => {
    const { AnalysisResultSchema } = await import("@/lib/schemas/competitor-alert")
    const result = AnalysisResultSchema.safeParse({
      detectedFeatures: [],
      detectedPricingChanges: [],
      recommendedWorkflowType: "feature_gap",
    })
    expect(result.success).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. SCRAPER
// ─────────────────────────────────────────────────────────────────────────────

describe("scrapeCompetitorUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.doUnmock("@/lib/providers/real")
  })

  it("returns a valid RawExtraction in mock mode (SCRAPE_PROVIDER=mock)", async () => {
    vi.stubEnv("SCRAPE_PROVIDER", "mock")
    const { scrapeCompetitorUrl } = await import("@/lib/workflows/competitor-alert/scraper")
    const result = await scrapeCompetitorUrl("https://rival.com")
    expect(result.status).toBe("ok")
    expect(typeof result.markdown).toBe("string")
    expect(result.markdown!.length).toBeGreaterThan(0)
    expect(result.url).toBe("https://rival.com")
  })

  it("returns markdown with Features and Pricing in mock mode", async () => {
    vi.stubEnv("SCRAPE_PROVIDER", "mock")
    const { scrapeCompetitorUrl } = await import("@/lib/workflows/competitor-alert/scraper")
    const result = await scrapeCompetitorUrl("https://rival.com")
    expect(result.markdown).toContain("Features")
    expect(result.markdown).toContain("Pricing")
  })

  it("returns a textPreview in mock mode", async () => {
    vi.stubEnv("SCRAPE_PROVIDER", "mock")
    const { scrapeCompetitorUrl } = await import("@/lib/workflows/competitor-alert/scraper")
    const result = await scrapeCompetitorUrl("https://rival.com")
    expect(typeof result.textPreview).toBe("string")
  })

  it("uses JinaReaderProvider when SCRAPE_PROVIDER is not mock", async () => {
    vi.stubEnv("SCRAPE_PROVIDER", "real")
    vi.doMock("@/lib/providers/real", () => ({
      JinaReaderProvider: class {
        async scrapeUrl() { return MOCK_RAW_EXTRACTION }
      },
    }))
    const { scrapeCompetitorUrl } = await import("@/lib/workflows/competitor-alert/scraper")
    const result = await scrapeCompetitorUrl("https://rival.com")
    expect(result.status).toBe("ok")
  })

  it("throws when JinaReaderProvider returns a non-ok status", async () => {
    vi.stubEnv("SCRAPE_PROVIDER", "real")
    vi.doMock("@/lib/providers/real", () => ({
      JinaReaderProvider: class {
        async scrapeUrl() {
          return { ...MOCK_RAW_EXTRACTION, status: "error" as const, markdown: "Fetch error" }
        }
      },
    }))
    const { scrapeCompetitorUrl } = await import("@/lib/workflows/competitor-alert/scraper")
    await expect(scrapeCompetitorUrl("https://rival.com")).rejects.toThrow()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. ANALYZER
// ─────────────────────────────────────────────────────────────────────────────

describe("analyzeCompetitorContent", () => {
  beforeEach(() => { vi.stubEnv("OPENAI_API_KEY", "") })
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

  it("returns a valid AnalysisResult in mock mode", async () => {
    const { analyzeCompetitorContent } = await import("@/lib/workflows/competitor-alert/analyzer")
    const result = await analyzeCompetitorContent(MOCK_MARKDOWN, "https://rival.com")
    expect(result.competitorName).toBeTruthy()
    expect(Array.isArray(result.detectedFeatures)).toBe(true)
    expect(Array.isArray(result.detectedPricingChanges)).toBe(true)
    expect(["feature_gap", "pricing_response"]).toContain(result.recommendedWorkflowType)
  })

  it("calls OpenAI when OPENAI_API_KEY is set and returns structured JSON", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key")
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(MOCK_ANALYSIS_RESULT) } }],
      }),
    })
    vi.stubGlobal("fetch", mockFetch)

    const { analyzeCompetitorContent } = await import("@/lib/workflows/competitor-alert/analyzer")
    const result = await analyzeCompetitorContent(MOCK_MARKDOWN, "https://rival.com")

    expect(mockFetch).toHaveBeenCalledOnce()
    expect(result.competitorName).toBe("Rival Inc")
    expect(result.detectedFeatures).toHaveLength(1)
    expect(result.detectedFeatures[0].name).toBe("AI Chat")
  })

  it("throws when OpenAI returns a non-ok status", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key")
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => "Rate limit exceeded",
    })
    vi.stubGlobal("fetch", mockFetch)

    const { analyzeCompetitorContent } = await import("@/lib/workflows/competitor-alert/analyzer")
    await expect(
      analyzeCompetitorContent(MOCK_MARKDOWN, "https://rival.com")
    ).rejects.toThrow("OpenAI analysis failed")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. BRIEF GENERATOR
// ─────────────────────────────────────────────────────────────────────────────

describe("generateBrief", () => {
  beforeEach(() => { vi.stubEnv("OPENAI_API_KEY", "") })
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

  it("generates a feature gap brief in mock mode", async () => {
    const { generateBrief } = await import("@/lib/workflows/competitor-alert/briefGenerator")
    const brief = await generateBrief(MOCK_ANALYSIS_RESULT, "feature_gap", undefined, "https://rival.com")
    expect(brief).toContain("Competitor Feature Alert")
    expect(brief).toContain("Rival Inc")
    expect(brief).toContain("https://rival.com")
  })

  it("generates a pricing response brief in mock mode", async () => {
    const { generateBrief } = await import("@/lib/workflows/competitor-alert/briefGenerator")
    const brief = await generateBrief(MOCK_ANALYSIS_RESULT, "pricing_response", undefined, "https://rival.com")
    expect(brief).toContain("Competitor Pricing Alert")
    expect(brief).toContain("Rival Inc")
    expect(brief).toContain("https://rival.com")
  })

  it("calls OpenAI when API key is set and returns the brief text", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key")
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: MOCK_BRIEF_FEATURE } }] }),
    })
    vi.stubGlobal("fetch", mockFetch)

    const { generateBrief } = await import("@/lib/workflows/competitor-alert/briefGenerator")
    const brief = await generateBrief(MOCK_ANALYSIS_RESULT, "feature_gap", "https://mysite.com", "https://rival.com")

    expect(mockFetch).toHaveBeenCalledOnce()
    expect(brief).toContain("Competitor Feature Alert")
  })

  it("feature_gap brief includes all required fields", async () => {
    const { generateBrief } = await import("@/lib/workflows/competitor-alert/briefGenerator")
    const brief = await generateBrief(MOCK_ANALYSIS_RESULT, "feature_gap", undefined, "https://rival.com")
    expect(brief).toContain("*Competitor:*")
    expect(brief).toContain("*New Feature Detected:*")
    expect(brief).toContain("*Your gap:*")
    expect(brief).toContain("*Why it matters:*")
    expect(brief).toContain("*Suggested action:*")
    expect(brief).toContain("*Confidence:*")
    expect(brief).toContain("*Source:*")
  })

  it("pricing_response brief includes all required fields", async () => {
    const { generateBrief } = await import("@/lib/workflows/competitor-alert/briefGenerator")
    const brief = await generateBrief(MOCK_ANALYSIS_RESULT, "pricing_response", undefined, "https://rival.com")
    expect(brief).toContain("*Competitor:*")
    expect(brief).toContain("*Change detected:*")
    expect(brief).toContain("*Their current pricing:*")
    expect(brief).toContain("*Suggested response:*")
    expect(brief).toContain("*Urgency:*")
    expect(brief).toContain("*Source:*")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 5. TELEGRAM DELIVERY
// ─────────────────────────────────────────────────────────────────────────────

describe("sendTelegramMessage", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

  it("returns { sent: false } when credentials are missing", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "")
    vi.stubEnv("TELEGRAM_CHAT_ID", "")
    const { sendTelegramMessage } = await import("@/lib/workflows/competitor-alert/telegram")
    const result = await sendTelegramMessage("Hello Telegram")
    expect(result.sent).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it("returns { sent: true } on a successful API call", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "test-token")
    vi.stubEnv("TELEGRAM_CHAT_ID", "test-chat-id")
    const mockFetch = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal("fetch", mockFetch)

    const { sendTelegramMessage } = await import("@/lib/workflows/competitor-alert/telegram")
    const result = await sendTelegramMessage("Hello Telegram")

    expect(result.sent).toBe(true)
    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toContain("api.telegram.org")
    const body = JSON.parse(options.body as string) as Record<string, unknown>
    expect(body.text).toBe("Hello Telegram")
    expect(body.parse_mode).toBe("Markdown")
  })

  it("retries once and succeeds on the second attempt", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "test-token")
    vi.stubEnv("TELEGRAM_CHAT_ID", "test-chat-id")
    let callCount = 0
    const mockFetch = vi.fn().mockImplementation(async () => {
      callCount++
      if (callCount === 1) return { ok: false, status: 502, text: async () => "Bad Gateway" }
      return { ok: true }
    })
    vi.stubGlobal("fetch", mockFetch)

    const { sendTelegramMessage } = await import("@/lib/workflows/competitor-alert/telegram")
    const result = await sendTelegramMessage("Hello Telegram")
    expect(result.sent).toBe(true)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it("returns { sent: false, error } after both attempts fail", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "test-token")
    vi.stubEnv("TELEGRAM_CHAT_ID", "test-chat-id")
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => "Bad Request",
    })
    vi.stubGlobal("fetch", mockFetch)

    const { sendTelegramMessage } = await import("@/lib/workflows/competitor-alert/telegram")
    const result = await sendTelegramMessage("Hello Telegram")
    expect(result.sent).toBe(false)
    expect(result.error).toBeTruthy()
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 6. ORCHESTRATOR
// ─────────────────────────────────────────────────────────────────────────────

describe("runCompetitorAlertWorkflow", () => {
  beforeEach(() => {
    vi.stubEnv("SCRAPE_PROVIDER", "mock")
    vi.stubEnv("OPENAI_API_KEY", "")
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "")
    vi.stubEnv("TELEGRAM_CHAT_ID", "")
  })
  afterEach(() => { vi.unstubAllEnvs() })

  it("returns a CompetitorAlertResult with all required fields in full mock mode", async () => {
    const { runCompetitorAlertWorkflow } = await import("@/lib/workflows/competitor-alert")
    const result = await runCompetitorAlertWorkflow({
      competitorUrl: "https://rival.com",
      workflowType: "auto",
    })
    expect(result.brief).toBeTruthy()
    expect(result.competitorName).toBeTruthy()
    expect(["feature_gap", "pricing_response"]).toContain(result.workflowType)
    expect(typeof result.telegramSent).toBe("boolean")
  })

  it("resolves workflowType 'auto' using analysis recommendation", async () => {
    const { runCompetitorAlertWorkflow } = await import("@/lib/workflows/competitor-alert")
    const result = await runCompetitorAlertWorkflow({
      competitorUrl: "https://rival.com",
      workflowType: "auto",
    })
    expect(result.workflowType).toBe("feature_gap")
  })

  it("uses the explicit workflowType when not 'auto'", async () => {
    const { runCompetitorAlertWorkflow } = await import("@/lib/workflows/competitor-alert")
    const result = await runCompetitorAlertWorkflow({
      competitorUrl: "https://rival.com",
      workflowType: "pricing_response",
    })
    expect(result.workflowType).toBe("pricing_response")
    expect(result.brief).toContain("Pricing Alert")
  })

  it("sets telegramSent: false when Telegram credentials are missing", async () => {
    const { runCompetitorAlertWorkflow } = await import("@/lib/workflows/competitor-alert")
    const result = await runCompetitorAlertWorkflow({
      competitorUrl: "https://rival.com",
      workflowType: "feature_gap",
    })
    expect(result.telegramSent).toBe(false)
    expect(result.telegramError).toBeTruthy()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 7. API ROUTE
// ─────────────────────────────────────────────────────────────────────────────

describe("POST /api/workflows/competitor-alert", () => {
  beforeEach(() => {
    vi.stubEnv("SCRAPE_PROVIDER", "mock")
    vi.stubEnv("OPENAI_API_KEY", "")
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "")
    vi.stubEnv("TELEGRAM_CHAT_ID", "")
  })
  afterEach(() => { vi.unstubAllEnvs() })

  function makeRequest(body: unknown): Request {
    return new Request("http://localhost/api/workflows/competitor-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  }

  it("returns 400 for invalid JSON", async () => {
    const { POST } = await import("@/app/api/workflows/competitor-alert/route")
    const req = new Request("http://localhost/api/workflows/competitor-alert", {
      method: "POST",
      body: "not json",
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string }
    expect(body.error).toMatch(/invalid json/i)
  })

  it("returns 400 when competitorUrl is missing", async () => {
    const { POST } = await import("@/app/api/workflows/competitor-alert/route")
    const res = await POST(makeRequest({ workflowType: "auto" }))
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string; issues: unknown[] }
    expect(body.error).toBe("Validation failed")
    expect(Array.isArray(body.issues)).toBe(true)
  })

  it("returns 400 when competitorUrl is not a valid URL", async () => {
    const { POST } = await import("@/app/api/workflows/competitor-alert/route")
    const res = await POST(makeRequest({ competitorUrl: "not-a-url", workflowType: "auto" }))
    expect(res.status).toBe(400)
  })

  it("returns 200 with a full result for a valid request in mock mode", async () => {
    const { POST } = await import("@/app/api/workflows/competitor-alert/route")
    const res = await POST(makeRequest({ competitorUrl: "https://rival.com", workflowType: "auto" }))
    expect(res.status).toBe(200)
    const body = await res.json() as {
      brief: string
      competitorName: string
      workflowType: string
      telegramSent: boolean
    }
    expect(typeof body.brief).toBe("string")
    expect(body.brief.length).toBeGreaterThan(0)
    expect(typeof body.competitorName).toBe("string")
    expect(["feature_gap", "pricing_response"]).toContain(body.workflowType)
    expect(typeof body.telegramSent).toBe("boolean")
  })

  it("returns 200 with pricing_response when workflowType is set explicitly", async () => {
    const { POST } = await import("@/app/api/workflows/competitor-alert/route")
    const res = await POST(makeRequest({ competitorUrl: "https://rival.com", workflowType: "pricing_response" }))
    expect(res.status).toBe(200)
    const body = await res.json() as { workflowType: string }
    expect(body.workflowType).toBe("pricing_response")
  })

  it("accepts an optional userSiteUrl", async () => {
    const { POST } = await import("@/app/api/workflows/competitor-alert/route")
    const res = await POST(makeRequest({
      competitorUrl: "https://rival.com",
      userSiteUrl: "https://mysite.com",
      workflowType: "feature_gap",
    }))
    expect(res.status).toBe(200)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 8. UI PANEL
// ─────────────────────────────────────────────────────────────────────────────

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

describe("CompetitorAlertPanel", () => {
  afterEach(() => { vi.unstubAllGlobals() })

  it("renders the panel with test id", () => {
    render(<CompetitorAlertPanel />)
    expect(screen.getByTestId("competitor-alert-panel")).toBeDefined()
  })

  it("renders competitor URL input", () => {
    render(<CompetitorAlertPanel />)
    expect(screen.getByTestId("competitor-url-input")).toBeDefined()
  })

  it("renders your site URL input", () => {
    render(<CompetitorAlertPanel />)
    expect(screen.getByTestId("user-site-url-input")).toBeDefined()
  })

  it("renders workflow type select", () => {
    render(<CompetitorAlertPanel />)
    expect(screen.getByTestId("workflow-type-select")).toBeDefined()
  })

  it("renders the Run workflow button", () => {
    render(<CompetitorAlertPanel />)
    expect(screen.getByTestId("run-workflow-button")).toBeDefined()
  })

  it("disables Run workflow button when competitorUrl is empty", () => {
    render(<CompetitorAlertPanel />)
    const btn = screen.getByTestId("run-workflow-button") as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it("enables Run workflow button when competitorUrl is filled", () => {
    render(<CompetitorAlertPanel />)
    const input = screen.getByTestId("competitor-url-input")
    fireEvent.change(input, { target: { value: "https://rival.com" } })
    const btn = screen.getByTestId("run-workflow-button") as HTMLButtonElement
    expect(btn.disabled).toBe(false)
  })

  it("calls the API when Run workflow button is clicked", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        brief: MOCK_BRIEF_FEATURE,
        competitorName: "Rival Inc",
        workflowType: "feature_gap",
        telegramSent: false,
      }),
    })
    vi.stubGlobal("fetch", mockFetch)

    render(<CompetitorAlertPanel />)
    fireEvent.change(screen.getByTestId("competitor-url-input"), { target: { value: "https://rival.com" } })
    fireEvent.click(screen.getByTestId("run-workflow-button"))

    await waitFor(() => { expect(mockFetch).toHaveBeenCalledOnce() })

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toContain("/api/workflows/competitor-alert")
    const body = JSON.parse(options.body as string) as Record<string, unknown>
    expect(body.competitorUrl).toBe("https://rival.com")
  })

  it("displays the brief preview after a successful run", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        brief: MOCK_BRIEF_FEATURE,
        competitorName: "Rival Inc",
        workflowType: "feature_gap",
        telegramSent: false,
      }),
    })
    vi.stubGlobal("fetch", mockFetch)

    render(<CompetitorAlertPanel />)
    fireEvent.change(screen.getByTestId("competitor-url-input"), { target: { value: "https://rival.com" } })
    fireEvent.click(screen.getByTestId("run-workflow-button"))

    await waitFor(() => {
      expect(screen.getByTestId("brief-preview")).toBeDefined()
    })
  })

  it("shows the Send to Telegram button after a successful run", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        brief: MOCK_BRIEF_FEATURE,
        competitorName: "Rival Inc",
        workflowType: "feature_gap",
        telegramSent: true,
      }),
    })
    vi.stubGlobal("fetch", mockFetch)

    render(<CompetitorAlertPanel />)
    fireEvent.change(screen.getByTestId("competitor-url-input"), { target: { value: "https://rival.com" } })
    fireEvent.click(screen.getByTestId("run-workflow-button"))

    await waitFor(() => {
      expect(screen.getByTestId("send-telegram-button")).toBeDefined()
    })
  })

  it("shows an error message when the API returns an error", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Scraping failed" }),
    })
    vi.stubGlobal("fetch", mockFetch)

    render(<CompetitorAlertPanel />)
    fireEvent.change(screen.getByTestId("competitor-url-input"), { target: { value: "https://rival.com" } })
    fireEvent.click(screen.getByTestId("run-workflow-button"))

    await waitFor(() => {
      expect(screen.getByText("Scraping failed")).toBeDefined()
    })
  })

  it("shows an error message on network failure", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"))
    vi.stubGlobal("fetch", mockFetch)

    render(<CompetitorAlertPanel />)
    fireEvent.change(screen.getByTestId("competitor-url-input"), { target: { value: "https://rival.com" } })
    fireEvent.click(screen.getByTestId("run-workflow-button"))

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeDefined()
    })
  })
})
