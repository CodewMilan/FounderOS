import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { AppChrome } from "@/components/app/app-chrome"

vi.mock("next/navigation", () => ({
  usePathname: () => "/app",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() }),
}))

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

describe("AppChrome navigation", () => {
  it("renders the FounderOS brand linking home", () => {
    render(
      <AppChrome>
        <span />
      </AppChrome>,
    )
    const brand = screen.getByRole("link", { name: /founderos/i })
    expect(brand.getAttribute("href")).toBe("/")
  })

  it("renders Dashboard nav item", () => {
    render(
      <AppChrome>
        <span />
      </AppChrome>,
    )
    expect(screen.getByText("Dashboard")).toBeDefined()
  })

  it("renders Competitors nav item", () => {
    render(
      <AppChrome>
        <span />
      </AppChrome>,
    )
    expect(screen.getByText("Competitors")).toBeDefined()
  })

  it("renders Prospects nav item", () => {
    render(
      <AppChrome>
        <span />
      </AppChrome>,
    )
    expect(screen.getByText("Prospects")).toBeDefined()
  })

  it("renders Funding nav item", () => {
    render(
      <AppChrome>
        <span />
      </AppChrome>,
    )
    expect(screen.getByText("Funding")).toBeDefined()
  })

  it("renders Home CTA linking to marketing site", () => {
    render(
      <AppChrome>
        <span />
      </AppChrome>,
    )
    const home = screen.getByRole("link", { name: /home/i })
    expect(home.getAttribute("href")).toBe("/")
  })

  it("renders Log out control", () => {
    render(
      <AppChrome>
        <span />
      </AppChrome>,
    )
    expect(screen.getByRole("button", { name: /log out/i })).toBeDefined()
  })

  it("renders primary nav sections", () => {
    render(
      <AppChrome>
        <span />
      </AppChrome>,
    )
    const sections = ["Dashboard", "Competitors", "Prospects", "Funding"]
    for (const section of sections) {
      expect(screen.getByText(section)).toBeDefined()
    }
  })

  it("Dashboard link points to /app", () => {
    render(
      <AppChrome>
        <span />
      </AppChrome>,
    )
    const dashboardLink = screen.getByRole("link", { name: /^Dashboard$/i })
    expect(dashboardLink.getAttribute("href")).toBe("/app")
  })

  it("Competitors link points to /app/competitors", () => {
    render(
      <AppChrome>
        <span />
      </AppChrome>,
    )
    const link = screen.getByRole("link", { name: /^Competitors$/i })
    expect(link.getAttribute("href")).toBe("/app/competitors")
  })

  it("Prospects link points to /app/prospects", () => {
    render(
      <AppChrome>
        <span />
      </AppChrome>,
    )
    const link = screen.getByRole("link", { name: /^Prospects$/i })
    expect(link.getAttribute("href")).toBe("/app/prospects")
  })

  it("Funding link points to /app/funding", () => {
    render(
      <AppChrome>
        <span />
      </AppChrome>,
    )
    const link = screen.getByRole("link", { name: /^Funding$/i })
    expect(link.getAttribute("href")).toBe("/app/funding")
  })

  it("renders More menu trigger for secondary routes", () => {
    render(
      <AppChrome>
        <span />
      </AppChrome>,
    )
    expect(screen.getByRole("button", { name: /more/i })).toBeDefined()
  })
})
