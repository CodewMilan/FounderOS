import type { ScrapeProvider } from "./types"
import type { RawExtraction } from "@/lib/schemas"

/**
 * JinaReaderProvider fetches a URL via Jina AI Reader (https://r.jina.ai/),
 * which returns clean markdown for any public webpage — no API key required
 * for basic usage.
 *
 * Activate by setting SCRAPE_PROVIDER=real in your environment.
 * Optionally set JINA_API_KEY for higher rate limits.
 */
export class JinaReaderProvider implements ScrapeProvider {
  readonly name = "jina-reader"

  private apiKey: string | undefined

  constructor() {
    this.apiKey = process.env.JINA_API_KEY
  }

  async scrapeUrl(url: string): Promise<RawExtraction> {
    const fetchedAt = new Date().toISOString()
    const jinaUrl = `https://r.jina.ai/${url}`

    const headers: Record<string, string> = {
      Accept: "text/markdown",
    }
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`
    }

    let markdown: string
    let title: string | undefined
    let status: RawExtraction["status"] = "ok"

    try {
      const res = await fetch(jinaUrl, { headers, signal: AbortSignal.timeout(15_000) })
      if (!res.ok) {
        status = res.status === 408 ? "timeout" : "error"
        markdown = `Fetch failed: HTTP ${res.status}`
      } else {
        markdown = await res.text()
        // Jina returns "Title: ..." as first line
        const firstLine = markdown.split("\n")[0] ?? ""
        if (firstLine.startsWith("Title:")) {
          title = firstLine.replace("Title:", "").trim()
        }
      }
    } catch (err) {
      status = err instanceof Error && err.name === "TimeoutError" ? "timeout" : "error"
      markdown = `Fetch failed: ${err instanceof Error ? err.message : String(err)}`
    }

    return {
      id: `re-${Date.now()}-real`,
      sourceId: "",          // caller fills this in
      url,
      fetchedAt,
      contentType: "markdown",
      title,
      markdown,
      textPreview: markdown.slice(0, 300).replace(/\n+/g, " "),
      status,
    }
  }

  async scrapeMany(urls: string[]): Promise<RawExtraction[]> {
    // Sequential to respect rate limits
    const results: RawExtraction[] = []
    for (const url of urls) {
      results.push(await this.scrapeUrl(url))
    }
    return results
  }
}
