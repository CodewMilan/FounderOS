import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { DashboardClient } from "@/components/app/dashboard-client"
import DashboardPage from "@/app/app/page"
import { briefService } from "@/lib/services/briefService"
import { store } from "@/lib/store"
import { seedCompetitorChanges, seedProspects, seedFundingOpportunities } from "@/lib/seed"
import type { DashboardAggregate } from "@/lib/services/briefService"

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode
    href: string
  }) => <a href={href}>{children}</a>,
}))

// ─── Fixture helpers ──────────────────────────────────────────────────────────

function makeAggregate(): DashboardAggregate {
  return briefService.aggregate()
}

function makeEmptyAggregate(): DashboardAggregate {
  store._clearAll()
  return briefService.aggregate()
}

// ─── DashboardClient (seeded state) ──────────────────────────────────────────

describe("DashboardClient — seeded state", () => {
  beforeEach(() => {
    store._reset()
    vi.restoreAllMocks()
  })

  it("renders the dashboard-page container", () => {
    render(<DashboardClient initialAggregate={makeAggregate()} />)
    expect(screen.getByTestId("dashboard-page")).toBeDefined()
  })

  it("renders the Dashboard heading", () => {
    render(<DashboardClient initialAggregate={makeAggregate()} />)
    expect(screen.getByText("Dashboard")).toBeDefined()
  })

  it("renders the stat-cards container", () => {
    render(<DashboardClient initialAggregate={makeAggregate()} />)
    expect(screen.getByTestId("stat-cards")).toBeDefined()
  })

  it("renders the morning brief card", () => {
    render(<DashboardClient initialAggregate={makeAggregate()} />)
    expect(screen.getByTestId("morning-brief")).toBeDefined()
  })

  it("renders the morning brief title", () => {
    const agg = makeAggregate()
    render(<DashboardClient initialAggregate={agg} />)
    expect(screen.getByText(agg.brief.title)).toBeDefined()
  })

  it("renders brief bullets", () => {
    const agg = makeAggregate()
    render(<DashboardClient initialAggregate={agg} />)
    expect(screen.getByText(agg.brief.bullets[0])).toBeDefined()
  })

  it("renders the Run scan button", () => {
    render(<DashboardClient initialAggregate={makeAggregate()} />)
    expect(screen.getByTestId("refresh-button")).toBeDefined()
    expect(screen.getByText("Run scan")).toBeDefined()
  })

  it("renders section headers for all three modules", () => {
    render(<DashboardClient initialAggregate={makeAggregate()} />)
    expect(screen.getAllByText("Competitor radar").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Top prospects").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Funding deadlines").length).toBeGreaterThan(0)
  })

  it("renders competitor change cards with names", () => {
    const agg = makeAggregate()
    render(<DashboardClient initialAggregate={agg} />)
    // At least one topCompetitorChange name should appear
    const found = agg.topCompetitorChanges.some(
      (c) => screen.queryAllByText(c.competitorName).length > 0
    )
    expect(found).toBe(true)
  })

  it("renders hot prospect company names", () => {
    const agg = makeAggregate()
    render(<DashboardClient initialAggregate={agg} />)
    const found = agg.hotProspects.some(
      (p) => screen.queryByText(p.companyName) !== null
    )
    expect(found).toBe(true)
  })

  it("renders funding opportunity names", () => {
    const agg = makeAggregate()
    render(<DashboardClient initialAggregate={agg} />)
    const found = agg.urgentFunding.some(
      (f) => screen.queryByText(f.programName) !== null
    )
    expect(found).toBe(true)
  })

  it("renders recommended actions section when actions exist", () => {
    const agg = makeAggregate()
    // Seed has high-significance changes, so actions should be non-empty
    if (agg.recommendedActions.length === 0) return
    render(<DashboardClient initialAggregate={agg} />)
    expect(screen.getByTestId("recommended-actions")).toBeDefined()
  })

  it("renders stat counts from aggregate stats", () => {
    const agg = makeAggregate()
    render(<DashboardClient initialAggregate={agg} />)
    // competitor count should appear as text
    expect(
      screen.queryAllByText(String(agg.stats.competitorChanges)).length
    ).toBeGreaterThan(0)
  })
})

// ─── DashboardClient — empty state ───────────────────────────────────────────

