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
 */
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest"
import { getProvider } from "@/lib/providers"
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
