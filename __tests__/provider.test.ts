/**
 * Tests for the scrape provider abstraction layer.
 *
 * Covers:
 *   - getProvider() env-var fallback logic (vi.stubEnv)
 *   - nameOverride takes precedence over env var
 *   - MockScrapeProvider fixture routing
 *   - JinaReaderProvider with fully-mocked fetch (no live network calls)
 *   - JINA_API_KEY header presence/absence
 *   - Error and timeout handling in JinaReaderProvider
 *   - AnakinScrapeProvider submit+poll pattern (mocked fetch)
 *   - Anakin error and timeout handling
 */
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest"
import { getProvider } from "@/lib/providers"
import { AnakinScrapeProvider } from "@/lib/providers/anakin"
import { RawExtractionSchema } from "@/lib/schemas"

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

// ─── getProvider env-var fallback ─────────────────────────────────────────────

describe("getProvider — env-var fallback", () => {
  it("defaults to mock provider when SCRAPE_PROVIDER is unset", () => {
    vi.stubEnv("SCRAPE_PROVIDER", "")
    const provider = getProvider()
    expect(provider.name).toBe("mock")
  })

  it("returns mock provider when SCRAPE_PROVIDER=mock", () => {
    vi.stubEnv("SCRAPE_PROVIDER", "mock")
    const provider = getProvider()
    expect(provider.name).toBe("mock")
  })

  it("returns real provider when SCRAPE_PROVIDER=real", () => {
    vi.stubEnv("SCRAPE_PROVIDER", "real")
    const provider = getProvider()
    expect(provider.name).toBe("jina-reader")
  })

  it("nameOverride=mock beats SCRAPE_PROVIDER=real", () => {
    vi.stubEnv("SCRAPE_PROVIDER", "real")
    const provider = getProvider("mock")
    expect(provider.name).toBe("mock")
  })

  it("nameOverride=real beats SCRAPE_PROVIDER=mock", () => {
    vi.stubEnv("SCRAPE_PROVIDER", "mock")
    const provider = getProvider("real")
    expect(provider.name).toBe("jina-reader")
  })

  it("each call to getProvider creates a fresh instance", () => {
    const a = getProvider("mock")
    const b = getProvider("mock")
    expect(a).not.toBe(b)
  })
})

// ─── MockScrapeProvider ───────────────────────────────────────────────────────

describe("MockScrapeProvider.scrapeUrl", () => {
  const provider = getProvider("mock")

  it("returns status=ok for any URL", async () => {
    const result = await provider.scrapeUrl("https://example.com")
    expect(result.status).toBe("ok")
  })

  it("returns contentType=markdown", async () => {
    const result = await provider.scrapeUrl("https://example.com")
    expect(result.contentType).toBe("markdown")
  })

  it("echoes the given url", async () => {
    const result = await provider.scrapeUrl("https://mycompany.io")
    expect(result.url).toBe("https://mycompany.io")
  })

  it("result validates against RawExtractionSchema", async () => {
    const result = await provider.scrapeUrl("https://example.com")
    expect(() => RawExtractionSchema.parse(result)).not.toThrow()
  })

  it("returns pricing content for a /pricing URL", async () => {
    const result = await provider.scrapeUrl("https://example.com/pricing")
    expect(result.markdown).toContain("Pricing")
  })

  it("returns changelog content for a /changelog URL", async () => {
    const result = await provider.scrapeUrl("https://example.com/changelog")
    expect(result.markdown).toContain("What")
  })

  it("returns hiring content for a /careers URL", async () => {
    const result = await provider.scrapeUrl("https://example.com/careers")
    expect(result.markdown).toContain("Open Roles")
  })

  it("returns hiring content for a /jobs URL", async () => {
    const result = await provider.scrapeUrl("https://example.com/jobs")
    expect(result.markdown).toContain("Open Roles")
  })

  it("returns blog/announcement content for a /blog URL", async () => {
    const result = await provider.scrapeUrl("https://example.com/blog")
    expect(result.markdown).toContain("Series")
  })

  it("returns product content for a /product URL", async () => {
    const result = await provider.scrapeUrl("https://example.com/product")
    expect(result.markdown).toBeTruthy()
  })

  it("returns generic content for an unknown URL", async () => {
    const result = await provider.scrapeUrl("https://randomstartup-xyz.io/")
    expect(result.markdown).toBeTruthy()
    expect(result.markdown!.length).toBeGreaterThan(10)
  })

  it("result has a non-empty id", async () => {
    const result = await provider.scrapeUrl("https://example.com")
    expect(result.id).toBeTruthy()
    expect(result.id.startsWith("re-")).toBe(true)
  })

  it("result has a valid fetchedAt datetime", async () => {
    const result = await provider.scrapeUrl("https://example.com")
    expect(() => new Date(result.fetchedAt)).not.toThrow()
    expect(new Date(result.fetchedAt).getTime()).toBeGreaterThan(0)
  })
})

