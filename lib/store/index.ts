import type {
  Source,
  RawExtraction,
  CompetitorChange,
  CompetitorSnapshot,
  ProspectRecord,
  ProspectBrief,
} from "@/lib/schemas"
import { seedSources, seedCompetitorChanges, seedProspects } from "@/lib/seed"
import { seedSnapshots } from "@/lib/competitors/snapshots"

/**
 * Module-level in-memory store.
 *
 * Seeded with demo data so the app works without any external data source.
 * For production, replace this with a database adapter that satisfies the
 * same interface.
 *
 * Note: state persists for the lifetime of the Node.js process. In dev mode
 * with hot reload, the store re-initialises on module change. In production,
 * all API route invocations share the same store.
 */

const _sources = new Map<string, Source>(seedSources.map((s) => [s.id, s]))
const _extractions = new Map<string, RawExtraction>()
const _changes = new Map<string, CompetitorChange>(
  seedCompetitorChanges.map((c) => [c.id, c])
)
const _snapshots = new Map<string, CompetitorSnapshot>(
  seedSnapshots.map((s) => [s.id, s])
)
const _prospects = new Map<string, ProspectRecord>(
  seedProspects.map((p) => [p.id, p])
)
const _briefs = new Map<string, ProspectBrief>()

// Helpers to re-seed the Maps for test resets
const _seedSources = () => new Map<string, Source>(seedSources.map((s) => [s.id, s]))
const _seedChanges = () =>
  new Map<string, CompetitorChange>(seedCompetitorChanges.map((c) => [c.id, c]))
const _seedSnaps = () =>
  new Map<string, CompetitorSnapshot>(seedSnapshots.map((s) => [s.id, s]))
const _seedProspects = () =>
  new Map<string, ProspectRecord>(seedProspects.map((p) => [p.id, p]))

export const store = {
  sources: {
    list(): Source[] {
      return Array.from(_sources.values())
    },
    get(id: string): Source | undefined {
      return _sources.get(id)
    },
    set(source: Source): void {
      _sources.set(source.id, source)
    },
    has(id: string): boolean {
      return _sources.has(id)
    },
    delete(id: string): boolean {
      return _sources.delete(id)
    },
  },

  extractions: {
    list(): RawExtraction[] {
      return Array.from(_extractions.values())
    },
    get(id: string): RawExtraction | undefined {
      return _extractions.get(id)
    },
    set(extraction: RawExtraction): void {
      _extractions.set(extraction.id, extraction)
    },
    bySourceId(sourceId: string): RawExtraction | undefined {
      return Array.from(_extractions.values()).find(
        (e) => e.sourceId === sourceId
      )
    },
  },

  changes: {
    list(): CompetitorChange[] {
      return Array.from(_changes.values())
    },
    get(id: string): CompetitorChange | undefined {
      return _changes.get(id)
    },
    set(change: CompetitorChange): void {
      _changes.set(change.id, change)
    },
    delete(id: string): boolean {
      return _changes.delete(id)
    },
  },

  snapshots: {
    list(): CompetitorSnapshot[] {
      return Array.from(_snapshots.values())
    },
    get(id: string): CompetitorSnapshot | undefined {
      return _snapshots.get(id)
    },
    /** Return the most recent snapshot for a given source, by capturedAt. */
    bySourceId(sourceId: string): CompetitorSnapshot | undefined {
      return Array.from(_snapshots.values())
        .filter((s) => s.sourceId === sourceId)
        .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))[0]
    },
    set(snapshot: CompetitorSnapshot): void {
      _snapshots.set(snapshot.id, snapshot)
    },
    delete(id: string): boolean {
      return _snapshots.delete(id)
    },
  },

  prospects: {
    list(): ProspectRecord[] {
      return Array.from(_prospects.values())
    },
    get(id: string): ProspectRecord | undefined {
      return _prospects.get(id)
    },
    set(prospect: ProspectRecord): void {
      _prospects.set(prospect.id, prospect)
    },
    delete(id: string): boolean {
      return _prospects.delete(id)
    },
  },

  briefs: {
    list(): ProspectBrief[] {
      return Array.from(_briefs.values())
    },
    get(id: string): ProspectBrief | undefined {
      return _briefs.get(id)
    },
    /**
     * Return the most recently generated brief for a prospect.
     *
     * Uses Map insertion order (guaranteed by spec) rather than timestamp sort
     * to avoid non-determinism when two briefs are generated in the same
     * millisecond (common in test environments).
     */
    byProspectId(prospectId: string): ProspectBrief | undefined {
      const matching = Array.from(_briefs.values()).filter(
        (b) => b.prospectId === prospectId
      )
      // Last element = most recently inserted = most recently generated
      return matching[matching.length - 1]
    },
    set(brief: ProspectBrief): void {
      _briefs.set(brief.id, brief)
    },
  },

  /**
   * Reset store to initial seed state.
   * Intended for use in tests and dev tooling only.
   */
  _reset(): void {
    _sources.clear()
    _extractions.clear()
    _changes.clear()
    _snapshots.clear()
    _prospects.clear()
    _briefs.clear()
    for (const [k, v] of _seedSources()) _sources.set(k, v)
    for (const [k, v] of _seedChanges()) _changes.set(k, v)
    for (const [k, v] of _seedSnaps()) _snapshots.set(k, v)
    for (const [k, v] of _seedProspects()) _prospects.set(k, v)
  },

  /**
   * Clear all data from the store.
   * Intended for use in tests that need a blank slate.
   */
  _clearAll(): void {
    _sources.clear()
    _extractions.clear()
    _changes.clear()
    _snapshots.clear()
    _prospects.clear()
    _briefs.clear()
  },
}