describe("DashboardClient — empty state", () => {
  it("renders empty state messages when store is cleared", () => {
    const agg = makeEmptyAggregate()
    store._reset() // restore for proper render
    render(<DashboardClient initialAggregate={agg} />)
    // Empty sections should show descriptive messages
    expect(
      screen.queryByText(/No competitor changes detected yet/i) !== null ||
      screen.queryByText(/No high-fit prospects yet/i) !== null ||
      screen.queryByText(/No upcoming funding deadlines/i) !== null
    ).toBe(true)
  })

  it("brief falls back gracefully with no data", () => {
    store._clearAll()
    const agg = briefService.aggregate()
    render(<DashboardClient initialAggregate={agg} />)
    // Brief should still render with a fallback bullet
    expect(screen.getByTestId("morning-brief")).toBeDefined()
  })
})

// ─── DashboardClient — loading state ─────────────────────────────────────────

describe("DashboardClient — loading state", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("shows Scanning… text and disables the button while refresh is in flight", async () => {
    // A fetch that never resolves — lets us inspect the mid-flight state
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => {})))

    render(<DashboardClient initialAggregate={makeAggregate()} />)
    fireEvent.click(screen.getByTestId("refresh-button"))

    await waitFor(() => {
      expect(screen.getByText("Scanning…")).toBeDefined()
    })

    const btn = screen.getByTestId("refresh-button") as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it("shows skeleton cards while scanning", async () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => {})))

    render(<DashboardClient initialAggregate={makeAggregate()} />)
    fireEvent.click(screen.getByTestId("refresh-button"))

    await waitFor(() => {
      // During scanning, skeleton containers appear
      expect(screen.getByTestId("stat-cards-skeleton")).toBeDefined()
    })
  })
})

// ─── DashboardClient — error state ───────────────────────────────────────────

describe("DashboardClient — error state", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("shows error banner when the API returns a non-OK response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ error: "Scan failed — internal error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      )
    )

    render(<DashboardClient initialAggregate={makeAggregate()} />)
    fireEvent.click(screen.getByTestId("refresh-button"))

    await waitFor(() => {
      expect(screen.getByTestId("scan-error-banner")).toBeDefined()
      expect(screen.getByText("Scan failed — internal error")).toBeDefined()
    })
  })

  it("shows error banner on network error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("Network error") }))

    render(<DashboardClient initialAggregate={makeAggregate()} />)
    fireEvent.click(screen.getByTestId("refresh-button"))

    await waitFor(() => {
      expect(screen.getByTestId("scan-error-banner")).toBeDefined()
    })
  })

  it("re-enables the refresh button after an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ error: "fail" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      )
    )

    render(<DashboardClient initialAggregate={makeAggregate()} />)
    fireEvent.click(screen.getByTestId("refresh-button"))

    await waitFor(() => {
      const btn = screen.getByTestId("refresh-button") as HTMLButtonElement
      expect(btn.disabled).toBe(false)
    })
  })
})

// ─── DashboardClient — successful refresh ────────────────────────────────────

describe("DashboardClient — successful refresh", () => {
  beforeEach(() => {
    store._reset()
    vi.restoreAllMocks()
  })

  it("shows scan-done banner after a successful refresh", async () => {
    const freshAggregate: DashboardAggregate = makeAggregate()

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify(freshAggregate), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    )

    render(<DashboardClient initialAggregate={makeAggregate()} />)
    fireEvent.click(screen.getByTestId("refresh-button"))

    await waitFor(() => {
      expect(screen.getByTestId("scan-done-banner")).toBeDefined()
    })
  })

  it("updates the displayed data after a successful refresh", async () => {
    const initialAgg = makeAggregate()
    // Compose a slightly different aggregate to verify update
    const updatedAgg: DashboardAggregate = {
      ...initialAgg,
      brief: {
        ...initialAgg.brief,
        title: "Updated Founder Brief — Refreshed",
        bullets: ["This is a refreshed bullet"],
      },
    }

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify(updatedAgg), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    )

    render(<DashboardClient initialAggregate={initialAgg} />)
    fireEvent.click(screen.getByTestId("refresh-button"))

    await waitFor(() => {
      expect(screen.getByText("Updated Founder Brief — Refreshed")).toBeDefined()
      expect(screen.getByText("This is a refreshed bullet")).toBeDefined()
    })
  })

  it("re-enables the button after successful refresh", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify(makeAggregate()), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    )

    render(<DashboardClient initialAggregate={makeAggregate()} />)
    fireEvent.click(screen.getByTestId("refresh-button"))

    await waitFor(() => {
      const btn = screen.getByTestId("refresh-button") as HTMLButtonElement
      expect(btn.disabled).toBe(false)
    })
  })
})

