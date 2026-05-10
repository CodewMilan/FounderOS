/**
 * UI tests for the WorkflowPanel component.
 * All API calls are mocked via global fetch stub.
 */

import React from "react"
import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { WorkflowPanel } from "@/components/app/workflow-panel"

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// ─── Render ───────────────────────────────────────────────────────────────────

describe("WorkflowPanel — render", () => {
  it("renders the panel with test id", () => {
    render(<WorkflowPanel />)
    expect(screen.getByTestId("workflow-panel")).toBeDefined()
  })

  it("renders all 6 workflow tab triggers", () => {
    render(<WorkflowPanel />)
    expect(screen.getByText("Feature Gap")).toBeDefined()
    expect(screen.getByText("Dev Ticket")).toBeDefined()
    expect(screen.getByText("Pricing Response")).toBeDefined()
    expect(screen.getByText("Prospect Brief")).toBeDefined()
    expect(screen.getByText("Funding Alert")).toBeDefined()
    expect(screen.getByText("Pricing Update")).toBeDefined()
  })

  it("shows Feature Gap tab content by default", () => {
    render(<WorkflowPanel />)
    expect(screen.getByTestId("feature-gap-tab")).toBeDefined()
  })
})

// ─── Feature Gap Tab ─────────────────────────────────────────────────────────

describe("WorkflowPanel — Feature Gap tab", () => {
  afterEach(() => { vi.unstubAllGlobals() })

  it("renders competitor URL input", () => {
    render(<WorkflowPanel />)
    expect(screen.getByTestId("feature-gap-competitor-url")).toBeDefined()
  })

  it("run button is disabled when URL is empty", () => {
    render(<WorkflowPanel />)
    const btn = screen.getByTestId("feature-gap-run-btn") as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it("run button is enabled when URL is filled", () => {
    render(<WorkflowPanel />)
    fireEvent.change(screen.getByTestId("feature-gap-competitor-url"), {
      target: { value: "https://rival.com" },
    })
    const btn = screen.getByTestId("feature-gap-run-btn") as HTMLButtonElement
    expect(btn.disabled).toBe(false)
  })

  it("calls the correct API route", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        brief: {
          competitorName: "Rival", featureName: "AI Chat", whatItDoes: "Chat.",
          gap: "Missing.", whyItMatters: "Big.", suggestedAction: "Build.", confidence: "high",
          sourceUrl: "https://rival.com",
        },
        telegramSent: false,
        slackSent: false,
      }),
    })
    vi.stubGlobal("fetch", mockFetch)

    render(<WorkflowPanel />)
    fireEvent.change(screen.getByTestId("feature-gap-competitor-url"), {
      target: { value: "https://rival.com" },
    })
    fireEvent.click(screen.getByTestId("feature-gap-run-btn"))

    await waitFor(() => { expect(mockFetch).toHaveBeenCalledOnce() })

    const [url] = mockFetch.mock.calls[0] as [string]
    expect(url).toContain("/api/workflows/feature-gap")
  })

  it("shows brief preview after successful run", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        brief: {
          competitorName: "Rival", featureName: "AI Chat", whatItDoes: "Chat.",
          gap: "Missing.", whyItMatters: "Big.", suggestedAction: "Build.", confidence: "high",
          sourceUrl: "https://rival.com",
        },
        telegramSent: false,
        slackSent: false,
      }),
    })
    vi.stubGlobal("fetch", mockFetch)

    render(<WorkflowPanel />)
    fireEvent.change(screen.getByTestId("feature-gap-competitor-url"), {
      target: { value: "https://rival.com" },
    })
    fireEvent.click(screen.getByTestId("feature-gap-run-btn"))

    await waitFor(() => {
      expect(screen.getByTestId("brief-preview")).toBeDefined()
    })
  })

  it("shows error message on API failure", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Scraping failed" }),
    })
    vi.stubGlobal("fetch", mockFetch)

    render(<WorkflowPanel />)
    fireEvent.change(screen.getByTestId("feature-gap-competitor-url"), {
      target: { value: "https://rival.com" },
    })
    fireEvent.click(screen.getByTestId("feature-gap-run-btn"))

    await waitFor(() => {
      expect(screen.getByText("Scraping failed")).toBeDefined()
    })
  })

  it("shows error message on network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")))

    render(<WorkflowPanel />)
    fireEvent.change(screen.getByTestId("feature-gap-competitor-url"), {
      target: { value: "https://rival.com" },
    })
    fireEvent.click(screen.getByTestId("feature-gap-run-btn"))

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeDefined()
    })
  })
})

// ─── Dev Ticket Tab ───────────────────────────────────────────────────────────

