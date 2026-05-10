import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import DashboardPage from "@/app/(app)/dashboard/page"
import { briefService } from "@/lib/services/briefService"
import { store } from "@/lib/store"
import { seedDashboardStats, seedCompetitorChanges, seedProspects } from "@/lib/seed"

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

describe("DashboardPage", () => {
  beforeEach(() => {
    store._reset()
  })

  it("renders the dashboard page container", () => {
    render(<DashboardPage />)
    expect(screen.getByTestId("dashboard-page")).toBeDefined()
  })

  it("renders the Dashboard heading", () => {
    render(<DashboardPage />)
    expect(screen.getByText("Dashboard")).toBeDefined()
  })

  it("renders stat cards container", () => {
    render(<DashboardPage />)
    expect(screen.getByTestId("stat-cards")).toBeDefined()
  })

  it("renders competitor changes count", () => {
    render(<DashboardPage />)
    expect(
      screen.getByText(String(seedDashboardStats.competitorChanges))
    ).toBeDefined()
  })

  it("renders the morning brief title from the live brief", () => {
    render(<DashboardPage />)
    // The dynamic brief title always follows the "Today's Founder Brief — <date>" pattern
    const brief = briefService.aggregate().brief
    expect(screen.getByText(brief.title)).toBeDefined()
  })

  it("renders at least one brief bullet from the live brief", () => {
    const agg = briefService.aggregate()
    render(<DashboardPage />)
    // At least the first bullet from the live brief should appear
    const firstBullet = agg.brief.bullets[0]
    expect(screen.getByText(firstBullet)).toBeDefined()
  })

  it("renders competitor names in feed", () => {
    render(<DashboardPage />)
    // At least one of the top 3 competitors should appear (use getAllByText since
    // a name can appear in multiple places like stat cards and section feed)
    const visibleCompetitors = seedCompetitorChanges
      .slice(0, 3)
      .map((c) => c.competitorName)
    const found = visibleCompetitors.some(
      (name) => screen.queryAllByText(name).length > 0
    )
    expect(found).toBe(true)
  })

  it("renders top prospect company names", () => {
    render(<DashboardPage />)
    const topProspects = seedProspects
      .filter((p) => p.fitScore >= 75)
      .slice(0, 3)
    const found = topProspects.some(
      (p) => screen.queryByText(p.companyName) !== null
    )
    expect(found).toBe(true)
  })

  it("renders section headers for all three modules", () => {
    render(<DashboardPage />)
    // Use getAllByText because stat card labels and section headers may share text
    expect(screen.getAllByText("Competitor radar").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Top prospects").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Funding deadlines").length).toBeGreaterThan(0)
  })
})
