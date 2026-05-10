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
