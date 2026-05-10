import { store } from "@/lib/store"
import { SourceSchema, CreateSourceSchema } from "@/lib/schemas"
import type { Source, CreateSourceInput } from "@/lib/schemas"

// ─── Source service ───────────────────────────────────────────────────────────

export const sourceService = {
  /**
   * Return all sources in the store (seed + user-created).
   */
  list(): Source[] {
    return store.sources.list()
  },

  /**
   * Return a single source by id, or undefined if not found.
   */
  get(id: string): Source | undefined {
    return store.sources.get(id)
  },

  /**
   * Validate and persist a new source.
   * Throws a ZodError on invalid input.
   */
  create(input: CreateSourceInput): Source {
    // Validate the incoming payload at the service boundary.
    const validated = CreateSourceSchema.parse(input)

    const now = new Date().toISOString()
    const source: Source = {
      ...validated,
      id: `src-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    }

    // Validate the full Source shape before storing.
    SourceSchema.parse(source)
    store.sources.set(source)

    return source
  },

  /**
   * Update mutable fields on an existing source.
   * Returns the updated source, or undefined if id not found.
   */
  update(
    id: string,
    patch: Partial<Pick<Source, "label" | "tags" | "updatedAt">>
  ): Source | undefined {
    const existing = store.sources.get(id)
    if (!existing) return undefined

    const updated: Source = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    }
    SourceSchema.parse(updated)
    store.sources.set(updated)
    return updated
  },

  /**
   * Remove a source from the store.
   * Returns true if it existed and was deleted.
   */
  delete(id: string): boolean {
    return store.sources.delete(id)
  },
}