describe("MockScrapeProvider.scrapeMany", () => {
  const provider = getProvider("mock")

  it("returns one result per URL", async () => {
    const results = await provider.scrapeMany(["https://a.com", "https://b.com"])
    expect(results).toHaveLength(2)
  })

  it("preserves URL order", async () => {
    const results = await provider.scrapeMany([
      "https://alpha.com",
      "https://beta.com",
      "https://gamma.com",
    ])
    expect(results[0].url).toBe("https://alpha.com")
    expect(results[1].url).toBe("https://beta.com")
    expect(results[2].url).toBe("https://gamma.com")
  })

  it("returns empty array for empty input", async () => {
    const results = await provider.scrapeMany([])
    expect(results).toHaveLength(0)
  })

  it("all results validate against RawExtractionSchema", async () => {
    const results = await provider.scrapeMany([
      "https://a.com/pricing",
      "https://b.com/careers",
    ])
    for (const result of results) {
      expect(() => RawExtractionSchema.parse(result)).not.toThrow()
    }
  })
})

// ─── JinaReaderProvider (mocked fetch) ───────────────────────────────────────

describe("JinaReaderProvider — network behaviour (mocked fetch)", () => {
  function makeFetchMock(markdown = "# Content\n\nSome content here.") {
    return vi.fn().mockResolvedValue({
      ok: true,
      text: async () => markdown,
    })
  }

  it("calls https://r.jina.ai/<url>", async () => {
    const fetchMock = makeFetchMock()
    vi.stubGlobal("fetch", fetchMock)

    const provider = getProvider("real")
    await provider.scrapeUrl("https://example.com/pricing")

    const [calledUrl] = fetchMock.mock.calls[0]
    expect(calledUrl).toBe("https://r.jina.ai/https://example.com/pricing")
  })

  it("returns status=ok when fetch succeeds", async () => {
    vi.stubGlobal("fetch", makeFetchMock())

    const provider = getProvider("real")
    const result = await provider.scrapeUrl("https://example.com")
    expect(result.status).toBe("ok")
  })

  it("returns the markdown content from the response", async () => {
    vi.stubGlobal("fetch", makeFetchMock("# My Company\n\nBuilt for teams."))

    const provider = getProvider("real")
    const result = await provider.scrapeUrl("https://example.com")
    expect(result.markdown).toContain("My Company")
  })

  it("extracts title from Jina's 'Title:' header line", async () => {
    vi.stubGlobal("fetch", makeFetchMock("Title: My Company\n\n# My Company\n\nContent."))

    const provider = getProvider("real")
    const result = await provider.scrapeUrl("https://example.com")
    expect(result.title).toBe("My Company")
  })

  it("does not set title when no 'Title:' header line", async () => {
    vi.stubGlobal("fetch", makeFetchMock("# Plain content\n\nNo title line."))

    const provider = getProvider("real")
    const result = await provider.scrapeUrl("https://example.com")
    expect(result.title).toBeUndefined()
  })

  it("returns status=error for non-OK HTTP response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }))

    const provider = getProvider("real")
    const result = await provider.scrapeUrl("https://example.com")
    expect(result.status).toBe("error")
  })

  it("returns status=timeout for HTTP 408 response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 408 }))

    const provider = getProvider("real")
    const result = await provider.scrapeUrl("https://example.com")
    expect(result.status).toBe("timeout")
  })

  it("returns status=error when fetch throws a generic error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network failure")))

    const provider = getProvider("real")
    const result = await provider.scrapeUrl("https://example.com")
    expect(result.status).toBe("error")
  })

  it("returns status=timeout when fetch throws a TimeoutError", async () => {
    const timeoutError = new Error("The operation timed out.")
    timeoutError.name = "TimeoutError"
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(timeoutError))

    const provider = getProvider("real")
    const result = await provider.scrapeUrl("https://example.com")
    expect(result.status).toBe("timeout")
  })

  it("result always validates against RawExtractionSchema", async () => {
    vi.stubGlobal("fetch", makeFetchMock())

    const provider = getProvider("real")
    const result = await provider.scrapeUrl("https://example.com")
    expect(() => RawExtractionSchema.parse(result)).not.toThrow()
  })

  it("textPreview is truncated from markdown", async () => {
    const longMarkdown = "# Content\n\n" + "A ".repeat(200)
    vi.stubGlobal("fetch", makeFetchMock(longMarkdown))

    const provider = getProvider("real")
    const result = await provider.scrapeUrl("https://example.com")
    expect(result.textPreview).toBeTruthy()
    expect((result.textPreview ?? "").length).toBeLessThanOrEqual(320)
  })

  it("url field matches the scrape target", async () => {
    vi.stubGlobal("fetch", makeFetchMock())

    const provider = getProvider("real")
    const result = await provider.scrapeUrl("https://myco.io/pricing")
    expect(result.url).toBe("https://myco.io/pricing")
  })
})

