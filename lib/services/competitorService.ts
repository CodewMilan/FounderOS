import { store } from "@/lib/store"
import { CompetitorSnapshotSchema, CompetitorChangeSchema } from "@/lib/schemas"
import type { CompetitorChange, CompetitorSnapshot, RawExtraction } from "@/lib/schemas"
import { extractCompetitorPage } from "@/lib/competitors/extractor"
import { detectChanges } from "@/lib/competitors/detector"
import { ingestionService } from "./ingestionService"
import { sourceService } from "./sourceService"

// ─── Competitor service ───────────────────────────────────────────────────────

export interface ScanResult {
  scanned: number
  detected: number
  changes: CompetitorChange[]
}

export const competitorService = {
  // ── Read ────────────────────────────────────────────────────────────────────

  /** Return all stored competitor changes, sorted newest first. */
  listChanges(): CompetitorChange[] {
    return store.changes
      .list()
      .sort((a, b) => b.detectedAt.localeCompare(a.detectedAt))
  },

  /** Return a single change by id. */
  getChange(id: string): CompetitorChange | undefined {
    return store.changes.get(id)
  },

  /** Return the most recent snapshot for a source. */
  getSnapshot(sourceId: string): CompetitorSnapshot | undefined {
    return store.snapshots.bySourceId(sourceId)
  },

  // ── Write ───────────────────────────────────────────────────────────────────

  /** Persist a change to the store after Zod validation. */
  saveChange(change: CompetitorChange): void {
    CompetitorChangeSchema.parse(change)
    store.changes.set(change)
  },

  /** Persist a snapshot to the store after Zod validation. */
  saveSnapshot(snapshot: CompetitorSnapshot): void {
    CompetitorSnapshotSchema.parse(snapshot)
    store.snapshots.set(snapshot)
  },

  // ── Pipeline ────────────────────────────────────────────────────────────────

  /**
   * Process a raw extraction for a competitor source:
   * 1. Extract structured page data.
   * 2. Compare against the previous snapshot.
   * 3. If content changed, create and store a CompetitorChange.
   * 4. Save the current content as the new snapshot.
   *
   * Returns the detected change (or null if content is unchanged).
   */
  async processExtraction(
    extraction: RawExtraction,
    competitorName: string
  ): Promise<CompetitorChange | null> {
    const pageExtraction = extractCompetitorPage(extraction, competitorName)

    const previousSnapshot = store.snapshots.bySourceId(extraction.sourceId)

    const currentSnapshot: CompetitorSnapshot = {
      id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sourceId: extraction.sourceId,
      competitorName: pageExtraction.competitorName,
      pageCategory: pageExtraction.pageCategory,
      url: extraction.url,
      content: pageExtraction.normalizedContent,
      capturedAt: extraction.fetchedAt,
    }

    // Persist the latest snapshot
    competitorService.saveSnapshot(currentSnapshot)

    if (!previousSnapshot) {
      // First capture — no comparison possible yet
      return null
    }

    const change = detectChanges(previousSnapshot, currentSnapshot)
    if (change) {
      competitorService.saveChange(change)
    }

    return change
  },

  /**
   * Scan all competitor sources in the store.
   * For each source:
   *   1. Ingest using the configured provider (Anakin, Jina, or mock).
   *   2. Run change detection against the stored snapshot.
   *   3. Persist any detected changes.
   *
   * Returns a summary of the scan. Individual source failures do not abort
   * the full scan — errors are swallowed so other sources continue processing.
   */
  async scanAll(): Promise<ScanResult> {
    const competitorSources = sourceService
      .list()
      .filter((s) => s.module === "competitors")

    const detected: CompetitorChange[] = []

    for (const source of competitorSources) {
      try {
        // Use the configured provider — no override means getProvider() reads
        // SCRAPE_PROVIDER env var and falls back to mock if not set.
        const result = await ingestionService.ingest(source.id)
        if (!result) continue

        // Derive a friendly competitor name from the source label
        const name = source.label
          .replace(/pricing|changelog|careers|hiring|blog|homepage/gi, "")
          .trim()
          .split(/\s+/)[0]

        const change = await competitorService.processExtraction(
          result.extraction,
          name || source.label
        )

        if (change) detected.push(change)
      } catch {
        // Continue scanning even if one source fails
      }
    }

    return {
      scanned: competitorSources.length,
      detected: detected.length,
      changes: detected,
    }
  },
}
