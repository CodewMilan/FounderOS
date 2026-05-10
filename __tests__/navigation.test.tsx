import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { AppSidebar } from "@/components/app/app-sidebar"

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/app",
}))

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

// Minimal sidebar provider wrapper for tests
import { SidebarProvider } from "@/components/ui/sidebar"

function TestWrapper({ children }: { children: React.ReactNode }) {
  return <SidebarProvider>{children}</SidebarProvider>
}

describe("AppSidebar navigation", () => {
  it("renders the FounderOS brand name", () => {
    render(
      <TestWrapper>
        <AppSidebar />
      </TestWrapper>
    )
    expect(screen.getByText("FounderOS")).toBeDefined()
  })

  it("renders Dashboard nav item", () => {
    render(
      <TestWrapper>
        <AppSidebar />
      </TestWrapper>
    )
    expect(screen.getByText("Dashboard")).toBeDefined()
  })

  it("renders Competitors nav item", () => {
    render(
      <TestWrapper>
        <AppSidebar />
      </TestWrapper>
    )
    expect(screen.getByText("Competitors")).toBeDefined()
  })

  it("renders Prospects nav item", () => {
    render(
      <TestWrapper>
        <AppSidebar />
      </TestWrapper>
    )
    expect(screen.getByText("Prospects")).toBeDefined()
  })

  it("renders Funding nav item", () => {
    render(
      <TestWrapper>
        <AppSidebar />
      </TestWrapper>
    )
    expect(screen.getByText("Funding")).toBeDefined()
  })

  it("renders Settings nav item", () => {
    render(
      <TestWrapper>
        <AppSidebar />
      </TestWrapper>
    )
    expect(screen.getByText("Settings")).toBeDefined()
  })

  it("renders all 5 nav sections", () => {
    render(
      <TestWrapper>
        <AppSidebar />
      </TestWrapper>
    )
    const sections = ["Dashboard", "Competitors", "Prospects", "Funding", "Settings"]
    for (const section of sections) {
      expect(screen.getByText(section)).toBeDefined()
    }
  })

  it("Dashboard link points to /app", () => {
    render(
      <TestWrapper>
        <AppSidebar />
      </TestWrapper>
    )
    const dashboardLink = screen.getByRole("link", { name: /dashboard/i })
    expect(dashboardLink.getAttribute("href")).toBe("/app")
  })

  it("Competitors link points to /app/competitors", () => {
    render(
      <TestWrapper>
        <AppSidebar />
      </TestWrapper>
    )
    const link = screen.getByRole("link", { name: /competitors/i })
    expect(link.getAttribute("href")).toBe("/app/competitors")
  })

  it("Prospects link points to /app/prospects", () => {
    render(
      <TestWrapper>
        <AppSidebar />
      </TestWrapper>
    )
    const link = screen.getByRole("link", { name: /prospects/i })
    expect(link.getAttribute("href")).toBe("/app/prospects")
  })

  it("Funding link points to /app/funding", () => {
    render(
      <TestWrapper>
        <AppSidebar />
      </TestWrapper>
    )
    const link = screen.getByRole("link", { name: /funding/i })
    expect(link.getAttribute("href")).toBe("/app/funding")
  })

  it("Settings link points to /app/settings", () => {
    render(
      <TestWrapper>
        <AppSidebar />
      </TestWrapper>
    )
    const link = screen.getByRole("link", { name: /settings/i })
    expect(link.getAttribute("href")).toBe("/app/settings")
  })
})