describe("JinaReaderProvider — JINA_API_KEY header behaviour", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "# Content",
    }))
  })

  it("sends Authorization header when JINA_API_KEY is set", async () => {
    vi.stubEnv("JINA_API_KEY", "test-key-abc")

    // Create provider AFTER stubbing so constructor reads the stubbed value
    const provider = getProvider("real")
    await provider.scrapeUrl("https://example.com")

    const [, options] = (vi.mocked(fetch) as ReturnType<typeof vi.fn>).mock.calls[0]
    expect((options as RequestInit & { headers: Record<string, string> }).headers?.["Authorization"]).toBe("Bearer test-key-abc")
  })

  it("does not send Authorization header when JINA_API_KEY is empty", async () => {
    vi.stubEnv("JINA_API_KEY", "")

    const provider = getProvider("real")
    await provider.scrapeUrl("https://example.com")

    const [, options] = (vi.mocked(fetch) as ReturnType<typeof vi.fn>).mock.calls[0]
    expect((options as RequestInit & { headers: Record<string, string> }).headers?.["Authorization"]).toBeUndefined()
  })

  it("always sends Accept: text/markdown header", async () => {
    vi.stubEnv("JINA_API_KEY", "")

    const provider = getProvider("real")
    await provider.scrapeUrl("https://example.com")

    const [, options] = (vi.mocked(fetch) as ReturnType<typeof vi.fn>).mock.calls[0]
    expect((options as RequestInit & { headers: Record<string, string> }).headers?.["Accept"]).toBe("text/markdown")
  })
})

describe("JinaReaderProvider.scrapeMany", () => {
  it("processes URLs sequentially (one at a time)", async () => {
    const callOrder: string[] = []
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async (url: string) => {
      callOrder.push(url)
      return { ok: true, text: async () => "# Content" }
    }))

    const provider = getProvider("real")
    await provider.scrapeMany([
      "https://example.com/a",
      "https://example.com/b",
    ])

    expect(callOrder).toHaveLength(2)
    expect(callOrder[0]).toContain("/a")
    expect(callOrder[1]).toContain("/b")
  })

  it("returns one result per URL", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "# Content",
    }))

    const provider = getProvider("real")
    const results = await provider.scrapeMany(["https://a.com", "https://b.com"])
    expect(results).toHaveLength(2)
  })
})

