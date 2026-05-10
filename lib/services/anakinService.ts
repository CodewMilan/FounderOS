/**
 * anakinService
 *
 * Wraps the Anakin URL Scraper (and Jina Reader fallback) behind a simple
 * interface. Returns raw markdown string for downstream analysis.
 *
 * Provider priority:
 * 1. SCRAPE_PROVIDER=mock → returns deterministic mock markdown
 * 2. SCRAPE_PROVIDER=anakin → uses AnakinScrapeProvider (requires ANAKIN_API_KEY)
 * 3. Default (anything else) → uses JinaReaderProvider (no key needed)
 */

const MOCK_MARKDOWN = `# Acme Corp

## About
Acme Corp builds developer tooling for modern teams. Founded in 2021.

## Features
- **AI Assistant** — A new AI-powered assistant that answers customer questions instantly
- **Advanced Analytics** — Real-time dashboards with predictive insights
- **Team Collaboration** — Shared workspaces with live editing

## Pricing
- Starter: $29/mo
- Pro: $99/mo
- Enterprise: Contact us

## Hiring
We are hiring Senior Engineers in Berlin and Remote.
`

export interface ScrapeResult {
  markdown: string
  title?: string
  url: string
  fetchedAt: string
}

/**
 * Scrape a single URL and return markdown content.
 * Falls back to mock if SCRAPE_PROVIDER=mock or on errors.
 */
export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const provider = process.env.SCRAPE_PROVIDER ?? "real"
  const fetchedAt = new Date().toISOString()

  if (provider === "mock") {
    return { markdown: MOCK_MARKDOWN, title: "Acme Corp (mock)", url, fetchedAt }
  }

  if (provider === "anakin") {
    const apiKey = process.env.ANAKIN_API_KEY
    if (!apiKey) {
      console.warn("[anakinService] ANAKIN_API_KEY not set — falling back to Jina")
      return scrapeViaJina(url, fetchedAt)
    }
    return scrapeViaAnakin(url, apiKey, fetchedAt)
  }

  return scrapeViaJina(url, fetchedAt)
}

async function scrapeViaAnakin(url: string, apiKey: string, fetchedAt: string): Promise<ScrapeResult> {
  const baseUrl = (process.env.ANAKIN_BASE_URL ?? "https://api.anakin.io").replace(/\/$/, "")

  // Submit job
  const submitRes = await fetch(`${baseUrl}/v1/url-scraper`, {
    method: "POST",
    headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ url, country: "us" }),
    signal: AbortSignal.timeout(30_000),
  })

  if (!submitRes.ok) {
    throw new Error(`Anakin submit failed: HTTP ${submitRes.status}`)
  }

  const { jobId } = await submitRes.json() as { jobId: string }
  const pollIntervalMs = 3_000
  const deadline = Date.now() + 90_000

  while (Date.now() < deadline) {
    await new Promise<void>((r) => setTimeout(r, pollIntervalMs))

    const pollRes = await fetch(`${baseUrl}/v1/url-scraper/${jobId}`, {
      headers: { "X-API-Key": apiKey },
      signal: AbortSignal.timeout(15_000),
    })

    if (!pollRes.ok) throw new Error(`Anakin poll failed: HTTP ${pollRes.status}`)

    const job = await pollRes.json() as {
      status: string
      markdown?: string
      error?: string | null
    }

    if (job.status === "completed") {
      const markdown = job.markdown ?? ""
      return { markdown, url, fetchedAt, title: extractTitle(markdown) }
    }
    if (job.status === "failed") {
      throw new Error(`Anakin job failed: ${job.error ?? "unknown"}`)
    }
  }

  throw new Error("Anakin job polling timed out")
}

async function scrapeViaJina(url: string, fetchedAt: string): Promise<ScrapeResult> {
  const jinaUrl = `https://r.jina.ai/${url}`
  const res = await fetch(jinaUrl, {
    headers: { "Accept": "text/markdown" },
    signal: AbortSignal.timeout(30_000),
  })

  if (!res.ok) throw new Error(`Jina scrape failed: HTTP ${res.status}`)

  const markdown = await res.text()
  if (!markdown || markdown.trim().length === 0) throw new Error("Jina returned empty content")

  return { markdown, url, fetchedAt, title: extractTitle(markdown) }
}

function extractTitle(markdown: string): string | undefined {
  const firstLine = markdown.split("\n")[0] ?? ""
  return firstLine.startsWith("# ") ? firstLine.slice(2).trim() : undefined
}
