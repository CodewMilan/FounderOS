import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { CompetitorFeed } from "@/components/app/competitor-feed"
import CompetitorsPage from "@/app/(app)/competitors/page"
import { seedCompetitorChanges } from "@/lib/seed"
import type { CompetitorChange } from "@/lib/schemas"

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// ─── CompetitorFeed (direct render with initialChanges) ───────────────────────

describe("CompetitorFeed component", () => {
  it("renders the competitors-page container", () => {
    render(<CompetitorFeed initialChanges={seedCompetitorChanges} />)
    expect(screen.getByTestId("competitors-page")).toBeDefined()
  })

  it("renders the Competitor Radar heading", () => {
    render(<CompetitorFeed initialChanges={seedCompetitorChanges} />)
    expect(screen.getByText("Competitor Radar")).toBeDefined()
  })

  it("renders the competitor-list container", () => {
    render(<CompetitorFeed initialChanges={seedCompetitorChanges} />)
    expect(screen.getByTestId("competitor-list")).toBeDefined()
  })

  it("renders all seeded competitor names", () => {
    render(<CompetitorFeed initialChanges={seedCompetitorChanges} />)
    for (const change of seedCompetitorChanges) {
      expect(screen.getByText(change.competitorName)).toBeDefined()
    }
  })

  it("renders all seeded summaries", () => {
    render(<CompetitorFeed initialChanges={seedCompetitorChanges} />)
    for (const change of seedCompetitorChanges) {
      expect(screen.getByText(change.summary)).toBeDefined()
    }
  })

  it("shows total change count in stats row", () => {
    render(<CompetitorFeed initialChanges={seedCompetitorChanges} />)
    expect(screen.getByText(String(seedCompetitorChanges.length))).toBeDefined()
  })

  it("shows high-priority count", () => {
    render(<CompetitorFeed initialChanges={seedCompetitorChanges} />)
    const highPriority = seedCompetitorChanges.filter((c) => c.significanceScore >= 80).length
    expect(screen.getByText(String(highPriority))).toBeDefined()
  })

  it("renders the Scan now button", () => {
    render(<CompetitorFeed initialChanges={seedCompetitorChanges} />)
    expect(screen.getByTestId("scan-button")).toBeDefined()
    expect(screen.getByText("Scan now")).toBeDefined()
  })

  it("sorts changes by significance score descending", () => {
    const changes = [...seedCompetitorChanges]
    render(<CompetitorFeed initialChanges={changes} />)
    const names = screen.getAllByText(/Linear|Notion|Vercel|Figma|Loom/)
    // First rendered name should be the highest-scoring competitor
    const sorted = [...changes].sort((a, b) => b.significanceScore - a.significanceScore)
    expect(names[0].textContent).toBe(sorted[0].competitorName)
  })

  it("opens detail sheet when a card is clicked", () => {
    render(<CompetitorFeed initialChanges={seedCompetitorChanges} />)
    const first = seedCompetitorChanges.sort((a, b) => b.significanceScore - a.significanceScore)[0]
    const nameEl = screen.getByText(first.competitorName)
    const card = nameEl.closest("[class*='cursor-pointer']") as Element
    fireEvent.click(card)
    // currentSnapshot should be visible in the sheet
    expect(screen.getByText(first.currentSnapshot)).toBeDefined()
  })
})

// ─── CompetitorsPage (server component wrapping CompetitorFeed) ───────────────

describe("CompetitorsPage (server component)", () => {
  it("renders the competitors page container via the server component", () => {
    render(<CompetitorsPage />)
    expect(screen.getByTestId("competitors-page")).toBeDefined()
  })

  it("renders all seeded records via the server component", () => {
    render(<CompetitorsPage />)
    for (const change of seedCompetitorChanges) {
      expect(screen.getByText(change.competitorName)).toBeDefined()
    }
  })
})

// ─── Scan button interaction ──────────────────────────────────────────────────

describe("Scan button interaction", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("shows Scanning… while the scan is in progress", async () => {
    // Never resolves so we can inspect the pending state
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>(() => {}))
    )

    render(<CompetitorFeed initialChanges={seedCompetitorChanges} />)
    fireEvent.click(screen.getByTestId("scan-button"))

    await waitFor(() => {
      expect(screen.getByText("Scanning…")).toBeDefined()
    })
  })

  it("shows scan result banner after a successful scan", async () => {
    const mockChange: CompetitorChange = {
      id: "cc-new",
      competitorName: "NewCo",
      pageType: "pricing",
      currentSnapshot: "New pricing content here",
      changeType: "pricing",
      significanceScore: 72,
      summary: "NewCo updated their pricing",
      suggestedAction: "Review the new pricing",
      detectedAt: "2026-05-10T12:00:00.000Z",
      sourceUrl: "https://newco.com/pricing",
    }

    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("/scan")) {
          return new Response(
            JSON.stringify({ scanned: 3, detected: 1, changes: [mockChange] }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        }
        // /api/competitors
        return new Response(
          JSON.stringify({ changes: [...seedCompetitorChanges, mockChange] }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      })
    )

    render(<CompetitorFeed initialChanges={seedCompetitorChanges} />)
    fireEvent.click(screen.getByTestId("scan-button"))

    await waitFor(() => {
      expect(screen.getByText(/Scanned/i)).toBeDefined()
      expect(screen.getByText(/new change/i)).toBeDefined()
    })
  })

  it("shows error banner when scan fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ error: "Scan failed" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      )
    )

    render(<CompetitorFeed initialChanges={seedCompetitorChanges} />)
    fireEvent.click(screen.getByTestId("scan-button"))

    await waitFor(() => {
      expect(screen.getByText("Scan failed")).toBeDefined()
    })
  })
})

// ─── Detail sheet before/after rendering ─────────────────────────────────────

describe("CompetitorDetailSheet before/after rendering", () => {
  it("shows 'What changed' section when no previousSnapshot", () => {
    const change = seedCompetitorChanges[0] // seeded changes have no previousSnapshot
    render(<CompetitorFeed initialChanges={[change]} />)
    fireEvent.click(
      screen.getByText(change.competitorName).closest("[class*='cursor-pointer']") as Element
    )
    expect(screen.getByText("What changed")).toBeDefined()
  })

  it("shows Before and After sections when previousSnapshot exists", () => {
    const changeWithDelta: CompetitorChange = {
      ...seedCompetitorChanges[0],
      id: "cc-delta-test",
      previousSnapshot: "Old pricing: $8/month",
      currentSnapshot: "New pricing: $15/month with SSO",
    }
    render(<CompetitorFeed initialChanges={[changeWithDelta]} />)
    fireEvent.click(
      screen.getByText(changeWithDelta.competitorName).closest("[class*='cursor-pointer']") as Element
    )
    expect(screen.getByText("Before")).toBeDefined()
    expect(screen.getByText("After")).toBeDefined()
    expect(screen.getByText("Old pricing: $8/month")).toBeDefined()
    expect(screen.getByText("New pricing: $15/month with SSO")).toBeDefined()
  })
})