// ─── getProvider — Anakin provider selection ──────────────────────────────────

describe("getProvider — Anakin provider selection", () => {
  it("returns Anakin provider when SCRAPE_PROVIDER=anakin", () => {
    vi.stubEnv("SCRAPE_PROVIDER", "anakin")
    const provider = getProvider()
    expect(provider.name).toBe("anakin")
  })

  it("returns Anakin provider when nameOverride=anakin", () => {
    const provider = getProvider("anakin")
    expect(provider.name).toBe("anakin")
  })

  it("nameOverride=anakin beats SCRAPE_PROVIDER=mock", () => {
    vi.stubEnv("SCRAPE_PROVIDER", "mock")
    const provider = getProvider("anakin")
    expect(provider.name).toBe("anakin")
  })

  it("returns jina-reader when SCRAPE_PROVIDER=real (no ANAKIN_API_KEY)", () => {
    vi.stubEnv("SCRAPE_PROVIDER", "real")
    vi.stubEnv("ANAKIN_API_KEY", "")
    const provider = getProvider()
    expect(provider.name).toBe("jina-reader")
  })

  it("returns jina-reader when SCRAPE_PROVIDER=jina", () => {
    vi.stubEnv("SCRAPE_PROVIDER", "jina")
    const provider = getProvider()
    expect(provider.name).toBe("jina-reader")
  })

  it("each call to getProvider('anakin') creates a fresh instance", () => {
    const a = getProvider("anakin")
    const b = getProvider("anakin")
    expect(a).not.toBe(b)
  })
})

// ─── AnakinScrapeProvider helpers ─────────────────────────────────────────────

/**
 * Returns an AnakinScrapeProvider wired with zero poll delay for fast tests.
 * All network calls must be covered by a vi.stubGlobal("fetch", …) before use.
 */
function makeAnakin() {
  return new AnakinScrapeProvider({ pollIntervalMs: 0, pollTimeoutMs: 5_000 })
}

/**
 * Build a fetch mock that simulates the Anakin async job pattern:
 *   call 1 (POST submit) → { jobId, status: "pending" }
 *   call 2 (GET poll)    → supplied result shape
 */
function makeFetchSequence(pollResult: Record<string, unknown>) {
  return vi.fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jobId: "job_test_123", status: "pending" }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => pollResult,
    })
}

// ─── AnakinScrapeProvider — submit step ───────────────────────────────────────

describe("AnakinScrapeProvider — submit step", () => {
  it("POSTs to /v1/url-scraper with the correct URL", async () => {
    vi.stubGlobal("fetch", makeFetchSequence({ status: "completed", markdown: "# OK", url: "https://example.com" }))

    const provider = makeAnakin()
    await provider.scrapeUrl("https://example.com")

    const [submitUrl, submitOpts] = (vi.mocked(fetch) as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit]
    expect(submitUrl).toContain("/v1/url-scraper")
    expect(submitOpts.method).toBe("POST")
  })

  it("sends X-API-Key header on submit", async () => {
    vi.stubEnv("ANAKIN_API_KEY", "test-anakin-key")
    vi.stubGlobal("fetch", makeFetchSequence({ status: "completed", markdown: "# OK", url: "https://example.com" }))

    // Re-create after stubbing env
    const provider = new AnakinScrapeProvider({ pollIntervalMs: 0, pollTimeoutMs: 5_000 })
    await provider.scrapeUrl("https://example.com")

    const [, submitOpts] = (vi.mocked(fetch) as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }]
    expect(submitOpts.headers?.["X-API-Key"]).toBe("test-anakin-key")
  })

  it("includes the target URL in the POST body", async () => {
    vi.stubGlobal("fetch", makeFetchSequence({ status: "completed", markdown: "# OK", url: "https://example.com/pricing" }))

    const provider = makeAnakin()
    await provider.scrapeUrl("https://example.com/pricing")

    const [, submitOpts] = (vi.mocked(fetch) as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit]
    const body = JSON.parse(submitOpts.body as string) as { url: string }
    expect(body.url).toBe("https://example.com/pricing")
  })

  it("returns status=error when submit returns non-OK HTTP", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }))

    const provider = makeAnakin()
    const result = await provider.scrapeUrl("https://example.com")
    expect(result.status).toBe("error")
  })

  it("returns status=error when submit throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network down")))

    const provider = makeAnakin()
    const result = await provider.scrapeUrl("https://example.com")
    expect(result.status).toBe("error")
  })

  it("returns status=timeout when submit throws a TimeoutError", async () => {
    const err = new Error("Timed out")
    err.name = "TimeoutError"
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(err))

    const provider = makeAnakin()
    const result = await provider.scrapeUrl("https://example.com")
    expect(result.status).toBe("timeout")
  })
})

