import { describe, it, expect, beforeEach, vi } from "vitest"
import { ingestionService } from "@/lib/services/ingestionService"
import { sourceService } from "@/lib/services/sourceService"
import { store } from "@/lib/store"

beforeEach(() => {
  store._reset()
})

describe("ingestionService.ingest", () => {
  it("returns null for an unknown sourceId", async () => {
    const result = await ingestionService.ingest("ghost-id")
    expect(result).toBeNull()
  })

  it("returns an IngestResult for a known source", async () => {
    const source = sourceService.create({
      type: "url",
      label: "Mock Pricing",
      url: "https://testco.com/pricing",
      module: "competitors",
    })

    const result = await ingestionService.ingest(source.id, "mock")

    expect(result).not.toBeNull()
    expect(result?.provider).toBe("mock")
    expect(result?.cached).toBe(false)
    expect(result?.extraction.sourceId).toBe(source.id)
    expect(result?.extraction.url).toBe(source.url)
    expect(result?.extraction.status).toBe("ok")
  })

  it("extraction has markdown content", async () => {
    const source = sourceService.create({
      type: "url",
      label: "Changelog",
      url: "https://example.com/changelog",
      module: "competitors",
    })

    const result = await ingestionService.ingest(source.id, "mock")

    expect(result?.extraction.markdown).toBeTruthy()
    expect(typeof result?.extraction.markdown).toBe("string")
  })

  it("persists the extraction to the store", async () => {
    const source = sourceService.create({
      type: "url",
      label: "Hiring Page",
      url: "https://example.com/careers",
      module: "competitors",
    })

    const result = await ingestionService.ingest(source.id, "mock")
    expect(result).not.toBeNull()

    const stored = ingestionService.getLatestExtraction(source.id)
    expect(stored).toBeDefined()
    expect(stored?.id).toBe(result?.extraction.id)
  })

  it("uses mock provider by default (no env var)", async () => {
    // Ensure SCRAPE_PROVIDER is not set to 'real'
    const original = process.env.SCRAPE_PROVIDER
    delete process.env.SCRAPE_PROVIDER

    const source = sourceService.create({
      type: "url",
      label: "Default Provider Test",
      url: "https://defaulttest.com",
      module: "prospects",
    })

    const result = await ingestionService.ingest(source.id)
    expect(result?.provider).toBe("mock")

    process.env.SCRAPE_PROVIDER = original
  })

  it("extraction content type matches mock fixture", async () => {
    const source = sourceService.create({
      type: "url",
      label: "Product Page",
      url: "https://someproduct.com/product",
      module: "prospects",
    })

    const result = await ingestionService.ingest(source.id, "mock")
    expect(result?.extraction.contentType).toBe("markdown")
  })
})

describe("ingestionService.getLatestExtraction", () => {
  it("returns undefined for a source that has not been ingested", () => {
    const source = sourceService.create({
      type: "url",
      label: "Not ingested",
      url: "https://notingested.com",
      module: "funding",
    })
    expect(ingestionService.getLatestExtraction(source.id)).toBeUndefined()
  })

  it("returns the extraction after ingestion", async () => {
    const source = sourceService.create({
      type: "url",
      label: "To ingest",
      url: "https://toingest.com",
      module: "funding",
    })
    await ingestionService.ingest(source.id, "mock")
    expect(ingestionService.getLatestExtraction(source.id)).toBeDefined()
  })
})

describe("ingestionService.listExtractions", () => {
  it("returns empty array before any ingestion (fresh store)", () => {
    store._clearAll()
    expect(ingestionService.listExtractions()).toHaveLength(0)
  })

  it("returns all extractions after multiple ingestions", async () => {
    store._clearAll()
    const a = sourceService.create({
      type: "url",
      label: "A",
      url: "https://a.com",
      module: "competitors",
    })
    const b = sourceService.create({
      type: "url",
      label: "B",
      url: "https://b.com",
      module: "prospects",
    })

    await ingestionService.ingest(a.id, "mock")
    await ingestionService.ingest(b.id, "mock")

    expect(ingestionService.listExtractions()).toHaveLength(2)
  })
})

describe("Mock provider fixtures", () => {
  async function ingestUrl(url: string) {
    const source = sourceService.create({
      type: "url",
      label: "Test",
      url,
      module: "competitors",
    })
    return ingestionService.ingest(source.id, "mock")
  }

  it("pricing URL returns pricing fixture", async () => {
    const result = await ingestUrl("https://example.com/pricing")
    expect(result?.extraction.markdown).toContain("Pricing")
  })

  it("changelog URL returns changelog fixture", async () => {
    const result = await ingestUrl("https://example.com/changelog")
    expect(result?.extraction.markdown).toContain("What")
  })

  it("careers URL returns hiring fixture", async () => {
    const result = await ingestUrl("https://example.com/careers")
    expect(result?.extraction.markdown).toContain("Open Roles")
  })

  it("generic URL returns a non-empty fixture", async () => {
    const result = await ingestUrl("https://randomunknown.io/")
    expect(result?.extraction.markdown?.length).toBeGreaterThan(0)
  })
})
