import { describe, it, expect, beforeEach } from "vitest"
import { GET, POST } from "@/app/api/sources/route"
import { store } from "@/lib/store"

beforeEach(() => {
  store._reset()
})

describe("GET /api/sources", () => {
  it("returns 200 with a sources array", async () => {
    const req = new Request("http://localhost/api/sources")
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json() as { sources: unknown[] }
    expect(Array.isArray(body.sources)).toBe(true)
  })

  it("returns seeded sources", async () => {
    const res = await GET()
    const body = await res.json() as { sources: { id: string }[] }
    expect(body.sources.length).toBeGreaterThan(0)
  })

  it("each source has an id, label, and url", async () => {
    const res = await GET()
    const body = await res.json() as { sources: { id?: string; label?: string; url?: string }[] }
    for (const source of body.sources) {
      expect(source.id).toBeDefined()
      expect(source.label).toBeDefined()
      expect(source.url).toBeDefined()
    }
  })
})

describe("POST /api/sources", () => {
  const validBody = {
    type: "url",
    label: "Test Source",
    url: "https://test.example.com/pricing",
    module: "competitors",
    tags: ["test"],
  }

  it("returns 201 with the created source", async () => {
    const req = new Request("http://localhost/api/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validBody),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json() as { source: { id: string; label: string } }
    expect(body.source.id).toMatch(/^src-/)
    expect(body.source.label).toBe(validBody.label)
  })

  it("new source is visible in subsequent GET", async () => {
    const req = new Request("http://localhost/api/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validBody),
    })
    await POST(req)

    const listRes = await GET()
    const listBody = await listRes.json() as { sources: { label: string }[] }
    const found = listBody.sources.find((s) => s.label === validBody.label)
    expect(found).toBeDefined()
  })

  it("returns 400 for an invalid URL", async () => {
    const req = new Request("http://localhost/api/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validBody, url: "not-a-url" }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("returns 400 for missing label", async () => {
    const req = new Request("http://localhost/api/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validBody, label: "" }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("returns 400 for unknown module", async () => {
    const req = new Request("http://localhost/api/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validBody, module: "unknown" }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("returns 400 for invalid JSON body", async () => {
    const req = new Request("http://localhost/api/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json {{",
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("returns 400 for missing required fields", async () => {
    const req = new Request("http://localhost/api/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: "Only a label" }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("tags default to empty array when not provided", async () => {
    const { tags, ...rest } = validBody
    const req = new Request("http://localhost/api/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rest),
    })
    const res = await POST(req)
    const body = await res.json() as { source: { tags: string[] } }
    expect(body.source.tags).toEqual([])
  })
})