// ─── AnakinScrapeProvider — poll step ────────────────────────────────────────

describe("AnakinScrapeProvider — poll step", () => {
  it("GETs /v1/url-scraper/{jobId} to poll", async () => {
    vi.stubGlobal("fetch", makeFetchSequence({ status: "completed", markdown: "# Content", url: "https://example.com" }))

    const provider = makeAnakin()
    await provider.scrapeUrl("https://example.com")

    const [pollUrl] = (vi.mocked(fetch) as ReturnType<typeof vi.fn>).mock.calls[1] as [string]
    expect(pollUrl).toContain("/v1/url-scraper/job_test_123")
  })

  it("sends X-API-Key header on poll", async () => {
    vi.stubEnv("ANAKIN_API_KEY", "test-anakin-key")
    vi.stubGlobal("fetch", makeFetchSequence({ status: "completed", markdown: "# Content", url: "https://example.com" }))

    const provider = new AnakinScrapeProvider({ pollIntervalMs: 0, pollTimeoutMs: 5_000 })
    await provider.scrapeUrl("https://example.com")

    const [, pollOpts] = (vi.mocked(fetch) as ReturnType<typeof vi.fn>).mock.calls[1] as [string, RequestInit & { headers: Record<string, string> }]
    expect(pollOpts.headers?.["X-API-Key"]).toBe("test-anakin-key")
  })

  it("returns status=ok when job completes", async () => {
    vi.stubGlobal("fetch", makeFetchSequence({ status: "completed", markdown: "# Hello", url: "https://example.com" }))

    const provider = makeAnakin()
    const result = await provider.scrapeUrl("https://example.com")
    expect(result.status).toBe("ok")
  })

  it("returns the markdown content from the completed job", async () => {
    vi.stubGlobal("fetch", makeFetchSequence({ status: "completed", markdown: "# My Company\n\nContent here.", url: "https://example.com" }))

    const provider = makeAnakin()
    const result = await provider.scrapeUrl("https://example.com")
    expect(result.markdown).toContain("My Company")
  })

  it("extracts title from '# ' heading line", async () => {
    vi.stubGlobal("fetch", makeFetchSequence({ status: "completed", markdown: "# My Company\n\nContent.", url: "https://example.com" }))

    const provider = makeAnakin()
    const result = await provider.scrapeUrl("https://example.com")
    expect(result.title).toBe("My Company")
  })

  it("does not set title when no '# ' heading", async () => {
    vi.stubGlobal("fetch", makeFetchSequence({ status: "completed", markdown: "Plain content.", url: "https://example.com" }))

    const provider = makeAnakin()
    const result = await provider.scrapeUrl("https://example.com")
    expect(result.title).toBeUndefined()
  })

  it("echoes the target url in the result", async () => {
    vi.stubGlobal("fetch", makeFetchSequence({ status: "completed", markdown: "# OK", url: "https://myco.io/pricing" }))

    const provider = makeAnakin()
    const result = await provider.scrapeUrl("https://myco.io/pricing")
    expect(result.url).toBe("https://myco.io/pricing")
  })

  it("result validates against RawExtractionSchema", async () => {
    vi.stubGlobal("fetch", makeFetchSequence({ status: "completed", markdown: "# OK", url: "https://example.com" }))

    const provider = makeAnakin()
    const result = await provider.scrapeUrl("https://example.com")
    expect(() => RawExtractionSchema.parse(result)).not.toThrow()
  })

  it("textPreview is truncated to 300 chars", async () => {
    const longMarkdown = "# Title\n\n" + "A ".repeat(300)
    vi.stubGlobal("fetch", makeFetchSequence({ status: "completed", markdown: longMarkdown, url: "https://example.com" }))

    const provider = makeAnakin()
    const result = await provider.scrapeUrl("https://example.com")
    expect((result.textPreview ?? "").length).toBeLessThanOrEqual(320)
  })

  it("returns status=error when job fails", async () => {
    vi.stubGlobal("fetch", makeFetchSequence({ status: "failed", error: "Blocked by target site" }))

    const provider = makeAnakin()
    const result = await provider.scrapeUrl("https://example.com")
    expect(result.status).toBe("error")
  })

  it("continues polling through 'processing' status then succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => ({ jobId: "job_abc", status: "pending" }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ status: "processing" }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ status: "completed", markdown: "# Done" }) })
    )

    const provider = makeAnakin()
    const result = await provider.scrapeUrl("https://example.com")
    expect(result.status).toBe("ok")
    expect(result.markdown).toContain("Done")
    expect((vi.mocked(fetch) as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(3)
  })

  it("returns status=timeout when poll deadline is exceeded", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => ({ jobId: "job_abc", status: "pending" }) })
        .mockResolvedValue({ ok: true, json: async () => ({ status: "processing" }) })
    )

    // Very short timeout so it expires after one or two polls
    const provider = new AnakinScrapeProvider({ pollIntervalMs: 0, pollTimeoutMs: 1 })
    const result = await provider.scrapeUrl("https://example.com")
    expect(result.status).toBe("timeout")
  })

  it("returns status=error when poll returns non-OK HTTP", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => ({ jobId: "job_abc", status: "pending" }) })
        .mockResolvedValueOnce({ ok: false, status: 500 })
    )

    const provider = makeAnakin()
    const result = await provider.scrapeUrl("https://example.com")
    expect(result.status).toBe("error")
  })
})

