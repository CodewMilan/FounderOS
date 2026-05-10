import { store } from "@/lib/store"
import { RawExtractionSchema } from "@/lib/schemas"
import type { RawExtraction } from "@/lib/schemas"
import { getProvider, type ProviderName } from "@/lib/providers"
import { sourceService } from "./sourceService"

// ─── Ingestion service ────────────────────────────────────────────────────────

export interface IngestResult {
  extraction: RawExtraction
  provider: string
  cached: boolean
}

export const ingestionService = {
  /**
   * Ingest a source by id.
   *
   * 1. Looks up the source.
   * 2. Calls the active provider to scrape the URL.
   * 3. Attaches sourceId and validates the extraction shape.
   * 4. Persists the extraction to the store.
   * 5. Bumps source.updatedAt.
   *
   * Returns null if the source id does not exist.
   */
  async ingest(
    sourceId: string,
    providerOverride?: ProviderName
  ): Promise<IngestResult | null> {
    const source = sourceService.get(sourceId)
    if (!source) return null

    const provider = getProvider(providerOverride)

    const raw = await provider.scrapeUrl(source.url)

    // Attach the correct sourceId (provider returns empty string by default).
    const extraction: RawExtraction = {
      ...raw,
      sourceId,
    }

    // Validate at the persistence boundary.
    RawExtractionSchema.parse(extraction)

    store.extractions.set(extraction)

    // Bump source timestamp so callers know it was recently processed.
    sourceService.update(sourceId, {})

    return { extraction, provider: provider.name, cached: false }
  },

  /**
   * Ingest an arbitrary URL directly without requiring a stored source.
   * Used by the prospect pipeline when analyzing a new company URL.
   */
  async ingestUrl(url: string, providerOverride?: ProviderName): Promise<RawExtraction> {
    const provider = getProvider(providerOverride)
    const raw = await provider.scrapeUrl(url)
    // sourceId is empty string for ad-hoc URL ingestions (no tracked source)
    const extraction: RawExtraction = { ...raw, url, sourceId: "" }
    RawExtractionSchema.parse(extraction)
    return extraction
  },

  /**
   * Return the most recent extraction for a source, if any.
   */
  getLatestExtraction(sourceId: string): RawExtraction | undefined {
    return store.extractions.bySourceId(sourceId)
  },

  /**
   * List all stored extractions.
   */
  listExtractions(): RawExtraction[] {
    return store.extractions.list()
  },
}
