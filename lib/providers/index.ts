import type { ScrapeProvider } from "./types"
import { MockScrapeProvider } from "./mock"
import { JinaReaderProvider } from "./real"
import { AnakinScrapeProvider } from "./anakin"

export type { ScrapeProvider }

export type ProviderName = "mock" | "real" | "jina" | "anakin"

/**
 * Returns the appropriate provider.
 *
 * Priority order:
 * 1. `nameOverride` argument — useful in tests and server actions.
 * 2. `SCRAPE_PROVIDER` environment variable.
 * 3. Defaults to "mock".
 *
 * Provider map:
 *   "anakin"       → AnakinScrapeProvider  (requires ANAKIN_API_KEY)
 *   "real" / "jina"→ JinaReaderProvider    (JINA_API_KEY optional)
 *   anything else  → MockScrapeProvider    (no credentials needed)
 *
 * Set SCRAPE_PROVIDER=anakin to use the Anakin URL Scraper.
 * Set SCRAPE_PROVIDER=real  to use Jina AI Reader.
 */
export function getProvider(nameOverride?: ProviderName): ScrapeProvider {
  const name = nameOverride ?? process.env.SCRAPE_PROVIDER
  if (name === "anakin") {
    return new AnakinScrapeProvider()
  }
  if (name === "real" || name === "jina") {
    return new JinaReaderProvider()
  }
  return new MockScrapeProvider()
}