describe("WorkflowPanel — Dev Ticket tab", () => {
  afterEach(() => { vi.unstubAllGlobals() })

  it("renders dev ticket tab content when selected", async () => {
    render(<WorkflowPanel />)
    fireEvent.click(screen.getByText("Dev Ticket"))
    await waitFor(() => expect(screen.getByTestId("dev-ticket-tab")).toBeDefined())
  })

  it("shows dev ticket inputs", async () => {
    render(<WorkflowPanel />)
    fireEvent.click(screen.getByText("Dev Ticket"))
    await waitFor(() => expect(screen.getByTestId("dev-ticket-feature-name")).toBeDefined())
    expect(screen.getByTestId("dev-ticket-competitor-name")).toBeDefined()
    expect(screen.getByTestId("dev-ticket-source-url")).toBeDefined()
  })

  it("run button is disabled when required fields are empty", async () => {
    render(<WorkflowPanel />)
    fireEvent.click(screen.getByText("Dev Ticket"))
    await waitFor(() => expect(screen.getByTestId("dev-ticket-run-btn")).toBeDefined())
    const btn = screen.getByTestId("dev-ticket-run-btn") as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it("calls dev-ticket API route", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ slackSent: false }),
    })
    vi.stubGlobal("fetch", mockFetch)

    render(<WorkflowPanel />)
    fireEvent.click(screen.getByText("Dev Ticket"))
    await waitFor(() => expect(screen.getByTestId("dev-ticket-feature-name")).toBeDefined())

    fireEvent.change(screen.getByTestId("dev-ticket-feature-name"), {
      target: { value: "AI Chat" },
    })
    fireEvent.change(screen.getByTestId("dev-ticket-competitor-name"), {
      target: { value: "Rival Corp" },
    })
    fireEvent.change(screen.getByTestId("dev-ticket-source-url"), {
      target: { value: "https://rival.com" },
    })
    fireEvent.click(screen.getByTestId("dev-ticket-run-btn"))

    await waitFor(() => { expect(mockFetch).toHaveBeenCalledOnce() })
    const [url] = mockFetch.mock.calls[0] as [string]
    expect(url).toContain("/api/workflows/dev-ticket")
  })
})

// ─── Pricing Response Tab ─────────────────────────────────────────────────────

describe("WorkflowPanel — Pricing Response tab", () => {
  afterEach(() => { vi.unstubAllGlobals() })

  it("renders pricing response inputs", async () => {
    render(<WorkflowPanel />)
    fireEvent.click(screen.getByText("Pricing Response"))
    await waitFor(() => expect(screen.getByTestId("pricing-response-competitor-url")).toBeDefined())
    expect(screen.getByTestId("pricing-response-user-url")).toBeDefined()
  })

  it("calls pricing-response API route", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        brief: {
          competitorName: "Rival", changeDetected: "Price drop", theirPricing: "$29",
          yourPositioning: "review", suggestedResponse: "Highlight value", urgency: "medium",
          sourceUrl: "https://rival.com",
        },
        telegramSent: false,
        slackSent: false,
      }),
    })
    vi.stubGlobal("fetch", mockFetch)

    render(<WorkflowPanel />)
    fireEvent.click(screen.getByText("Pricing Response"))
    await waitFor(() => expect(screen.getByTestId("pricing-response-competitor-url")).toBeDefined())

    fireEvent.change(screen.getByTestId("pricing-response-competitor-url"), {
      target: { value: "https://rival.com/pricing" },
    })
    fireEvent.click(screen.getByTestId("pricing-response-run-btn"))

    await waitFor(() => { expect(mockFetch).toHaveBeenCalledOnce() })
    const [url] = mockFetch.mock.calls[0] as [string]
    expect(url).toContain("/api/workflows/pricing-response")
  })
})

// ─── Prospect Brief Tab ───────────────────────────────────────────────────────

describe("WorkflowPanel — Prospect Brief tab", () => {
  afterEach(() => { vi.unstubAllGlobals() })

  it("renders prospect URL input", async () => {
    render(<WorkflowPanel />)
    fireEvent.click(screen.getByText("Prospect Brief"))
    await waitFor(() => expect(screen.getByTestId("prospect-brief-url")).toBeDefined())
  })

  it("calls prospect-enrichment API route", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        brief: {
          companyName: "TechFlow", description: "desc", icpFit: "high",
          keySignals: ["sig1", "sig2"], outreachAngle: "angle", confidence: "high",
          sourceUrl: "https://techflow.com",
        },
        telegramSent: false,
        slackSent: false,
      }),
    })
    vi.stubGlobal("fetch", mockFetch)

    render(<WorkflowPanel />)
    fireEvent.click(screen.getByText("Prospect Brief"))
    await waitFor(() => expect(screen.getByTestId("prospect-brief-url")).toBeDefined())

    fireEvent.change(screen.getByTestId("prospect-brief-url"), {
      target: { value: "https://techflow.com" },
    })
    fireEvent.click(screen.getByTestId("prospect-brief-run-btn"))

    await waitFor(() => { expect(mockFetch).toHaveBeenCalledOnce() })
    const [url] = mockFetch.mock.calls[0] as [string]
    expect(url).toContain("/api/workflows/prospect-enrichment")
  })
})

// ─── Funding Alert Tab ────────────────────────────────────────────────────────

