/**
 * Tests for the Competitor Intelligence feature.
 *
 * Covers:
 *   - EnrichedCompetitorSchema validation
 *   - CompetitorIntelState schema validation
 *   - competitorIntelService fetchForProfile uses mock data
 *   - competitorIntelService enrichCompetitor + addManually + removeCompetitor
 *   - Competitors page renders with tabs
 *   - All 5 chart sections render without crashing
 *   - QuickActionBar renders and triggers correct routes
 *   - Workflow trigger buttons call correct API routes
 *   - Add competitor drawer opens
 *   - No live API calls — fetch is mocked throughout
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { EnrichedCompetitorSchema, CompetitorIntelStateSchema } from "@/lib/schemas/competitor-intel"
import { competitorIntelService } from "@/lib/services/competitorIntelService"
import { profileService } from "@/lib/services/profileService"
import { store } from "@/lib/store"
import {
  mockEnrichedCompetitors,
  mockCompetitorIntelState,
} from "@/lib/mocks/competitor-intel-mocks"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/app/competitors",
}))

// Block all real fetch calls
const mockFetch = vi.fn()
vi.stubGlobal("fetch", mockFetch)

// Mock recharts to avoid SVG dimension issues in jsdom
vi.mock("recharts", () => {
  const React = require("react")
  const MockChart = ({ children }: { children?: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "mock-chart" }, children)
  return {
    RadarChart: MockChart,
    Radar: () => null,
    PolarGrid: () => null,
    PolarAngleAxis: () => null,
    PolarRadiusAxis: () => null,
    BarChart: MockChart,
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Cell: () => null,
    LabelList: () => null,
    ScatterChart: MockChart,
    Scatter: () => null,
    ReferenceLine: () => null,
    ResponsiveContainer: ({ children }: { children?: React.ReactNode }) =>
      React.createElement("div", { "data-testid": "recharts-responsive" }, children),
    Tooltip: () => null,
    Legend: () => null,
  }
})

const validSaveInput = {
  companyName: "FounderOS",
  websiteUrl: "https://founderos.com",
  description: "Founder intelligence platform",
  industry: "SaaS" as const,
  targetGeographies: ["India", "Global"] as const,
  targetCustomer: "B2B" as const,
  stage: "MVP" as const,
  pricingModel: "Subscription" as const,
}

// ─── Schema validation ────────────────────────────────────────────────────────

describe("EnrichedCompetitorSchema", () => {
  it("validates mock competitor data", () => {
    for (const comp of mockEnrichedCompetitors) {
      const result = EnrichedCompetitorSchema.safeParse(comp)
      expect(result.success, `Failed for ${comp.companyName}: ${JSON.stringify(result)}`).toBe(true)
    }
  })

  it("rejects missing companyName", () => {
    const result = EnrichedCompetitorSchema.safeParse({
      id: "x",
      websiteUrl: "https://example.com",
      description: "test",
      marketPosition: "niche",
      whyCompetitor: "test",
      isManuallyAdded: false,
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid marketPosition", () => {
    const result = EnrichedCompetitorSchema.safeParse({
      ...mockEnrichedCompetitors[0],
      marketPosition: "unicorn",
    })
    expect(result.success).toBe(false)
  })
})

describe("CompetitorIntelStateSchema", () => {
  it("validates mock intel state", () => {
    const result = CompetitorIntelStateSchema.safeParse(mockCompetitorIntelState)
    expect(result.success).toBe(true)
  })

  it("accepts state with no lastFetchedAt", () => {
    const result = CompetitorIntelStateSchema.safeParse({
      competitors: [],
      yourFeatures: [],
      yourHasFreeTier: false,
    })
    expect(result.success).toBe(true)
  })
})

// ─── competitorIntelService ───────────────────────────────────────────────────

describe("competitorIntelService", () => {
  beforeEach(() => {
    store._reset()
    // Force mock mode (no OPENAI key in tests)
    vi.stubEnv("OPENAI_API_KEY", "")
    vi.stubEnv("SCRAPE_PROVIDER", "mock")
  })

  it("returns null when no intel state is stored", () => {
    expect(competitorIntelService.getState()).toBeNull()
  })

  it("fetchForProfile returns a state with competitors", async () => {
    profileService.save(validSaveInput)
    const profile = profileService.get()!
    const state = await competitorIntelService.fetchForProfile(profile)
    expect(state.competitors.length).toBeGreaterThan(0)
    expect(state.lastFetchedAt).toBeDefined()
  })

  it("fetchForProfile stores state in store", async () => {
    profileService.save(validSaveInput)
    const profile = profileService.get()!
    await competitorIntelService.fetchForProfile(profile)
    expect(store.competitorIntel.get()).not.toBeNull()
  })

  it("addManually adds a competitor placeholder", () => {
    store.competitorIntel.set(mockCompetitorIntelState)
    const before = store.competitorIntel.get()!.competitors.length
    competitorIntelService.addManually({
      websiteUrl: "https://example-comp.com",
      companyName: "ExampleComp",
    })
    const after = store.competitorIntel.get()!.competitors.length
    expect(after).toBe(before + 1)
  })

  it("removeCompetitor removes the correct entry", () => {
    store.competitorIntel.set(mockCompetitorIntelState)
    const idToRemove = mockCompetitorIntelState.competitors[0]!.id
    competitorIntelService.removeCompetitor(idToRemove)
    const remaining = store.competitorIntel.get()!.competitors
    expect(remaining.find((c) => c.id === idToRemove)).toBeUndefined()
  })

  it("enrichCompetitor returns null when state is empty", async () => {
    const result = await competitorIntelService.enrichCompetitor("nonexistent", "https://x.com")
    expect(result).toBeNull()
  })

  it("enrichCompetitor updates enrichedAt timestamp", async () => {
    store.competitorIntel.set(mockCompetitorIntelState)
    const id = mockCompetitorIntelState.competitors[0]!.id
    const before = new Date().toISOString()
    const result = await competitorIntelService.enrichCompetitor(
      id,
      mockCompetitorIntelState.competitors[0]!.websiteUrl
    )
    expect(result).not.toBeNull()
    expect(result!.enrichedAt! >= before).toBe(true)
  })
})

// ─── POST /api/competitors/fetch ─────────────────────────────────────────────

describe("POST /api/competitors/fetch", () => {
  beforeEach(() => {
    store._reset()
    vi.stubEnv("OPENAI_API_KEY", "")
    vi.stubEnv("SCRAPE_PROVIDER", "mock")
  })

  it("returns 400 when no profile is set", async () => {
    const { POST } = await import("@/app/api/competitors/fetch/route")
    const req = new Request("http://localhost/api/competitors/fetch", {
      method: "POST",
      body: "{}",
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("returns 200 with state when profile exists", async () => {
    profileService.save(validSaveInput)
    const { POST } = await import("@/app/api/competitors/fetch/route")
    const req = new Request("http://localhost/api/competitors/fetch", {
      method: "POST",
      body: "{}",
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json() as { state: { competitors: unknown[] } }
    expect(json.state.competitors.length).toBeGreaterThan(0)
  })
})

// ─── POST /api/competitors/enrich ────────────────────────────────────────────

describe("POST /api/competitors/enrich", () => {
  beforeEach(() => {
    store._reset()
    store.competitorIntel.set(mockCompetitorIntelState)
    vi.stubEnv("OPENAI_API_KEY", "")
  })

  function makeRequest(body: unknown) {
    return new Request("http://localhost/api/competitors/enrich", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  }

  it("returns 400 for invalid payload", async () => {
    const { POST } = await import("@/app/api/competitors/enrich/route")
    const res = await POST(makeRequest({ competitorId: "" }))
    expect(res.status).toBe(400)
  })

  it("returns 200 for valid competitor", async () => {
    const { POST } = await import("@/app/api/competitors/enrich/route")
    const id = mockCompetitorIntelState.competitors[0]!.id
    const url = mockCompetitorIntelState.competitors[0]!.websiteUrl
    const res = await POST(makeRequest({ competitorId: id, websiteUrl: url }))
    expect(res.status).toBe(200)
    const json = await res.json() as { competitor: { id: string } }
    expect(json.competitor.id).toBe(id)
  })

  it("returns 404 for unknown competitor", async () => {
    const { POST } = await import("@/app/api/competitors/enrich/route")
    const res = await POST(
      makeRequest({ competitorId: "nonexistent", websiteUrl: "https://x.com" })
    )
    expect(res.status).toBe(404)
  })
})

// ─── CompetitorIntelligencePanel ─────────────────────────────────────────────

describe("CompetitorIntelligencePanel", () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ state: mockCompetitorIntelState }),
    })
  })

  async function renderPanel() {
    const { CompetitorIntelligencePanel } = await import(
      "@/components/app/competitor-intel/competitor-intelligence-panel"
    )
    return render(
      <CompetitorIntelligencePanel
        initialState={mockCompetitorIntelState}
        yourName="FounderOS"
      />
    )
  }

  it("renders without crashing", async () => {
    await renderPanel()
    expect(screen.getAllByTestId("recharts-responsive").length).toBeGreaterThan(0)
  })

  it("renders the data disclaimer", async () => {
    await renderPanel()
    expect(
      screen.getByText(/estimated from public web sources/i)
    ).toBeDefined()
  })

  it("renders quick action buttons", async () => {
    await renderPanel()
    expect(screen.getByRole("button", { name: /feature gap/i })).toBeDefined()
    expect(screen.getByRole("button", { name: /pricing response/i })).toBeDefined()
    expect(screen.getByRole("button", { name: /refresh all/i })).toBeDefined()
    expect(screen.getByRole("button", { name: /add competitor/i })).toBeDefined()
  })

  it("calls /api/workflows/feature-gap on feature gap button click", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) })
    await renderPanel()
    fireEvent.click(screen.getByRole("button", { name: /feature gap/i }))
    await waitFor(() => {
      const calls = mockFetch.mock.calls
      expect(calls.some((c) => String(c[0]).includes("feature-gap"))).toBe(true)
    })
  })

  it("calls /api/workflows/pricing-response on pricing response button click", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) })
    await renderPanel()
    fireEvent.click(screen.getByRole("button", { name: /pricing response/i }))
    await waitFor(() => {
      const calls = mockFetch.mock.calls
      expect(calls.some((c) => String(c[0]).includes("pricing-response"))).toBe(true)
    })
  })

  it("calls /api/competitors/fetch on refresh all click", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ state: mockCompetitorIntelState }),
    })
    await renderPanel()
    fireEvent.click(screen.getByRole("button", { name: /refresh all/i }))
    await waitFor(() => {
      const calls = mockFetch.mock.calls
      expect(calls.some((c) => String(c[0]).includes("/api/competitors/fetch"))).toBe(true)
    })
  })

  it("opens add competitor drawer on button click", async () => {
    await renderPanel()
    fireEvent.click(screen.getByRole("button", { name: /add competitor/i }))
    await waitFor(() => {
      // The Sheet renders a <h2 data-slot="sheet-title"> with "Add competitor"
      expect(screen.getAllByText("Add competitor").length).toBeGreaterThan(1)
    })
  })
})

// ─── MarketRadarChart ─────────────────────────────────────────────────────────

describe("MarketRadarChart", () => {
  const defaultScores = {
    pricingCompetitiveness: 7,
    featureDepth: 5,
    marketPresence: 3,
    geographicReach: 4,
    targetClarity: 8,
    tractionSignals: 3,
  }

  it("renders without crashing", async () => {
    const { MarketRadarChart } = await import(
      "@/components/app/competitor-intel/market-radar-chart"
    )
    render(
      <MarketRadarChart
        competitors={mockEnrichedCompetitors}
        yourName="FounderOS"
        yourScores={defaultScores}
      />
    )
    expect(screen.getByText("Market position")).toBeDefined()
  })
})

// ─── FeatureComparisonMatrix ──────────────────────────────────────────────────

describe("FeatureComparisonMatrix", () => {
  it("renders without crashing", async () => {
    const { FeatureComparisonMatrix } = await import(
      "@/components/app/competitor-intel/feature-comparison-matrix"
    )
    render(
      <FeatureComparisonMatrix
        competitors={mockEnrichedCompetitors}
        yourName="FounderOS"
        yourFeatures={["Competitor tracking", "AI briefs"]}
      />
    )
    expect(screen.getByText("Feature comparison")).toBeDefined()
  })

  it("renders a legend with cell meanings", async () => {
    const { FeatureComparisonMatrix } = await import(
      "@/components/app/competitor-intel/feature-comparison-matrix"
    )
    render(
      <FeatureComparisonMatrix
        competitors={mockEnrichedCompetitors}
        yourName="FounderOS"
        yourFeatures={[]}
      />
    )
    expect(screen.getByText("Confirmed")).toBeDefined()
    expect(screen.getByText("Missing")).toBeDefined()
  })
})

// ─── PricingLandscapeChart ────────────────────────────────────────────────────

describe("PricingLandscapeChart", () => {
  it("renders without crashing", async () => {
    const { PricingLandscapeChart } = await import(
      "@/components/app/competitor-intel/pricing-landscape-chart"
    )
    render(
      <PricingLandscapeChart
        competitors={mockEnrichedCompetitors}
        yourName="FounderOS"
        yourMonthlyPriceEntry={29}
        yourHasFreeTier={false}
      />
    )
    expect(screen.getByText("Pricing landscape")).toBeDefined()
  })
})

// ─── TractionScores ───────────────────────────────────────────────────────────

describe("TractionScores", () => {
  it("renders without crashing", async () => {
    const { TractionScores } = await import(
      "@/components/app/competitor-intel/traction-scores"
    )
    render(
      <TractionScores
        competitors={mockEnrichedCompetitors}
        yourName="FounderOS"
      />
    )
    expect(screen.getByText("Traction signals")).toBeDefined()
  })

  it("shows estimated badge", async () => {
    const { TractionScores } = await import(
      "@/components/app/competitor-intel/traction-scores"
    )
    render(
      <TractionScores
        competitors={mockEnrichedCompetitors}
        yourName="FounderOS"
      />
    )
    expect(screen.getByText("Estimated")).toBeDefined()
  })
})

// ─── PositioningMap ───────────────────────────────────────────────────────────

describe("PositioningMap", () => {
  it("renders without crashing", async () => {
    const { PositioningMap } = await import(
      "@/components/app/competitor-intel/positioning-map"
    )
    render(
      <PositioningMap
        competitors={mockEnrichedCompetitors}
        yourName="FounderOS"
        yourX={5}
        yourY={4}
      />
    )
    expect(screen.getByText("Positioning map")).toBeDefined()
  })
})

// ─── CompetitorCards ──────────────────────────────────────────────────────────

describe("CompetitorCards", () => {
  it("renders competitor names", async () => {
    const { CompetitorCards } = await import(
      "@/components/app/competitor-intel/competitor-cards"
    )
    render(
      <CompetitorCards
        competitors={mockEnrichedCompetitors}
        yourName="FounderOS"
        yourFeatures={["Competitor tracking"]}
        onEnrich={vi.fn()}
        onRemove={vi.fn()}
      />
    )
    expect(screen.getByText("Notion")).toBeDefined()
    expect(screen.getByText("Coda")).toBeDefined()
  })

  it("shows enrichment timestamps", async () => {
    const { CompetitorCards } = await import(
      "@/components/app/competitor-intel/competitor-cards"
    )
    render(
      <CompetitorCards
        competitors={mockEnrichedCompetitors}
        yourName="FounderOS"
        yourFeatures={[]}
        onEnrich={vi.fn()}
        onRemove={vi.fn()}
      />
    )
    expect(screen.getAllByText(/enriched/i).length).toBeGreaterThan(0)
  })
})
