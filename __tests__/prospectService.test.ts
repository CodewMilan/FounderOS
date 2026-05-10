/**
 * Unit tests for the prospect service layer, store.briefs, and ingestionService.ingestUrl.
 *
 * Covers:
 *   - prospectService: listProspects, getProspect, analyzeCompany, refreshProspect,
 *                      generateBrief, getBrief, listBriefs
 *   - store.briefs: set, list, byProspectId, _reset/_clearAll isolation
 *   - ingestionService.ingestUrl: direct ad-hoc URL ingestion (no stored source)
 *   - Mock-mode fallback: fixture URL → no external call; unknown URL → mock provider
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest"
import { prospectService } from "@/lib/services/prospectService"
import { ingestionService } from "@/lib/services/ingestionService"
import { store } from "@/lib/store"
import { seedProspects } from "@/lib/seed"
import { RawExtractionSchema, ProspectBriefSchema, ProspectRecordSchema } from "@/lib/schemas"

beforeEach(() => {
  store._reset()
  vi.restoreAllMocks()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

// ─── prospectService.listProspects ────────────────────────────────────────────

describe("prospectService.listProspects", () => {
  it("returns all seeded prospects", () => {
    expect(prospectService.listProspects().length).toBeGreaterThanOrEqual(5)
  })

  it("returns prospects sorted by fitScore descending", () => {
    const prospects = prospectService.listProspects()
    for (let i = 0; i < prospects.length - 1; i++) {
      expect(prospects[i].fitScore).toBeGreaterThanOrEqual(prospects[i + 1].fitScore)
    }
  })

  it("all returned records are valid ProspectRecords", () => {
    for (const p of prospectService.listProspects()) {
      expect(() => ProspectRecordSchema.parse(p)).not.toThrow()
    }
  })

  it("reflects changes after a new prospect is added to the store", async () => {
    const before = prospectService.listProspects().length
    await prospectService.analyzeCompany({ url: "https://retool.com" })
    expect(prospectService.listProspects().length).toBeGreaterThan(before)
  })
})

// ─── prospectService.getProspect ──────────────────────────────────────────────

describe("prospectService.getProspect", () => {
  it("returns the seeded prospect by id", () => {
    const seed = seedProspects[0]
    const found = prospectService.getProspect(seed.id)
    expect(found).toBeDefined()
    expect(found?.companyName).toBe(seed.companyName)
  })

  it("returns undefined for an unknown id", () => {
    expect(prospectService.getProspect("nonexistent-id")).toBeUndefined()
  })

  it("returns undefined after store is cleared", () => {
    store._clearAll()
    expect(prospectService.getProspect(seedProspects[0].id)).toBeUndefined()
  })
})

// ─── prospectService.analyzeCompany ──────────────────────────────────────────

describe("prospectService.analyzeCompany — fixture URL (mock mode)", () => {
  it("returns a ProspectRecord for a known fixture URL", async () => {
    const prospect = await prospectService.analyzeCompany({ url: "https://retool.com" })
    expect(prospect.companyName).toBe("Retool")
  })

  it("fit score is within 0–100 range", async () => {
    const prospect = await prospectService.analyzeCompany({ url: "https://retool.com" })
    expect(prospect.fitScore).toBeGreaterThanOrEqual(0)
    expect(prospect.fitScore).toBeLessThanOrEqual(100)
  })

  it("fit score is an integer", async () => {
    const prospect = await prospectService.analyzeCompany({ url: "https://retool.com" })
    expect(Number.isInteger(prospect.fitScore)).toBe(true)
  })

  it("companyName override is applied in fixture mode", async () => {
    const prospect = await prospectService.analyzeCompany({
      url: "https://retool.com",
      companyName: "RetoolPro",
    })
    expect(prospect.companyName).toBe("RetoolPro")
  })

  it("returns maturitySignals as a string array", async () => {
    const prospect = await prospectService.analyzeCompany({ url: "https://retool.com" })
    expect(Array.isArray(prospect.maturitySignals)).toBe(true)
    expect(prospect.maturitySignals.every((s) => typeof s === "string")).toBe(true)
  })

  it("returns hiringSignals as a string array", async () => {
    const prospect = await prospectService.analyzeCompany({ url: "https://retool.com" })
    expect(Array.isArray(prospect.hiringSignals)).toBe(true)
  })

  it("recommendedAngle is a non-empty string", async () => {
    const prospect = await prospectService.analyzeCompany({ url: "https://retool.com" })
    expect(typeof prospect.recommendedAngle).toBe("string")
    expect(prospect.recommendedAngle.length).toBeGreaterThan(10)
  })

  it("analyzedAt is a valid ISO datetime string", async () => {
    const prospect = await prospectService.analyzeCompany({ url: "https://retool.com" })
    expect(() => new Date(prospect.analyzedAt)).not.toThrow()
    expect(new Date(prospect.analyzedAt).getTime()).toBeGreaterThan(0)
  })

  it("persists the prospect to the store", async () => {
    const before = store.prospects.list().length
    await prospectService.analyzeCompany({ url: "https://retool.com" })
    expect(store.prospects.list().length).toBeGreaterThan(before)
  })

  it("result validates against ProspectRecordSchema", async () => {
    const prospect = await prospectService.analyzeCompany({ url: "https://coda.io" })
    expect(() => ProspectRecordSchema.parse(prospect)).not.toThrow()
  })

  it("works for all five fixture URLs", async () => {
    const fixtures = [
      "https://retool.com",
      "https://coda.io",
      "https://hex.tech",
      "https://www.raycast.com",
      "https://linear.app",
    ]
    for (const url of fixtures) {
      const prospect = await prospectService.analyzeCompany({ url })
      expect(prospect.fitScore).toBeGreaterThanOrEqual(0)
    }
  })
})

describe("prospectService.analyzeCompany — unknown URL (mock provider fallback)", () => {
  it("succeeds for a URL not in fixtures", async () => {
    const prospect = await prospectService.analyzeCompany({
      url: "https://some-random-startup-xyz123.io",
    })
    expect(prospect.companyName).toBeTruthy()
    expect(typeof prospect.fitScore).toBe("number")
  })

  it("uses company name override for unknown URL", async () => {
    const prospect = await prospectService.analyzeCompany({
      url: "https://some-random-startup-xyz123.io",
      companyName: "Startup XYZ",
    })
    expect(prospect.companyName).toBe("Startup XYZ")
  })

  it("result validates against ProspectRecordSchema for unknown URL", async () => {
    const prospect = await prospectService.analyzeCompany({
      url: "https://another-unknown-co.io",
    })
    expect(() => ProspectRecordSchema.parse(prospect)).not.toThrow()
  })
})

describe("prospectService.analyzeCompany — validation", () => {
  it("throws for an invalid URL", async () => {
    await expect(
      prospectService.analyzeCompany({ url: "not-a-url" })
    ).rejects.toThrow()
  })

  it("throws for a missing URL field", async () => {
    await expect(
      prospectService.analyzeCompany({} as { url: string })
    ).rejects.toThrow()
  })
})

// ─── prospectService.refreshProspect ─────────────────────────────────────────

describe("prospectService.refreshProspect", () => {
  it("re-analyzes a seeded prospect and returns a new record", async () => {
    const id = seedProspects[0].id
    const refreshed = await prospectService.refreshProspect(id)
    expect(refreshed.companyName).toBeTruthy()
    expect(typeof refreshed.fitScore).toBe("number")
  })

  it("persists the refreshed prospect to the store", async () => {
    const id = seedProspects[0].id
    const before = store.prospects.list().length
    await prospectService.refreshProspect(id)
    expect(store.prospects.list().length).toBeGreaterThan(before)
  })

  it("throws for an unknown prospect id", async () => {
    await expect(
      prospectService.refreshProspect("nonexistent-id")
    ).rejects.toThrow("Prospect nonexistent-id not found")
  })
})

// ─── prospectService.generateBrief ───────────────────────────────────────────

describe("prospectService.generateBrief", () => {
  it("returns a ProspectBrief for a seeded prospect", () => {
    const id = seedProspects[0].id
    const brief = prospectService.generateBrief(id)
    expect(brief.prospectId).toBe(id)
    expect(brief.companyName).toBeTruthy()
    expect(brief.headline.length).toBeGreaterThan(0)
    expect(brief.openingLine.length).toBeGreaterThan(20)
    expect(brief.keyPoints.length).toBeGreaterThanOrEqual(2)
    expect(brief.callToAction.length).toBeGreaterThan(10)
  })

  it("result validates against ProspectBriefSchema", () => {
    const brief = prospectService.generateBrief(seedProspects[0].id)
    expect(() => ProspectBriefSchema.parse(brief)).not.toThrow()
  })

  it("persists the brief to the store immediately", () => {
    const id = seedProspects[0].id
    expect(store.briefs.byProspectId(id)).toBeUndefined()
    prospectService.generateBrief(id)
    expect(store.briefs.byProspectId(id)).toBeDefined()
  })

  it("generates valid briefs for all seeded prospects", () => {
    for (const prospect of seedProspects) {
      const brief = prospectService.generateBrief(prospect.id)
      expect(() => ProspectBriefSchema.parse(brief)).not.toThrow()
    }
  })

  it("throws for an unknown prospect id", () => {
    expect(() => prospectService.generateBrief("nonexistent-id")).toThrow(
      "Prospect nonexistent-id not found"
    )
  })

  it("each call returns a brief with a unique id", () => {
    const id = seedProspects[0].id
    const a = prospectService.generateBrief(id)
    const b = prospectService.generateBrief(id)
    expect(a.id).not.toBe(b.id)
  })

  it("brief headline includes the fit score", () => {
    const seed = seedProspects[0]
    const brief = prospectService.generateBrief(seed.id)
    expect(brief.headline).toContain(String(seed.fitScore))
  })

  it("uses fixture extraction for richer brief when fixture URL matches", () => {
    // Retool (pr-001) website matches a fixture URL
    const retoolProspect = seedProspects.find((p) => p.companyName === "Retool")!
    const brief = prospectService.generateBrief(retoolProspect.id)
    // Brief should be enriched with fixture data — at least 3 key points
    expect(brief.keyPoints.length).toBeGreaterThanOrEqual(3)
  })
})

// ─── prospectService.getBrief ─────────────────────────────────────────────────

describe("prospectService.getBrief", () => {
  it("returns undefined before any brief is generated", () => {
    expect(prospectService.getBrief(seedProspects[0].id)).toBeUndefined()
  })

  it("returns the generated brief after generateBrief is called", () => {
    const id = seedProspects[0].id
    prospectService.generateBrief(id)
    const brief = prospectService.getBrief(id)
    expect(brief).toBeDefined()
    expect(brief?.prospectId).toBe(id)
  })

  it("returns undefined for a prospect that never had a brief", () => {
    expect(prospectService.getBrief("pr-002")).toBeUndefined()
  })

  it("returns the MOST RECENT brief when called multiple times", () => {
    const id = seedProspects[0].id
    prospectService.generateBrief(id)
    const second = prospectService.generateBrief(id)
    const fetched = prospectService.getBrief(id)
    expect(fetched?.id).toBe(second.id)
  })
})

// ─── prospectService.listBriefs ───────────────────────────────────────────────

describe("prospectService.listBriefs", () => {
  it("returns empty list initially (no briefs generated)", () => {
    expect(prospectService.listBriefs()).toHaveLength(0)
  })

  it("returns all generated briefs", () => {
    prospectService.generateBrief(seedProspects[0].id)
    prospectService.generateBrief(seedProspects[1].id)
    expect(prospectService.listBriefs().length).toBeGreaterThanOrEqual(2)
  })

  it("accumulates briefs across multiple calls for the same prospect", () => {
    const id = seedProspects[0].id
    prospectService.generateBrief(id)
    prospectService.generateBrief(id)
    expect(prospectService.listBriefs().length).toBe(2)
  })
})

// ─── store.briefs namespace ───────────────────────────────────────────────────

describe("store.briefs", () => {
  it("set and list work correctly", () => {
    const brief = prospectService.generateBrief(seedProspects[0].id)
    const listed = store.briefs.list()
    expect(listed.some((b) => b.id === brief.id)).toBe(true)
  })

  it("get returns the brief by id", () => {
    const brief = prospectService.generateBrief(seedProspects[0].id)
    const fetched = store.briefs.get(brief.id)
    expect(fetched).toBeDefined()
    expect(fetched?.id).toBe(brief.id)
  })

  it("get returns undefined for unknown id", () => {
    expect(store.briefs.get("nonexistent-brief")).toBeUndefined()
  })

  it("byProspectId returns the most recently generated brief", () => {
    const id = seedProspects[0].id
    const first = prospectService.generateBrief(id)
    const laterGeneratedAt = new Date(Date.now() + 5000).toISOString()
    const second = { ...first, id: "brief-later", generatedAt: laterGeneratedAt }
    store.briefs.set(second)
    const latest = store.briefs.byProspectId(id)
    expect(latest?.id).toBe("brief-later")
  })

  it("byProspectId returns undefined when no brief exists for that prospect", () => {
    expect(store.briefs.byProspectId("pr-003")).toBeUndefined()
  })

  it("_reset clears all briefs and leaves the store empty", () => {
    prospectService.generateBrief(seedProspects[0].id)
    prospectService.generateBrief(seedProspects[1].id)
    store._reset()
    expect(store.briefs.list()).toHaveLength(0)
  })

  it("_clearAll clears briefs", () => {
    prospectService.generateBrief(seedProspects[0].id)
    store._clearAll()
    expect(store.briefs.list()).toHaveLength(0)
  })

  it("_reset re-seeds prospects but not briefs", () => {
    store._reset()
    expect(store.prospects.list().length).toBeGreaterThanOrEqual(5)
    expect(store.briefs.list()).toHaveLength(0)
  })
})

// ─── store.prospects namespace ────────────────────────────────────────────────

describe("store.prospects", () => {
  it("list returns all seeded prospects", () => {
    expect(store.prospects.list().length).toBeGreaterThanOrEqual(5)
  })

  it("get returns undefined for unknown id", () => {
    expect(store.prospects.get("unknown")).toBeUndefined()
  })

  it("set persists a new prospect", async () => {
    const newProspect = await prospectService.analyzeCompany({ url: "https://retool.com" })
    const fetched = store.prospects.get(newProspect.id)
    expect(fetched?.id).toBe(newProspect.id)
  })

  it("delete removes a prospect by id", () => {
    const id = seedProspects[0].id
    expect(store.prospects.get(id)).toBeDefined()
    store.prospects.delete(id)
    expect(store.prospects.get(id)).toBeUndefined()
  })

  it("_reset restores seeded prospects after clearAll", () => {
    store._clearAll()
    expect(store.prospects.list()).toHaveLength(0)
    store._reset()
    expect(store.prospects.list().length).toBeGreaterThanOrEqual(5)
  })
})

// ─── ingestionService.ingestUrl ───────────────────────────────────────────────

describe("ingestionService.ingestUrl", () => {
  it("returns a RawExtraction for any URL", async () => {
    const result = await ingestionService.ingestUrl("https://example.com")
    expect(result.url).toBe("https://example.com")
    expect(result.status).toBe("ok")
  })

  it("result validates against RawExtractionSchema", async () => {
    const result = await ingestionService.ingestUrl("https://example.com")
    expect(() => RawExtractionSchema.parse(result)).not.toThrow()
  })

  it("sourceId is empty string (ad-hoc URL, no tracked source)", async () => {
    const result = await ingestionService.ingestUrl("https://example.com")
    expect(result.sourceId).toBe("")
  })

  it("contentType is markdown in mock mode", async () => {
    const result = await ingestionService.ingestUrl("https://example.com")
    expect(result.contentType).toBe("markdown")
  })

  it("markdown is populated for mock provider", async () => {
    const result = await ingestionService.ingestUrl("https://example.com")
    expect(result.markdown).toBeTruthy()
    expect((result.markdown ?? "").length).toBeGreaterThan(0)
  })

  it("uses mock provider by default (SCRAPE_PROVIDER unset)", async () => {
    vi.stubEnv("SCRAPE_PROVIDER", "")
    const result = await ingestionService.ingestUrl("https://example.com")
    expect(result.status).toBe("ok")
  })

  it("uses mock provider when SCRAPE_PROVIDER=mock", async () => {
    vi.stubEnv("SCRAPE_PROVIDER", "mock")
    const result = await ingestionService.ingestUrl("https://example.com")
    expect(result.status).toBe("ok")
  })

  it("uses real provider when override=real (fetch mocked)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "# Company\n\nContent.",
    }))
    const result = await ingestionService.ingestUrl("https://example.com", "real")
    expect(result.markdown).toContain("Company")
  })

  it("returns pricing content for /pricing URL in mock mode", async () => {
    const result = await ingestionService.ingestUrl("https://example.com/pricing")
    expect(result.markdown).toContain("Pricing")
  })

  it("returns careers content for /careers URL in mock mode", async () => {
    const result = await ingestionService.ingestUrl("https://example.com/careers")
    expect(result.markdown).toContain("Open Roles")
  })

  it("returns generic content for an unknown URL in mock mode", async () => {
    const result = await ingestionService.ingestUrl("https://totally-unknown-company-xyz.io")
    expect(result.markdown).toBeTruthy()
    expect(result.status).toBe("ok")
  })

  it("result has a non-empty id", async () => {
    const result = await ingestionService.ingestUrl("https://example.com")
    expect(result.id).toBeTruthy()
  })

  it("result has a valid fetchedAt timestamp", async () => {
    const result = await ingestionService.ingestUrl("https://example.com")
    expect(new Date(result.fetchedAt).getTime()).toBeGreaterThan(0)
  })

  it("does NOT persist the extraction to the store (ad-hoc)", async () => {
    const before = store.extractions.list().length
    await ingestionService.ingestUrl("https://example.com")
    // ingestUrl does not call store.extractions.set — it returns the extraction directly
    expect(store.extractions.list().length).toBe(before)
  })
})