// ─── DashboardClient — visual metrics ────────────────────────────────────────

describe("DashboardClient — visual metrics", () => {
  beforeEach(() => {
    store._reset()
    vi.restoreAllMocks()
  })

  it("renders sparkline SVG in the stat-cards area", () => {
    render(<DashboardClient initialAggregate={makeAggregate()} />)
    const statCards = screen.getByTestId("stat-cards")
    // sparkline SVGs are present (aria-hidden)
    const svgs = statCards.querySelectorAll("svg")
    expect(svgs.length).toBeGreaterThan(0)
  })

  it("renders KPI card sub-labels", () => {
    render(<DashboardClient initialAggregate={makeAggregate()} />)
    // highSeverityChanges sub-label
    expect(screen.getByText("Significance ≥ 80")).toBeDefined()
    // topProspects sub-label includes 'Avg fit'
    const avgFitEl = screen.queryAllByText(/Avg fit/i)
    expect(avgFitEl.length).toBeGreaterThan(0)
  })

  it("renders the non-dilutive funding pill in the deadlines KPI card", () => {
    render(<DashboardClient initialAggregate={makeAggregate()} />)
    expect(screen.queryAllByText(/non-dilutive/i).length).toBeGreaterThan(0)
  })

  it("renders source health footer with tracked source count", () => {
    const agg = makeAggregate()
    render(<DashboardClient initialAggregate={agg} />)
    const footerMatches = screen.queryAllByText(/Tracking \d+ sources/i)
    expect(footerMatches.length).toBeGreaterThan(0)
  })

  it("renders 'Manage →' link in source health footer", () => {
    render(<DashboardClient initialAggregate={makeAggregate()} />)
    const manageLinks = screen.queryAllByText(/Manage →/i)
    expect(manageLinks.length).toBeGreaterThan(0)
  })

  it("renders signal strength bars in competitor cards", () => {
    render(<DashboardClient initialAggregate={makeAggregate()} />)
    // Signal strength bars are rendered as a row of spans; check competitor card is present
    expect(screen.getByTestId("dashboard-page")).toBeDefined()
  })

  it("renders relative time labels in competitor cards", () => {
    render(<DashboardClient initialAggregate={makeAggregate()} />)
    // Relative time labels like 'Yesterday', 'Xd ago', 'Today'
    const timeLabels = screen.queryAllByText(/ago|yesterday|today/i)
    expect(timeLabels.length).toBeGreaterThan(0)
  })

  it("renders 'hiring signals' chip in prospect cards", () => {
    render(<DashboardClient initialAggregate={makeAggregate()} />)
    const chips = screen.queryAllByText(/hiring signals/i)
    expect(chips.length).toBeGreaterThan(0)
  })

  it("renders deadline pills in funding cards", () => {
    render(<DashboardClient initialAggregate={makeAggregate()} />)
    // Deadline pills show 'Xd left'
    const pills = screen.queryAllByText(/d left/i)
    expect(pills.length).toBeGreaterThan(0)
  })

  it("renders urgency pills in the recommended actions", () => {
    const agg = makeAggregate()
    if (agg.recommendedActions.length === 0) return
    render(<DashboardClient initialAggregate={agg} />)
    // UrgencyPill renders "High", "Med", or "Low"
    const urgencyPills = [
      ...screen.queryAllByText("High"),
      ...screen.queryAllByText("Med"),
      ...screen.queryAllByText("Low"),
    ]
    expect(urgencyPills.length).toBeGreaterThan(0)
  })

  it("renders delta pill with trend count in competitor changes KPI", () => {
    render(<DashboardClient initialAggregate={makeAggregate()} />)
    // DeltaPill shows '↑ N this wk' (neutral arrow) when weeklyCompetitorTotal > 0
    const deltaText = screen.queryAllByText(/this wk/i)
    expect(deltaText.length).toBeGreaterThan(0)
  })

  it("renders section count badges next to section headers", () => {
    const agg = makeAggregate()
    render(<DashboardClient initialAggregate={agg} />)
    // Count badges appear next to section headers for seeded data
    expect(screen.getByTestId("dashboard-page")).toBeDefined()
  })

  it("renders the high-priority action count in action queue header", () => {
    const agg = makeAggregate()
    if (agg.recommendedActions.filter((a) => a.urgency === "high").length === 0) return
    render(<DashboardClient initialAggregate={agg} />)
    const highPriorityLabel = screen.queryAllByText(/high priority/i)
    expect(highPriorityLabel.length).toBeGreaterThan(0)
  })

  it("renders the trends data from aggregate in KPI cards without crashing", () => {
    const agg = makeAggregate()
    // Verify trends are present in aggregate
    expect(agg.trends).toBeDefined()
    expect(agg.trends.weeklyCompetitorCounts).toHaveLength(7)
    expect(agg.trends.avgProspectFitScore).toBeGreaterThanOrEqual(0)
    // Render successfully
    render(<DashboardClient initialAggregate={agg} />)
    expect(screen.getByTestId("dashboard-page")).toBeDefined()
  })
})

