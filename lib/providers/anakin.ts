import type { ScrapeProvider } from "./types"
import type { RawExtraction } from "@/lib/schemas"

// ─── Anakin API response shapes ───────────────────────────────────────────────

interface AnakinSubmitResponse {
  jobId: string
  status: string
}

interface AnakinJobResult {
  id?: string
  status: "pending" | "queued" | "processing" | "completed" | "failed"
  url?: string
  markdown?: string
  error?: string | null
}

// ─── Provider options (overridable in tests) ──────────────────────────────────

interface AnakinProviderOptions {
  /** How long to wait between polls. Default 3 000 ms. */
  pollIntervalMs?: number
  /** Maximum total time to wait for a job to complete. Default 90 000 ms. */
  pollTimeoutMs?: number
}

// ─── AnakinScrapeProvider ─────────────────────────────────────────────────────

/**
 * AnakinScrapeProvider fetches URLs via the Anakin URL Scraper API
 * (https://api.anakin.io/v1/url-scraper).
 *
 * The API is async: submit a POST to receive a jobId, then poll the
 * GET endpoint until status === "completed". Returns clean markdown.
 *
 * Activate by setting SCRAPE_PROVIDER=anakin in your environment.
 * Requires ANAKIN_API_KEY to be set.
 * Optionally set ANAKIN_BASE_URL to override the default endpoint.
 */
export class AnakinScrapeProvider implements ScrapeProvider {
  readonly name = "anakin"

  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly pollIntervalMs: number
  private readonly pollTimeoutMs: number

  constructor(options?: AnakinProviderOptions) {
    this.apiKey = process.env.ANAKIN_API_KEY ?? ""
    this.baseUrl = (process.env.ANAKIN_BASE_URL ?? "https://api.anakin.io").replace(/\/$/, "")
    this.pollIntervalMs = options?.pollIntervalMs ?? 3_000
    this.pollTimeoutMs = options?.pollTimeoutMs ?? 90_000
  }

  async scrapeUrl(url: string): Promise<RawExtraction> {
    const fetchedAt = new Date().toISOString()

    // ── Step 1: Submit the scrape job ─────────────────────────────────────────
    let jobId: string
    try {
      const submitRes = await fetch(`${this.baseUrl}/v1/url-scraper`, {
        method: "POST",
        headers: {
          "X-API-Key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, country: "us" }),
        signal: AbortSignal.timeout(30_000),
      })

      if (!submitRes.ok) {
        return this.makeErrorExtraction(
          url,
          fetchedAt,
          `Submit failed: HTTP ${submitRes.status}`,
          submitRes.status === 408 ? "timeout" : "error"
        )
      }

      const submitData = await submitRes.json() as AnakinSubmitResponse
      jobId = submitData.jobId
    } catch (err) {
      const isTimeout = err instanceof Error && err.name === "TimeoutError"
      return this.makeErrorExtraction(
        url,
        fetchedAt,
        err instanceof Error ? err.message : String(err),
        isTimeout ? "timeout" : "error"
      )
    }

    // ── Step 2: Poll until completed or timed out ─────────────────────────────
    const deadline = Date.now() + this.pollTimeoutMs

    while (Date.now() < deadline) {
      if (this.pollIntervalMs > 0) {
        await new Promise<void>((r) => setTimeout(r, this.pollIntervalMs))
      }

      try {
        const pollRes = await fetch(`${this.baseUrl}/v1/url-scraper/${jobId}`, {
          headers: { "X-API-Key": this.apiKey },
          signal: AbortSignal.timeout(15_000),
        })

        if (!pollRes.ok) {
          return this.makeErrorExtraction(
            url,
            fetchedAt,
            `Poll failed: HTTP ${pollRes.status}`,
            pollRes.status === 408 ? "timeout" : "error"
          )
        }

        const job = await pollRes.json() as AnakinJobResult

        if (job.status === "completed") {
          const markdown = job.markdown ?? ""
          return {
            id: `re-${Date.now()}-anakin`,
            sourceId: "",
            url,
            fetchedAt,
            contentType: "markdown",
            title: this.extractTitle(markdown),
            markdown,
            textPreview: markdown.slice(0, 300).replace(/\n+/g, " "),
            status: "ok",
          }
        }

        if (job.status === "failed") {
          return this.makeErrorExtraction(
            url,
            fetchedAt,
            job.error ?? "Job failed",
            "error"
          )
        }

        // pending / queued / processing — keep polling
      } catch {
        // Transient poll error — keep trying until deadline
      }
    }

    return this.makeErrorExtraction(url, fetchedAt, "Job polling timed out", "timeout")
  }

  async scrapeMany(urls: string[]): Promise<RawExtraction[]> {
    // Sequential to respect credit usage
    const results: RawExtraction[] = []
    for (const url of urls) {
      results.push(await this.scrapeUrl(url))
    }
    return results
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private makeErrorExtraction(
    url: string,
    fetchedAt: string,
    message: string,
    status: RawExtraction["status"] = "error"
  ): RawExtraction {
    return {
      id: `re-${Date.now()}-anakin`,
      sourceId: "",
      url,
      fetchedAt,
      contentType: "markdown",
      markdown: message,
      textPreview: message.slice(0, 300),
      status,
    }
  }

  private extractTitle(markdown: string): string | undefined {
    const firstLine = markdown.split("\n")[0] ?? ""
    if (firstLine.startsWith("# ")) {
      return firstLine.slice(2).trim()
    }
    return undefined
  }
}
