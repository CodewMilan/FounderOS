/**
 * Unit tests for all FounderOS workflow shared services.
 * All external network calls are mocked — no live requests.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// ─────────────────────────────────────────────────────────────────────────────
// 1. SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

describe("FeatureGapRequestSchema", () => {
  it("accepts a valid request", async () => {
    const { FeatureGapRequestSchema } = await import("@/lib/schemas/workflows")
    expect(FeatureGapRequestSchema.safeParse({ competitorUrl: "https://rival.com" }).success).toBe(true)
  })

  it("accepts optional userSiteUrl", async () => {
    const { FeatureGapRequestSchema } = await import("@/lib/schemas/workflows")
    expect(FeatureGapRequestSchema.safeParse({
      competitorUrl: "https://rival.com",
      userSiteUrl: "https://mysite.com",
    }).success).toBe(true)
  })

  it("rejects invalid competitorUrl", async () => {
    const { FeatureGapRequestSchema } = await import("@/lib/schemas/workflows")
    expect(FeatureGapRequestSchema.safeParse({ competitorUrl: "not-a-url" }).success).toBe(false)
  })

  it("rejects invalid optional userSiteUrl", async () => {
    const { FeatureGapRequestSchema } = await import("@/lib/schemas/workflows")
    expect(FeatureGapRequestSchema.safeParse({
      competitorUrl: "https://rival.com",
      userSiteUrl: "not-a-url",
    }).success).toBe(false)
  })
})

describe("DevTicketRequestSchema", () => {
  it("accepts a valid dev ticket", async () => {
    const { DevTicketRequestSchema } = await import("@/lib/schemas/workflows")
    expect(DevTicketRequestSchema.safeParse({
      featureName: "AI Chat",
      competitorName: "Acme Corp",
      description: "Live AI chat widget",
      whyNow: "Customers are leaving for competitors with AI chat",
      suggestedImplementation: "Add Intercom-style AI chat",
      confidence: "high",
      sourceUrl: "https://acme.com/features",
    }).success).toBe(true)
  })

  it("rejects invalid confidence value", async () => {
    const { DevTicketRequestSchema } = await import("@/lib/schemas/workflows")
    expect(DevTicketRequestSchema.safeParse({
      featureName: "AI Chat",
      competitorName: "Acme Corp",
      description: "desc",
      whyNow: "why",
      suggestedImplementation: "impl",
      confidence: "critical",
      sourceUrl: "https://acme.com",
    }).success).toBe(false)
  })

  it("rejects missing required fields", async () => {
    const { DevTicketRequestSchema } = await import("@/lib/schemas/workflows")
    expect(DevTicketRequestSchema.safeParse({ featureName: "AI Chat" }).success).toBe(false)
  })
})

describe("PricingResponseRequestSchema", () => {
  it("accepts valid request", async () => {
    const { PricingResponseRequestSchema } = await import("@/lib/schemas/workflows")
    expect(PricingResponseRequestSchema.safeParse({ competitorUrl: "https://rival.com/pricing" }).success).toBe(true)
  })
})

describe("ProspectEnrichmentRequestSchema", () => {
  it("accepts valid request", async () => {
    const { ProspectEnrichmentRequestSchema } = await import("@/lib/schemas/workflows")
    expect(ProspectEnrichmentRequestSchema.safeParse({ prospectUrl: "https://prospect.com" }).success).toBe(true)
  })

  it("rejects non-URL", async () => {
    const { ProspectEnrichmentRequestSchema } = await import("@/lib/schemas/workflows")
    expect(ProspectEnrichmentRequestSchema.safeParse({ prospectUrl: "not-a-url" }).success).toBe(false)
  })
})

describe("FundingAlertRequestSchema", () => {
  it("accepts valid request", async () => {
    const { FundingAlertRequestSchema } = await import("@/lib/schemas/workflows")
    expect(FundingAlertRequestSchema.safeParse({ fundingUrl: "https://grants.gov/startup" }).success).toBe(true)
  })
})

describe("UpdatePricingRequestSchema", () => {
  it("accepts valid request with approved=false", async () => {
    const { UpdatePricingRequestSchema } = await import("@/lib/schemas/workflows")
    const result = UpdatePricingRequestSchema.safeParse({
      newPriceCents: 4900,
      reason: "Competitor reduced price",
      approved: false,
    })
    expect(result.success).toBe(true)
  })

  it("defaults approved to false when omitted", async () => {
    const { UpdatePricingRequestSchema } = await import("@/lib/schemas/workflows")
    const result = UpdatePricingRequestSchema.safeParse({
      newPriceCents: 4900,
      reason: "Test",
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.approved).toBe(false)
  })

  it("rejects zero or negative newPriceCents", async () => {
    const { UpdatePricingRequestSchema } = await import("@/lib/schemas/workflows")
    expect(UpdatePricingRequestSchema.safeParse({ newPriceCents: 0, reason: "test", approved: false }).success).toBe(false)
    expect(UpdatePricingRequestSchema.safeParse({ newPriceCents: -100, reason: "test", approved: false }).success).toBe(false)
  })

  it("rejects non-integer newPriceCents", async () => {
    const { UpdatePricingRequestSchema } = await import("@/lib/schemas/workflows")
    expect(UpdatePricingRequestSchema.safeParse({ newPriceCents: 49.5, reason: "test", approved: false }).success).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. anakinService
// ─────────────────────────────────────────────────────────────────────────────

describe("anakinService.scrapeUrl", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

  it("returns mock markdown when SCRAPE_PROVIDER=mock", async () => {
    vi.stubEnv("SCRAPE_PROVIDER", "mock")
    const { scrapeUrl } = await import("@/lib/services/anakinService")
    const result = await scrapeUrl("https://example.com")
    expect(result.markdown.length).toBeGreaterThan(0)
    expect(result.url).toBe("https://example.com")
    expect(typeof result.fetchedAt).toBe("string")
  })

  it("calls Jina when SCRAPE_PROVIDER is not mock", async () => {
    vi.stubEnv("SCRAPE_PROVIDER", "real")
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "# Rival Inc\n\nFeatures section",
    })
    vi.stubGlobal("fetch", mockFetch)

    const { scrapeUrl } = await import("@/lib/services/anakinService")
    const result = await scrapeUrl("https://rival.com")
    expect(result.markdown).toContain("Rival Inc")
    expect(mockFetch).toHaveBeenCalledOnce()
    const [url] = mockFetch.mock.calls[0] as [string]
    expect(url).toContain("r.jina.ai")
  })

  it("throws when Jina returns non-ok status", async () => {
    vi.stubEnv("SCRAPE_PROVIDER", "real")
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 500 })
    vi.stubGlobal("fetch", mockFetch)

    const { scrapeUrl } = await import("@/lib/services/anakinService")
    await expect(scrapeUrl("https://rival.com")).rejects.toThrow("Jina scrape failed")
  })

  it("extracts title from first h1 line", async () => {
    vi.stubEnv("SCRAPE_PROVIDER", "real")
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "# My Company\n\nContent here",
    })
    vi.stubGlobal("fetch", mockFetch)

    const { scrapeUrl } = await import("@/lib/services/anakinService")
    const result = await scrapeUrl("https://example.com")
    expect(result.title).toBe("My Company")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. openaiService
// ─────────────────────────────────────────────────────────────────────────────

describe("openaiService.analyzeFeatures", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

  it("returns mock brief when OPENAI_API_KEY is not set", async () => {
    vi.stubEnv("OPENAI_API_KEY", "")
    const { analyzeFeatures } = await import("@/lib/services/openaiService")
    const result = await analyzeFeatures("# Rival\n## Features", "https://rival.com")
    expect(result.featureName).toBeTruthy()
    expect(result.competitorName).toBeTruthy()
    expect(["high", "medium", "low"]).toContain(result.confidence)
  })

  it("calls OpenAI when API key is set", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key")
    const mockBrief = {
      competitorName: "Rival Inc",
      featureName: "AI Chat",
      whatItDoes: "Instant chat.",
      gap: "You don't have this.",
      whyItMatters: "Big deal.",
      suggestedAction: "Build it.",
      confidence: "high",
      sourceUrl: "https://rival.com",
    }
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: JSON.stringify(mockBrief) } }] }),
    })
    vi.stubGlobal("fetch", mockFetch)

    const { analyzeFeatures } = await import("@/lib/services/openaiService")
    const result = await analyzeFeatures("# Rival\n## Features", "https://rival.com")
    expect(mockFetch).toHaveBeenCalledOnce()
    expect(result.featureName).toBe("AI Chat")
  })

  it("throws when OpenAI returns non-ok status", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key")
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => "Rate limit",
    })
    vi.stubGlobal("fetch", mockFetch)

    const { analyzeFeatures } = await import("@/lib/services/openaiService")
    await expect(analyzeFeatures("content", "https://rival.com")).rejects.toThrow("OpenAI request failed")
  })
})

describe("openaiService.analyzePricing", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

  it("returns mock brief when OPENAI_API_KEY is not set", async () => {
    vi.stubEnv("OPENAI_API_KEY", "")
    const { analyzePricing } = await import("@/lib/services/openaiService")
    const result = await analyzePricing("# Rival\n## Pricing", "https://rival.com/pricing")
    expect(result.changeDetected).toBeTruthy()
    expect(["high", "medium", "low"]).toContain(result.urgency)
  })
})

describe("openaiService.extractProspectSignals", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

  it("returns mock brief when OPENAI_API_KEY is not set", async () => {
    vi.stubEnv("OPENAI_API_KEY", "")
    const { extractProspectSignals } = await import("@/lib/services/openaiService")
    const result = await extractProspectSignals("# TechFlow\n\nContent", "https://techflow.com")
    expect(result.companyName).toBeTruthy()
    expect(Array.isArray(result.keySignals)).toBe(true)
    expect(result.keySignals.length).toBeGreaterThan(0)
  })
})

describe("openaiService.extractFundingInfo", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

  it("returns mock brief when OPENAI_API_KEY is not set", async () => {
    vi.stubEnv("OPENAI_API_KEY", "")
    const { extractFundingInfo } = await import("@/lib/services/openaiService")
    const result = await extractFundingInfo("# Startup Fund\n\nContent", "https://grants.gov/fund")
    expect(result.programName).toBeTruthy()
    expect(result.provider).toBeTruthy()
    expect(typeof result.isUrgent).toBe("boolean")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. telegramService
// ─────────────────────────────────────────────────────────────────────────────

describe("telegramService.sendMessage", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

  it("returns { sent: false } when credentials are missing", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "")
    vi.stubEnv("TELEGRAM_CHAT_ID", "")
    const { sendMessage } = await import("@/lib/services/telegramService")
    const result = await sendMessage("Hello")
    expect(result.sent).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it("returns { sent: true } on successful send", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "test-token")
    vi.stubEnv("TELEGRAM_CHAT_ID", "test-chat")
    const mockFetch = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal("fetch", mockFetch)

    const { sendMessage } = await import("@/lib/services/telegramService")
    const result = await sendMessage("Hello Telegram")
    expect(result.sent).toBe(true)
    expect(mockFetch).toHaveBeenCalledOnce()
    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit]
    const body = JSON.parse(opts.body as string) as Record<string, unknown>
    expect(body.text).toBe("Hello Telegram")
    expect(body.parse_mode).toBe("Markdown")
  })

  it("retries once on failure and succeeds", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "tok")
    vi.stubEnv("TELEGRAM_CHAT_ID", "cid")
    let calls = 0
    const mockFetch = vi.fn().mockImplementation(async () => {
      calls++
      if (calls === 1) return { ok: false, status: 502, text: async () => "Bad Gateway" }
      return { ok: true }
    })
    vi.stubGlobal("fetch", mockFetch)

    const { sendMessage } = await import("@/lib/services/telegramService")
    const result = await sendMessage("Hello")
    expect(result.sent).toBe(true)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it("returns { sent: false } after both attempts fail", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "tok")
    vi.stubEnv("TELEGRAM_CHAT_ID", "cid")
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false, status: 400, text: async () => "Bad Request",
    })
    vi.stubGlobal("fetch", mockFetch)

    const { sendMessage } = await import("@/lib/services/telegramService")
    const result = await sendMessage("Hello")
    expect(result.sent).toBe(false)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 5. slackService
// ─────────────────────────────────────────────────────────────────────────────

describe("slackService.sendAlert", () => {
  afterEach(() => { vi.unstubAllGlobals() })

  it("returns { sent: false } when webhookUrl is empty", async () => {
    const { sendAlert } = await import("@/lib/services/slackService")
    const result = await sendAlert("", [{ type: "section", text: { type: "plain_text", text: "Hello" } }])
    expect(result.sent).toBe(false)
  })

  it("returns { sent: true } on successful webhook call", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal("fetch", mockFetch)

    const { sendAlert } = await import("@/lib/services/slackService")
    const result = await sendAlert("https://hooks.slack.com/test", [{ type: "section" }])
    expect(result.sent).toBe(true)
    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toBe("https://hooks.slack.com/test")
    const body = JSON.parse(opts.body as string) as { blocks: unknown[] }
    expect(Array.isArray(body.blocks)).toBe(true)
  })

  it("returns { sent: false } on Slack error", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false, status: 400, text: async () => "invalid_payload",
    })
    vi.stubGlobal("fetch", mockFetch)

    const { sendAlert } = await import("@/lib/services/slackService")
    const result = await sendAlert("https://hooks.slack.com/test", [])
    expect(result.sent).toBe(false)
    expect(result.error).toBeTruthy()
  })
})

describe("slackService.sendDevTicket", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

  it("returns { sent: false } when SLACK_DEV_TICKETS_WEBHOOK_URL is not set", async () => {
    vi.stubEnv("SLACK_DEV_TICKETS_WEBHOOK_URL", "")
    const { sendDevTicket } = await import("@/lib/services/slackService")
    const result = await sendDevTicket({
      featureName: "AI Chat",
      competitorName: "Rival",
      description: "desc",
      whyNow: "why",
      suggestedImplementation: "impl",
      confidence: "high",
      sourceUrl: "https://rival.com",
    })
    expect(result.sent).toBe(false)
  })

  it("sends to SLACK_DEV_TICKETS_WEBHOOK_URL when set", async () => {
    vi.stubEnv("SLACK_DEV_TICKETS_WEBHOOK_URL", "https://hooks.slack.com/dev")
    const mockFetch = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal("fetch", mockFetch)

    const { sendDevTicket } = await import("@/lib/services/slackService")
    await sendDevTicket({
      featureName: "AI Chat",
      competitorName: "Rival",
      description: "desc",
      whyNow: "why",
      suggestedImplementation: "impl",
      confidence: "high",
      sourceUrl: "https://rival.com",
    })

    expect(mockFetch).toHaveBeenCalledOnce()
    const [url] = mockFetch.mock.calls[0] as [string]
    expect(url).toBe("https://hooks.slack.com/dev")
  })

  it("formats P1 priority for high confidence", async () => {
    vi.stubEnv("SLACK_DEV_TICKETS_WEBHOOK_URL", "https://hooks.slack.com/dev")
    const mockFetch = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal("fetch", mockFetch)

    const { sendDevTicket } = await import("@/lib/services/slackService")
    await sendDevTicket({
      featureName: "AI Chat",
      competitorName: "Rival",
      description: "desc",
      whyNow: "why",
      suggestedImplementation: "impl",
      confidence: "high",
      sourceUrl: "https://rival.com",
    })

    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit]
    const body = JSON.parse(opts.body as string) as { blocks: Array<Record<string, unknown>> }
    const bodyStr = JSON.stringify(body.blocks)
    expect(bodyStr).toContain("P1")
  })
})

describe("slackService block builders", () => {
  it("buildFeatureGapBlocks returns blocks with Create Dev Ticket button", async () => {
    const { buildFeatureGapBlocks } = await import("@/lib/services/slackService")
    const blocks = buildFeatureGapBlocks(
      {
        competitorName: "Rival",
        featureName: "AI Chat",
        whatItDoes: "Chat.",
        gap: "Missing.",
        whyItMatters: "Big.",
        suggestedAction: "Build it.",
        confidence: "high",
        sourceUrl: "https://rival.com",
      },
      {
        featureName: "AI Chat",
        competitorName: "Rival",
        description: "Gap desc",
        whyNow: "why",
        suggestedImplementation: "impl",
        confidence: "high",
        sourceUrl: "https://rival.com",
      }
    )
    const blockStr = JSON.stringify(blocks)
    expect(blockStr).toContain("Feature Gap Alert")
    expect(blockStr).toContain("Create Dev Ticket")
    // Button must use Block Kit interactivity, not a localhost URL
    expect(blockStr).not.toContain("localhost")
    expect(blockStr).not.toContain("/api/workflows/dev-ticket")
    // Button must carry the ticket payload as a value field
    const actionsBlock = blocks.find((b) => b.type === "actions") as
      | { elements: Array<Record<string, unknown>> }
      | undefined
    const ticketBtn = actionsBlock?.elements.find((el) => el.action_id === "create_dev_ticket")
    expect(ticketBtn).toBeDefined()
    expect(typeof ticketBtn?.value).toBe("string")
    expect(ticketBtn?.url).toBeUndefined()
  })

  it("buildPricingResponseBlocks returns blocks with competitor name", async () => {
    const { buildPricingResponseBlocks } = await import("@/lib/services/slackService")
    const blocks = buildPricingResponseBlocks({
      competitorName: "Rival",
      changeDetected: "Price drop",
      theirPricing: "$29/mo",
      yourPositioning: "review",
      suggestedResponse: "Highlight value",
      urgency: "high",
      sourceUrl: "https://rival.com",
    })
    const blockStr = JSON.stringify(blocks)
    expect(blockStr).toContain("Pricing Alert")
    expect(blockStr).toContain("Rival")
  })

  it("buildProspectBriefBlocks returns blocks with company name", async () => {
    const { buildProspectBriefBlocks } = await import("@/lib/services/slackService")
    const blocks = buildProspectBriefBlocks({
      companyName: "TechFlow",
      icpFit: "high",
      keySignals: ["Hiring", "Expanding", "Funded"],
      outreachAngle: "Lead with AI",
      confidence: "high",
      sourceUrl: "https://techflow.com",
    })
    const blockStr = JSON.stringify(blocks)
    expect(blockStr).toContain("Prospect Brief")
    expect(blockStr).toContain("TechFlow")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 6. lemonSqueezyService
// ─────────────────────────────────────────────────────────────────────────────

describe("lemonSqueezyService.getVariantPrice", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

  it("returns mock price when LEMON_SQUEEZY_API_KEY is not set", async () => {
    vi.stubEnv("LEMON_SQUEEZY_API_KEY", "")
    const { getVariantPrice } = await import("@/lib/services/lemonSqueezyService")
    const result = await getVariantPrice("var-123")
    expect(result.currentPriceCents).toBe(2900)
    expect(result.variantId).toBe("var-123")
  })

  it("calls Lemon Squeezy API when key is set", async () => {
    vi.stubEnv("LEMON_SQUEEZY_API_KEY", "ls-test-key")
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { attributes: { price: 4900 } } }),
    })
    vi.stubGlobal("fetch", mockFetch)

    const { getVariantPrice } = await import("@/lib/services/lemonSqueezyService")
    const result = await getVariantPrice("var-123")
    expect(result.currentPriceCents).toBe(4900)
  })

  it("throws on API error", async () => {
    vi.stubEnv("LEMON_SQUEEZY_API_KEY", "ls-test-key")
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false, status: 404, text: async () => "Not found",
    })
    vi.stubGlobal("fetch", mockFetch)

    const { getVariantPrice } = await import("@/lib/services/lemonSqueezyService")
    await expect(getVariantPrice("var-123")).rejects.toThrow("Lemon Squeezy fetch failed")
  })
})

describe("lemonSqueezyService.updateVariantPrice", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

  it("returns previewOnly when LEMON_SQUEEZY_API_KEY is not set", async () => {
    vi.stubEnv("LEMON_SQUEEZY_API_KEY", "")
    const { updateVariantPrice } = await import("@/lib/services/lemonSqueezyService")
    const result = await updateVariantPrice("var-123", 4900)
    expect(result.applied).toBe(false)
    expect(result.previewOnly).toBe(true)
    expect(result.newPriceCents).toBe(4900)
  })

  it("reads current price before updating", async () => {
    vi.stubEnv("LEMON_SQUEEZY_API_KEY", "ls-test-key")
    // Distinguish GET from PATCH by method
    const mockFetch = vi.fn().mockImplementation(async (_url: string, opts?: RequestInit) => {
      if (!opts?.method || opts.method.toUpperCase() === "GET") {
        return { ok: true, json: async () => ({ data: { attributes: { price: 2900 } } }) }
      }
      // PATCH
      return { ok: true, json: async () => ({}) }
    })
    vi.stubGlobal("fetch", mockFetch)

    const { updateVariantPrice } = await import("@/lib/services/lemonSqueezyService")
    const result = await updateVariantPrice("var-123", 4900)
    expect(result.oldPriceCents).toBe(2900)
    expect(result.newPriceCents).toBe(4900)
    expect(result.applied).toBe(true)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 7. WORKFLOW ORCHESTRATORS
// ─────────────────────────────────────────────────────────────────────────────

describe("runUpdatePricingWorkflow — approval gate", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

  it("returns previewOnly when approved=false", async () => {
    vi.stubEnv("LEMON_SQUEEZY_API_KEY", "")
    const { runUpdatePricingWorkflow } = await import("@/lib/workflows/update-pricing")
    const result = await runUpdatePricingWorkflow({
      newPriceCents: 4900,
      reason: "Competitor reduced price",
      approved: false,
    })
    expect(result.previewOnly).toBe(true)
    expect(result.applied).toBe(false)
    expect(result.newPriceCents).toBe(4900)
  })

  it("does NOT call Lemon Squeezy PATCH when approved=false", async () => {
    vi.stubEnv("LEMON_SQUEEZY_API_KEY", "ls-test-key")
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { attributes: { price: 2900 } } }),
    })
    vi.stubGlobal("fetch", mockFetch)

    const { runUpdatePricingWorkflow } = await import("@/lib/workflows/update-pricing")
    await runUpdatePricingWorkflow({ newPriceCents: 4900, reason: "test", approved: false })

    // Only the GET (read current price) should have been called, not the PATCH
    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect((opts.method ?? "GET").toUpperCase()).not.toBe("PATCH")
  })

  it("executes PATCH only when approved=true", async () => {
    vi.stubEnv("LEMON_SQUEEZY_API_KEY", "ls-test-key")
    const mockFetch = vi.fn().mockImplementation(async (_url: string, opts?: RequestInit) => {
      if (!opts?.method || opts.method.toUpperCase() === "GET") {
        return { ok: true, json: async () => ({ data: { attributes: { price: 2900 } } }) }
      }
      return { ok: true, json: async () => ({}) }
    })
    vi.stubGlobal("fetch", mockFetch)

    const { runUpdatePricingWorkflow } = await import("@/lib/workflows/update-pricing")
    const result = await runUpdatePricingWorkflow({ newPriceCents: 4900, reason: "test", approved: true })
    expect(result.applied).toBe(true)
    expect(result.newPriceCents).toBe(4900)

    // Verify at least one PATCH call was made (the actual price update)
    const calls = mockFetch.mock.calls as Array<[string, RequestInit | undefined]>
    const patchCalls = calls.filter(([, opts]) => opts?.method?.toUpperCase() === "PATCH")
    expect(patchCalls.length).toBeGreaterThanOrEqual(1)
  })
})

describe("runFeatureGapWorkflow — mock mode", () => {
  beforeEach(() => {
    vi.stubEnv("SCRAPE_PROVIDER", "mock")
    vi.stubEnv("OPENAI_API_KEY", "")
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "")
    vi.stubEnv("SLACK_WEBHOOK_URL", "")
  })
  afterEach(() => { vi.unstubAllEnvs() })

  it("returns a complete result with all required fields", async () => {
    const { runFeatureGapWorkflow } = await import("@/lib/workflows/feature-gap")
    const result = await runFeatureGapWorkflow({ competitorUrl: "https://rival.com" })
    expect(result.brief.featureName).toBeTruthy()
    expect(result.brief.competitorName).toBeTruthy()
    expect(typeof result.telegramSent).toBe("boolean")
    expect(typeof result.slackSent).toBe("boolean")
  })
})

describe("runPricingResponseWorkflow — mock mode", () => {
  beforeEach(() => {
    vi.stubEnv("SCRAPE_PROVIDER", "mock")
    vi.stubEnv("OPENAI_API_KEY", "")
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "")
    vi.stubEnv("SLACK_WEBHOOK_URL", "")
  })
  afterEach(() => { vi.unstubAllEnvs() })

  it("returns a complete result", async () => {
    const { runPricingResponseWorkflow } = await import("@/lib/workflows/pricing-response")
    const result = await runPricingResponseWorkflow({ competitorUrl: "https://rival.com/pricing" })
    expect(result.brief.changeDetected).toBeTruthy()
    expect(["high", "medium", "low"]).toContain(result.brief.urgency)
    expect(typeof result.slackSent).toBe("boolean")
  })
})

describe("runProspectEnrichmentWorkflow — mock mode", () => {
  beforeEach(() => {
    vi.stubEnv("SCRAPE_PROVIDER", "mock")
    vi.stubEnv("OPENAI_API_KEY", "")
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "")
    vi.stubEnv("SLACK_WEBHOOK_URL", "")
  })
  afterEach(() => { vi.unstubAllEnvs() })

  it("returns a complete prospect brief", async () => {
    const { runProspectEnrichmentWorkflow } = await import("@/lib/workflows/prospect-enrichment")
    const result = await runProspectEnrichmentWorkflow({ prospectUrl: "https://techflow.com" })
    expect(result.brief.companyName).toBeTruthy()
    expect(Array.isArray(result.brief.keySignals)).toBe(true)
    expect(typeof result.telegramSent).toBe("boolean")
  })
})

describe("runFundingAlertWorkflow — mock mode", () => {
  beforeEach(() => {
    vi.stubEnv("SCRAPE_PROVIDER", "mock")
    vi.stubEnv("OPENAI_API_KEY", "")
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "")
  })
  afterEach(() => { vi.unstubAllEnvs() })

  it("returns a complete funding brief", async () => {
    const { runFundingAlertWorkflow } = await import("@/lib/workflows/funding-alert")
    const result = await runFundingAlertWorkflow({ fundingUrl: "https://grants.gov/startup" })
    expect(result.brief.programName).toBeTruthy()
    expect(typeof result.brief.isUrgent).toBe("boolean")
    expect(typeof result.telegramSent).toBe("boolean")
  })
})

describe("runDevTicketWorkflow", () => {
  afterEach(() => { vi.unstubAllEnvs() })

  it("returns slackSent: false when webhook is not configured", async () => {
    vi.stubEnv("SLACK_DEV_TICKETS_WEBHOOK_URL", "")
    const { runDevTicketWorkflow } = await import("@/lib/workflows/dev-ticket")
    const result = await runDevTicketWorkflow({
      featureName: "AI Chat",
      competitorName: "Rival",
      description: "desc",
      whyNow: "why",
      suggestedImplementation: "impl",
      confidence: "high",
      sourceUrl: "https://rival.com",
    })
    expect(result.slackSent).toBe(false)
  })
})
