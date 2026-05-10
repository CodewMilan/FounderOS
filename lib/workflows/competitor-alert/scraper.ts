import type { RawExtraction } from "@/lib/schemas"

// ─── Mock fallback markdown ───────────────────────────────────────────────────

const MOCK_MARKDOWN = `# Acme Corp

## Features
- **AI Assistant** — A new AI-powered assistant that answers customer questions instantly
- **Advanced Analytics** — Real-time dashboards with predictive insights

## Pricing
- Starter: $29/mo (was $19/mo)
- Pro: $99/mo
- Enterprise: Contact us
`

// ─── scrapeCompetitorUrl ──────────────────────────────────────────────────────

/**
 * Scrapes a competitor URL and returns normalized markdown content.
 *
 * Provider priority:
 * 1. JinaReaderProvider — works without any API key, used whenever
 *    SCRAPE_PROVIDER is not explicitly "mock".
 * 2. Mock — used when SCRAPE_PROVIDER=mock or in test environments
 *    where no real HTTP calls should be made.
 *
 * Anakin was removed as the primary here because their URL-scraper
 * endpoint (`/v1/url-scraper`) returns a 302 redirect that lands on an
 * HTML page, causing JSON parse failures. Jina Reader is stable and
 * free for basic usage with no key required.
 */
export async function scrapeCompetitorUrl(url: string): Promise<RawExtraction> {
  const provider = process.env.SCRAPE_PROVIDER ?? "real"

  if (provider === "mock") {
    console.warn("[competitor-alert/scraper] SCRAPE_PROVIDER=mock — using mock extraction")
    return makeMockExtraction(url)
  }

  const { JinaReaderProvider } = await import("@/lib/providers/real")
  const jinaProvider = new JinaReaderProvider()
  const result = await jinaProvider.scrapeUrl(url)

  if (result.status !== "ok" || !result.markdown) {
    console.error("[competitor-alert/scraper] Jina scrape failed:", result.markdown)
    throw new Error(`Failed to scrape ${url}: ${result.markdown ?? "empty response"}`)
  }

  console.log(
    `[competitor-alert/scraper] Scraped ${url} via Jina — ${result.markdown.length} chars`
  )
  return result
}

function makeMockExtraction(url: string): RawExtraction {
  return {
    id: `re-mock-${Date.now()}`,
    sourceId: "",
    url,
    fetchedAt: new Date().toISOString(),
    contentType: "markdown",
    title: "Acme Corp (mock)",
    markdown: MOCK_MARKDOWN,
    textPreview: MOCK_MARKDOWN.slice(0, 300),
    status: "ok",
  }
}
