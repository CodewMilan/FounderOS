/**
 * Routing smoke tests.
 *
 * Verifies:
 *   - landing page component renders (maps to /)
 *   - app dashboard page component renders (maps to /app)
 *   - competitors page component renders (maps to /app/competitors)
 *   - prospects page component renders (maps to /app/prospects)
 *   - funding page component renders (maps to /app/funding)
 *   - settings page component renders (maps to /app/settings)
 *   - landing page CTA and nav link point to /app
 *   - landing page includes a link to /login
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode
    href: string
    className?: string
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))

vi.mock("next/navigation", () => ({
  usePathname: () => "/app",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock("@/components/app/signal-detail-sheet", () => ({
  FundingDetailSheet: vi.fn(() => null),
  CompetitorDetailSheet: vi.fn(() => null),
  ProspectDetailSheet: vi.fn(() => null),
}))

// Sidebar uses usePathname — already mocked above. Also mock the full sidebar
// to avoid deep rendering issues in landing page / routing tests.
vi.mock("@/components/ui/sidebar", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/ui/sidebar")>()
  return actual
})

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      new Response(JSON.stringify({ sources: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    )
  )
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ─── Page imports (after mocks) ────────────────────────────────────────────────

import LandingPage from "@/app/page"
import LoginPage from "@/app/login/page"
import DashboardPage from "@/app/app/page"
import CompetitorsPage from "@/app/app/competitors/page"
import ProspectsPage from "@/app/app/prospects/page"
import FundingPage from "@/app/app/funding/page"
import SettingsPage from "@/app/app/settings/page"

// ─── Landing page ─────────────────────────────────────────────────────────────

describe("Landing page (/ route)", () => {
  it("renders without crashing", () => {
    render(<LandingPage />)
  })

  it("has a link to /app (CTA or nav)", () => {
    render(<LandingPage />)
    const links = screen.getAllByRole("link")
    const appLinks = links.filter((l) => l.getAttribute("href") === "/app")
    expect(appLinks.length).toBeGreaterThan(0)
  })

  it("has a link to /login", () => {
    render(<LandingPage />)
    const loginLinks = screen.getAllByRole("link").filter((l) => l.getAttribute("href") === "/login")
    expect(loginLinks.length).toBeGreaterThan(0)
  })

  it("does not render the product dashboard on the landing page", () => {
    render(<LandingPage />)
    expect(screen.queryByTestId("dashboard-page")).toBeNull()
  })
})

// ─── Login page ───────────────────────────────────────────────────────────────

describe("Login page (/login route)", () => {
  it("renders sign in heading", () => {
    render(<LoginPage />)
    expect(screen.getByRole("heading", { name: /sign in/i })).toBeDefined()
  })

  it("links back to home and open app", () => {
    render(<LoginPage />)
    const links = screen.getAllByRole("link")
    expect(links.some((l) => l.getAttribute("href") === "/")).toBe(true)
    expect(links.some((l) => l.getAttribute("href") === "/app")).toBe(true)
  })
})

// ─── Product app pages ────────────────────────────────────────────────────────

describe("Dashboard page (/app route)", () => {
  it("renders the dashboard page container", () => {
    render(<DashboardPage />)
    expect(screen.getByTestId("dashboard-page")).toBeDefined()
  })

  it("renders the Dashboard heading", () => {
    render(<DashboardPage />)
    expect(screen.getByText("Dashboard")).toBeDefined()
  })
})

describe("Competitors page (/app/competitors route)", () => {
  it("renders without crashing", async () => {
    render(await CompetitorsPage())
  })

  it("renders the competitors page container", async () => {
    render(await CompetitorsPage())
    expect(screen.getByTestId("competitors-page")).toBeDefined()
  })
})

describe("Prospects page (/app/prospects route)", () => {
  it("renders without crashing", () => {
    render(<ProspectsPage />)
  })

  it("renders the prospects page container", () => {
    render(<ProspectsPage />)
    expect(screen.getByTestId("prospects-page")).toBeDefined()
  })
})

describe("Funding page (/app/funding route)", () => {
  it("renders the funding page container", () => {
    render(<FundingPage />)
    expect(screen.getByTestId("funding-page")).toBeDefined()
  })

  it("renders Funding Scout heading", () => {
    render(<FundingPage />)
    expect(screen.getByText("Funding Scout")).toBeDefined()
  })
})

describe("Settings page (/app/settings route)", () => {
  it("renders the settings page container", () => {
    render(<SettingsPage />)
    expect(screen.getByTestId("settings-page")).toBeDefined()
  })

  it("renders Settings heading", () => {
    render(<SettingsPage />)
    expect(screen.getByText("Settings")).toBeDefined()
  })
})
