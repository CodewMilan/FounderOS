import type { RawExtraction } from "@/lib/schemas"

/**
 * ScrapeProvider abstracts away how a URL is fetched and converted into a
 * normalized RawExtraction. The UI and services depend only on this interface,
 * never on a specific implementation.
 */
export interface ScrapeProvider {
  /** Human-readable name used in logs and error messages. */
  readonly name: string
  /** Fetch a single URL and return normalized content. */
  scrapeUrl(url: string): Promise<RawExtraction>
  /** Convenience batch wrapper. */
  scrapeMany(urls: string[]): Promise<RawExtraction[]>
}