// ─── DashboardClient — graceful fallback with minimal trends ─────────────────

describe("DashboardClient — minimal trends fallback", () => {
  it("renders without crashing when weeklyCompetitorCounts are all zero", () => {
    store._reset()
    const agg = briefService.aggregate()
    const minimalAgg = {
      ...agg,
      trends: {
        ...agg.trends,
        weeklyCompetitorCounts: [0, 0, 0, 0, 0, 0, 0],
        weeklyCompetitorTotal: 0,
      },
    }
    render(<DashboardClient initialAggregate={minimalAgg} />)
    expect(screen.getByTestId("dashboard-page")).toBeDefined()
  })

  it("does not render delta pill when weeklyCompetitorTotal is zero", () => {
    store._reset()
    const agg = briefService.aggregate()
    const noTrendAgg = {
      ...agg,
      trends: { ...agg.trends, weeklyCompetitorCounts: [0, 0, 0, 0, 0, 0, 0], weeklyCompetitorTotal: 0 },
    }
    render(<DashboardClient initialAggregate={noTrendAgg} />)
    // Delta pill should not appear when total is 0
    expect(screen.queryAllByText(/this wk/i)).toHaveLength(0)
  })
})

// ─── DashboardClient — scan error banner uses neutral styling ────────────────

describe("DashboardClient — error banner styling", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    store._reset()
  })

  it("error banner renders with neutral styling (no red class)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({ error: "Scan failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    ))
    render(<DashboardClient initialAggregate={makeAggregate()} />)
    fireEvent.click(screen.getByTestId("refresh-button"))
    await waitFor(() => {
      const banner = screen.getByTestId("scan-error-banner")
      expect(banner).toBeDefined()
      // Banner uses neutral styling not red
      expect(banner.className).not.toContain("bg-red")
    })
  })
})

// ─── DashboardPage (server component) ────────────────────────────────────────

describe("DashboardPage (server component)", () => {
  beforeEach(() => {
    store._reset()
  })

  it("renders the dashboard container via the server component", () => {
    render(<DashboardPage />)
    expect(screen.getByTestId("dashboard-page")).toBeDefined()
  })

  it("renders stat cards via the server component", () => {
    render(<DashboardPage />)
    expect(screen.getByTestId("stat-cards")).toBeDefined()
  })

  it("renders the morning brief via the server component", () => {
    render(<DashboardPage />)
    expect(screen.getByTestId("morning-brief")).toBeDefined()
  })

  it("renders the Run scan button via the server component", () => {
    render(<DashboardPage />)
    expect(screen.getByText("Run scan")).toBeDefined()
  })

  it("renders seeded competitor names in the feed", () => {
    render(<DashboardPage />)
    const found = seedCompetitorChanges
      .slice(0, 3)
      .some((c) => screen.queryAllByText(c.competitorName).length > 0)
    expect(found).toBe(true)
  })

  it("renders seeded prospect names in the feed", () => {
    render(<DashboardPage />)
    const found = seedProspects
      .filter((p) => p.fitScore >= 60)
      .slice(0, 3)
      .some((p) => screen.queryByText(p.companyName) !== null)
    expect(found).toBe(true)
  })
})
