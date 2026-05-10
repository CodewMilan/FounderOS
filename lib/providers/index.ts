import type { ScrapeProvider } from "./types"
import { MockScrapeProvider } from "./mock"
import { JinaReaderProvider } from "./real"

export type { ScrapeProvider }

export type ProviderName = "mock" | "real"

/**
 * Returns the appropriate provider.
 *
 * Priority order:
 * 1. `nameOverride` argument — useful in tests and server actions.
 * 2. `SCRAPE_PROVIDER` environment variable.
 * 3. Defaults to "mock".
 *
 * Set SCRAPE_PROVIDER=real in your environment to use the Jina Reader provider.
 */
export function getProvider(nameOverride?: ProviderName): ScrapeProvider {
  const name = nameOverride ?? process.env.SCRAPE_PROVIDER
  if (name === "real") {
    return new JinaReaderProvider()
  }
  return new MockScrapeProvider()
}