// ─── AnakinScrapeProvider.scrapeMany ─────────────────────────────────────────

describe("AnakinScrapeProvider.scrapeMany", () => {
  function makeCompletedFetch(markdown = "# Content") {
    return vi.fn()
      .mockResolvedValue({ ok: true, json: async () => ({ jobId: "job_x", status: "pending" }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ jobId: "job_x", status: "pending" }) })
  }

  it("returns one result per URL", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        // URL 1: submit + poll
        .mockResolvedValueOnce({ ok: true, json: async () => ({ jobId: "j1", status: "pending" }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ status: "completed", markdown: "# A" }) })
        // URL 2: submit + poll
        .mockResolvedValueOnce({ ok: true, json: async () => ({ jobId: "j2", status: "pending" }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ status: "completed", markdown: "# B" }) })
    )

    const provider = makeAnakin()
    const results = await provider.scrapeMany(["https://a.com", "https://b.com"])
    expect(results).toHaveLength(2)
  })

  it("preserves URL order", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => ({ jobId: "j1", status: "pending" }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ status: "completed", markdown: "# Alpha" }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ jobId: "j2", status: "pending" }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ status: "completed", markdown: "# Beta" }) })
    )

    const provider = makeAnakin()
    const results = await provider.scrapeMany(["https://alpha.com", "https://beta.com"])
    expect(results[0].url).toBe("https://alpha.com")
    expect(results[1].url).toBe("https://beta.com")
  })

  it("returns empty array for empty input", async () => {
    const provider = makeAnakin()
    const results = await provider.scrapeMany([])
    expect(results).toHaveLength(0)
  })
})