describe("WorkflowPanel — Funding Alert tab", () => {
  afterEach(() => { vi.unstubAllGlobals() })

  it("renders funding URL input", async () => {
    render(<WorkflowPanel />)
    fireEvent.click(screen.getByText("Funding Alert"))
    await waitFor(() => expect(screen.getByTestId("funding-alert-url")).toBeDefined())
  })

  it("calls funding-alert API route", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        brief: {
          programName: "Startup India", provider: "DPIIT", deadline: "2026-05-20",
          isUrgent: true, eligibility: "DPIIT registered", fitReason: "Great match",
          applyUrl: "https://grants.gov",
        },
        telegramSent: false,
      }),
    })
    vi.stubGlobal("fetch", mockFetch)

    render(<WorkflowPanel />)
    fireEvent.click(screen.getByText("Funding Alert"))
    await waitFor(() => expect(screen.getByTestId("funding-alert-url")).toBeDefined())

    fireEvent.change(screen.getByTestId("funding-alert-url"), {
      target: { value: "https://grants.gov" },
    })
    fireEvent.click(screen.getByTestId("funding-alert-run-btn"))

    await waitFor(() => { expect(mockFetch).toHaveBeenCalledOnce() })
    const [url] = mockFetch.mock.calls[0] as [string]
    expect(url).toContain("/api/workflows/funding-alert")
  })
})

// ─── Pricing Update Tab ───────────────────────────────────────────────────────

describe("WorkflowPanel — Pricing Update tab", () => {
  afterEach(() => { vi.unstubAllGlobals() })

  it("renders pricing update inputs", async () => {
    render(<WorkflowPanel />)
    fireEvent.click(screen.getByText("Pricing Update"))
    await waitFor(() => expect(screen.getByTestId("pricing-update-price")).toBeDefined())
    expect(screen.getByTestId("pricing-update-reason")).toBeDefined()
  })

  it("shows approval warning", async () => {
    render(<WorkflowPanel />)
    fireEvent.click(screen.getByText("Pricing Update"))
    await waitFor(() => expect(screen.getByText(/requires explicit approval/i)).toBeDefined())
  })

  it("preview button calls API with approved=false", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        variantId: "var-123",
        oldPriceCents: 2900,
        newPriceCents: 4900,
        applied: false,
        previewOnly: true,
        reason: "test",
      }),
    })
    vi.stubGlobal("fetch", mockFetch)

    render(<WorkflowPanel />)
    fireEvent.click(screen.getByText("Pricing Update"))
    await waitFor(() => expect(screen.getByTestId("pricing-update-price")).toBeDefined())

    fireEvent.change(screen.getByTestId("pricing-update-price"), { target: { value: "49" } })
    fireEvent.click(screen.getByTestId("pricing-update-preview-btn"))

    await waitFor(() => { expect(mockFetch).toHaveBeenCalledOnce() })

    const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toContain("/api/workflows/update-pricing")
    const body = JSON.parse(opts.body as string) as { approved: boolean; newPriceCents: number }
    expect(body.approved).toBe(false)
    expect(body.newPriceCents).toBe(4900)
  })

  it("shows Confirm & Execute button after preview", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        variantId: "var-123", oldPriceCents: 2900, newPriceCents: 4900,
        applied: false, previewOnly: true, reason: "test",
      }),
    })
    vi.stubGlobal("fetch", mockFetch)

    render(<WorkflowPanel />)
    fireEvent.click(screen.getByText("Pricing Update"))
    await waitFor(() => expect(screen.getByTestId("pricing-update-price")).toBeDefined())

    fireEvent.change(screen.getByTestId("pricing-update-price"), { target: { value: "49" } })
    fireEvent.click(screen.getByTestId("pricing-update-preview-btn"))

    await waitFor(() => {
      expect(screen.getByTestId("pricing-update-confirm-btn")).toBeDefined()
    })
  })

  it("Confirm & Execute calls API with approved=true", async () => {
    let callCount = 0
    const mockFetch = vi.fn().mockImplementation(async () => {
      callCount++
      return {
        ok: true,
        json: async () => ({
          variantId: "var-123", oldPriceCents: 2900, newPriceCents: 4900,
          applied: callCount >= 2, previewOnly: callCount < 2, reason: "test",
        }),
      }
    })
    vi.stubGlobal("fetch", mockFetch)

    render(<WorkflowPanel />)
    fireEvent.click(screen.getByText("Pricing Update"))
    await waitFor(() => expect(screen.getByTestId("pricing-update-price")).toBeDefined())

    fireEvent.change(screen.getByTestId("pricing-update-price"), { target: { value: "49" } })
    fireEvent.click(screen.getByTestId("pricing-update-preview-btn"))

    await waitFor(() => {
      expect(screen.getByTestId("pricing-update-confirm-btn")).toBeDefined()
    })

    fireEvent.click(screen.getByTestId("pricing-update-confirm-btn"))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    const [, opts] = mockFetch.mock.calls[1] as [string, RequestInit]
    const body = JSON.parse(opts.body as string) as { approved: boolean }
    expect(body.approved).toBe(true)
  })
})
