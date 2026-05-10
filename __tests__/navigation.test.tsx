import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { AppSidebar } from "@/components/app/app-sidebar"

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
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
})
