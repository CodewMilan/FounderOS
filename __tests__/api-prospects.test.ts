import { describe, it, expect, beforeEach } from "vitest"
import { GET as listProspects } from "@/app/api/prospects/route"
import { POST as analyzeProspect } from "@/app/api/prospects/analyze/route"
import { GET as getBrief, POST as generateBrief } from "@/app/api/prospects/brief/route"
import { store } from "@/lib/store"

beforeEach(() => {
  store._reset()
})

// ─── GET /api/prospects ───────────────────────────────────────────────────────

describe("GET /api/prospects", () => {
  it("returns 200 with a prospects array", async () => {
    const res = await listProspects()
    expect(res.status).toBe(200)
    const data = await res.json() as { prospects: unknown[] }
    expect(Array.isArray(data.prospects)).toBe(true)
  })

  it("returns seeded prospects by default", async () => {
    const res = await listProspects()
    const data = await res.json() as { prospects: { companyName: string }[] }
    expect(data.prospects.length).toBeGreaterThanOrEqual(5)
  })

  it("returns prospects sorted by fitScore descending", async () => {
    const res = await listProspects()
    const data = await res.json() as { prospects: { fitScore: number }[] }
    const scores = data.prospects.map((p) => p.fitScore)
    for (let i = 0; i < scores.length - 1; i++) {
      expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1])
    }
  })
})

// ─── POST /api/prospects/analyze ──────────────────────────────────────────────

describe("POST /api/prospects/analyze", () => {
  it("returns 201 with a prospect record for a known fixture URL", async () => {
    const req = new Request("http://localhost/api/prospects/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://retool.com" }),
    })
    const res = await analyzeProspect(req)
    expect(res.status).toBe(201)
    const data = await res.json() as { prospect: { companyName: string; fitScore: number } }
    expect(data.prospect.companyName).toBe("Retool")
    expect(data.prospect.fitScore).toBeGreaterThanOrEqual(0)
    expect(data.prospect.fitScore).toBeLessThanOrEqual(100)
  })

  it("allows company name override", async () => {
    const req = new Request("http://localhost/api/prospects/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://retool.com", companyName: "Retool Inc." }),
    })
    const res = await analyzeProspect(req)
    const data = await res.json() as { prospect: { companyName: string } }
    expect(data.prospect.companyName).toBe("Retool Inc.")
  })

  it("returns 400 for missing URL", async () => {
    const req = new Request("http://localhost/api/prospects/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    const res = await analyzeProspect(req)
    expect(res.status).toBe(400)
  })

  it("returns 400 for invalid URL", async () => {
    const req = new Request("http://localhost/api/prospects/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "not-a-url" }),
    })
    const res = await analyzeProspect(req)
    expect(res.status).toBe(400)
  })

  it("returns 400 for invalid JSON body", async () => {
    const req = new Request("http://localhost/api/prospects/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    })
    const res = await analyzeProspect(req)
    expect(res.status).toBe(400)
  })

  it("persists the analyzed prospect in the store", async () => {
    const initialCount = store.prospects.list().length
    const req = new Request("http://localhost/api/prospects/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://hex.tech" }),
    })
    await analyzeProspect(req)
    expect(store.prospects.list().length).toBeGreaterThan(initialCount)
  })

  it("returns required ProspectRecord fields", async () => {
    const req = new Request("http://localhost/api/prospects/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://coda.io" }),
    })
    const res = await analyzeProspect(req)
    const data = await res.json() as { prospect: Record<string, unknown> }
    const p = data.prospect
    expect(p.id).toBeTruthy()
    expect(p.companyName).toBeTruthy()
    expect(typeof p.fitScore).toBe("number")
    expect(Array.isArray(p.hiringSignals)).toBe(true)
    expect(Array.isArray(p.maturitySignals)).toBe(true)
    expect(p.recommendedAngle).toBeTruthy()
  })
})

// ─── POST /api/prospects/brief ────────────────────────────────────────────────

describe("POST /api/prospects/brief", () => {
  it("generates and returns a ProspectBrief for a seeded prospect", async () => {
    const prospects = store.prospects.list()
    const firstId = prospects[0].id

    const req = new Request("http://localhost/api/prospects/brief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prospectId: firstId }),
    })
    const res = await generateBrief(req)
    expect(res.status).toBe(201)
    const data = await res.json() as { brief: { prospectId: string; headline: string } }
    expect(data.brief.prospectId).toBe(firstId)
    expect(data.brief.headline.length).toBeGreaterThan(0)
  })

  it("returns 400 for missing prospectId", async () => {
    const req = new Request("http://localhost/api/prospects/brief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    const res = await generateBrief(req)
    expect(res.status).toBe(400)
  })

  it("returns 500 for unknown prospectId", async () => {
    const req = new Request("http://localhost/api/prospects/brief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prospectId: "nonexistent-id" }),
    })
    const res = await generateBrief(req)
    expect(res.status).toBe(500)
  })

  it("returns 400 for invalid JSON body", async () => {
    const req = new Request("http://localhost/api/prospects/brief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    })
    const res = await generateBrief(req)
    expect(res.status).toBe(400)
  })
})

// ─── GET /api/prospects/brief ─────────────────────────────────────────────────

describe("GET /api/prospects/brief", () => {
  it("returns null brief when none has been generated", async () => {
    const req = new Request(
      "http://localhost/api/prospects/brief?prospectId=pr-001",
      { method: "GET" }
    )
    const res = await getBrief(req)
    expect(res.status).toBe(200)
    const data = await res.json() as { brief: unknown }
    expect(data.brief).toBeNull()
  })

  it("returns the brief after it has been generated", async () => {
    const prospects = store.prospects.list()
    const firstId = prospects[0].id

    // Generate first
    const postReq = new Request("http://localhost/api/prospects/brief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prospectId: firstId }),
    })
    await generateBrief(postReq)

    // Then fetch
    const getReq = new Request(
      `http://localhost/api/prospects/brief?prospectId=${firstId}`,
      { method: "GET" }
    )
    const res = await getBrief(getReq)
    const data = await res.json() as { brief: { prospectId: string } | null }
    expect(data.brief).not.toBeNull()
    expect(data.brief!.prospectId).toBe(firstId)
  })

  it("returns 400 when prospectId param is missing", async () => {
    const req = new Request("http://localhost/api/prospects/brief", { method: "GET" })
    const res = await getBrief(req)
    expect(res.status).toBe(400)
  })
})
