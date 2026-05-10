import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import CompetitorsPage from "@/app/app/competitors/page"
import { seedCompetitorChanges } from "@/lib/seed"

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode
    href: string
  }) => <a href={href}>{children}</a>,
}))

describe("CompetitorsPage", () => {
  it("renders the competitors page container", () => {
    render(<CompetitorsPage />)
    expect(screen.getByTestId("competitors-page")).toBeDefined()
  })

  it("renders the Competitor Radar heading", () => {
    render(<CompetitorsPage />)
    expect(screen.getByText("Competitor Radar")).toBeDefined()
  })

  it("renders the competitor list", () => {
    render(<CompetitorsPage />)
    expect(screen.getByTestId("competitor-list")).toBeDefined()
  })

  it("renders all seeded competitor change records", () => {
    render(<CompetitorsPage />)
    for (const change of seedCompetitorChanges) {
      expect(screen.getByText(change.competitorName)).toBeDefined()
    }
  })

  it("renders competitor summaries", () => {
    render(<CompetitorsPage />)
    for (const change of seedCompetitorChanges) {
      expect(screen.getByText(change.summary)).toBeDefined()
    }
  })

  it("shows the total change count in stats row", () => {
    render(<CompetitorsPage />)
    expect(screen.getByText(String(seedCompetitorChanges.length))).toBeDefined()
  })

  it("opens the detail sheet when a card is clicked", () => {
    render(<CompetitorsPage />)
    const cards = screen.getAllByText(seedCompetitorChanges[0].competitorName)
    fireEvent.click(cards[0].closest("[class*='cursor-pointer']") as Element)
    // Sheet should show the full snapshot text
    expect(
      screen.getByText(seedCompetitorChanges[0].currentSnapshot)
    ).toBeDefined()
  })

  it("renders high-priority count", () => {
    render(<CompetitorsPage />)
    const highPriorityCount = seedCompetitorChanges.filter(
      (c) => c.significanceScore >= 80
    ).length
    expect(screen.getByText(String(highPriorityCount))).toBeDefined()
  })
})
