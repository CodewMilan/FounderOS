import { describe, it, expect, beforeEach } from "vitest"
import { POST } from "@/app/api/ingest/route"
import { sourceService } from "@/lib/services/sourceService"
import { store } from "@/lib/store"

beforeEach(() => {
  store._reset()
})

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/ingest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/ingest", () => {
  it("returns 200 with extraction for a seeded source", async () => {
    // Use a source we know exists from seed data
    const sources = sourceService.list()
    const first = sources[0]

    const res = await POST(makeRequest({ sourceId: first.id }))
    expect(res.status).toBe(200)

    const body = await res.json() as {
      extraction: { sourceId: string; status: string; url: string }
      provider: string
    }
    expect(body.extraction.sourceId).toBe(first.id)
    expect(body.extraction.url).toBe(first.url)
    expect(body.extraction.status).toBe("ok")
    expect(body.provider).toBe("mock")
  })

  it("returns 404 for an unknown sourceId", async () => {
    const res = await POST(makeRequest({ sourceId: "ghost-id-xyz" }))
    expect(res.status).toBe(404)
    const body = await res.json() as { error: string }
    expect(body.error).toContain("ghost-id-xyz")
  })

  it("returns 400 for missing sourceId", async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it("returns 400 for invalid JSON", async () => {
    const req = new Request("http://localhost/api/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{{broken json",
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("extraction has markdown content for pricing URL", async () => {
    const source = sourceService.create({
      type: "url",
      label: "Pricing Test",
      url: "https://somecompany.com/pricing",
      module: "competitors",
    })

    const res = await POST(makeRequest({ sourceId: source.id }))
    expect(res.status).toBe(200)

    const body = await res.json() as {
      extraction: { markdown: string; textPreview: string }
    }
    expect(body.extraction.markdown).toContain("Pricing")
  })

  it("works with a user-created source (not just seed data)", async () => {
    const source = sourceService.create({
      type: "url",
      label: "My New Source",
      url: "https://newco.io/careers",
      module: "competitors",
    })

    const res = await POST(makeRequest({ sourceId: source.id }))
    expect(res.status).toBe(200)

    const body = await res.json() as { extraction: { sourceId: string } }
    expect(body.extraction.sourceId).toBe(source.id)
  })

  it("returns a textPreview with the extraction", async () => {
    const sources = sourceService.list()
    const res = await POST(makeRequest({ sourceId: sources[0].id }))
    const body = await res.json() as { extraction: { textPreview?: string } }
    expect(typeof body.extraction.textPreview).toBe("string")
    expect(body.extraction.textPreview!.length).toBeGreaterThan(0)
  })
})
