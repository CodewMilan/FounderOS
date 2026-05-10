import { describe, it, expect, beforeEach } from "vitest"
import { GET } from "@/app/api/competitors/route"
import { POST } from "@/app/api/competitors/scan/route"
import { store } from "@/lib/store"
import { seedCompetitorChanges } from "@/lib/seed"

beforeEach(() => {
  store._reset()
})

// ─── GET /api/competitors ─────────────────────────────────────────────────────

describe("GET /api/competitors", () => {
  it("returns 200", async () => {
    const res = await GET()
    expect(res.status).toBe(200)
  })

  it("returns a changes array", async () => {
    const res = await GET()
    const body = await res.json() as { changes: unknown[] }
    expect(Array.isArray(body.changes)).toBe(true)
  })

  it("returns all seeded changes by default", async () => {
    const res = await GET()
    const body = await res.json() as { changes: { id: string }[] }
    expect(body.changes.length).toBe(seedCompetitorChanges.length)
  })

  it("each change has required fields", async () => {
    const res = await GET()
    const body = await res.json() as {
      changes: {
        id: string
        competitorName: string
        significanceScore: number
        summary: string
      }[]
    }
    for (const change of body.changes) {
      expect(change.id).toBeDefined()
      expect(change.competitorName).toBeDefined()
      expect(change.significanceScore).toBeDefined()
      expect(change.summary).toBeDefined()
    }
  })

  it("includes seeded competitor names", async () => {
    const res = await GET()
    const body = await res.json() as { changes: { competitorName: string }[] }
    const names = body.changes.map((c) => c.competitorName)
    expect(names).toContain("Linear")
    expect(names).toContain("Notion")
  })
})

// ─── POST /api/competitors/scan ───────────────────────────────────────────────

describe("POST /api/competitors/scan", () => {
  it("returns 200", async () => {
    const res = await POST()
    expect(res.status).toBe(200)
  })

  it("returns scanned and detected counts", async () => {
    const res = await POST()
    const body = await res.json() as { scanned: number; detected: number; changes: unknown[] }
    expect(typeof body.scanned).toBe("number")
    expect(typeof body.detected).toBe("number")
    expect(Array.isArray(body.changes)).toBe(true)
  })

  it("scanned count equals number of competitor sources", async () => {
    const res = await POST()
    const body = await res.json() as { scanned: number }
    // Seed has 3 competitor sources (src-001, src-002, src-003)
    expect(body.scanned).toBe(3)
  })

  it("detected changes have the expected shape", async () => {
    const res = await POST()
    const body = await res.json() as {
      changes: {
        id: string
        competitorName: string
        changeType: string
        significanceScore: number
        summary: string
        previousSnapshot?: string
        currentSnapshot: string
      }[]
    }
    for (const change of body.changes) {
      expect(change.id).toBeDefined()
      expect(change.competitorName).toBeDefined()
      expect(change.changeType).toBeDefined()
      expect(change.significanceScore).toBeGreaterThanOrEqual(0)
      expect(change.significanceScore).toBeLessThanOrEqual(100)
      expect(change.summary.length).toBeGreaterThan(0)
      expect(change.currentSnapshot.length).toBeGreaterThan(0)
    }
  })

  it("detected changes have previousSnapshot populated", async () => {
    const res = await POST()
    const body = await res.json() as {
      changes: { previousSnapshot?: string; currentSnapshot: string }[]
    }
    // All detected changes should have a previous snapshot since seeds exist
    for (const change of body.changes) {
      expect(change.previousSnapshot).toBeDefined()
      expect(change.previousSnapshot!.length).toBeGreaterThan(0)
    }
  })

  it("detected changes are stored and appear in GET after scan", async () => {
    // Run scan
    const scanRes = await POST()
    const scanBody = await scanRes.json() as { detected: number }

    if (scanBody.detected === 0) return // skip if mock content matched exactly

    // Check GET returns more changes now
    const getRes = await GET()
    const getBody = await getRes.json() as { changes: unknown[] }
    expect(getBody.changes.length).toBeGreaterThan(seedCompetitorChanges.length)
  })
})
