/**
 * UI tests for the redesigned WorkflowPanel — single URL input, single button.
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

// ─── Mock data helpers ────────────────────────────────────────────────────────

const mockCompetitorResult = {
  detectedType: "competitor",
  workflows: ["feature_gap", "pricing_response"],
  briefs: [
    {
      competitorName: "Rival Inc",
      featureName: "AI Chat",
      whatItDoes: "Instant answers",
      gap: "You lack this",
      whyItMatters: "Big deal",
      suggestedAction: "Build it",
      confidence: "high",
      sourceUrl: "https://rival.com",
    },
    {
      competitorName: "Rival Inc",
      changeDetected: "Price drop",
      theirPricing: "$29/mo",
      yourPositioning: "review",
      suggestedResponse: "Highlight value",
      urgency: "medium",
      sourceUrl: "https://rival.com",
    },
  ],
  deliveries: {
    telegram: { sent: true, timestamp: "2026-05-10T08:00:00.000Z" },
    slack: { sent: true, channel: "#founder-os-alerts", timestamp: "2026-05-10T08:00:00.000Z" },
  },
  devTicketAvailable: true,
  devTicketData: {
    featureName: "AI Chat",
    competitorName: "Rival Inc",
    description: "You lack this",
    whyNow: "Big deal",
    suggestedImplementation: "Build it",
    confidence: "high",
    sourceUrl: "https://rival.com",
  },
}

const mockProspectResult = {
  detectedType: "prospect",
  workflows: ["prospect_enrichment"],
  briefs: [
    {
      companyName: "TechFlow Inc",
      description: "Workflow automation tools",
      icpFit: "high",
      keySignals: ["Hiring engineers", "EU expansion", "AI integration"],
      outreachAngle: "Lead with AI pipeline",
      confidence: "high",
      sourceUrl: "https://techflow.com",
    },
  ],
  deliveries: {
    telegram: { sent: true, timestamp: "2026-05-10T08:00:00.000Z" },
    slack: { sent: false },
  },
  devTicketAvailable: false,
}

const mockFundingResult = {
  detectedType: "funding",
  workflows: ["funding_alert"],
  briefs: [
    {
      programName: "Startup India Seed Fund",
      provider: "DPIIT",
      deadline: "2026-05-20",
      isUrgent: true,
      eligibility: "DPIIT registered, <2 years",
      fitReason: "AI/data tools match",
      applyUrl: "https://grants.gov",
    },
  ],
  deliveries: {
    telegram: { sent: true, timestamp: "2026-05-10T08:00:00.000Z" },
    slack: { sent: false },
  },
  devTicketAvailable: false,
}

// ─── Render ───────────────────────────────────────────────────────────────────

describe("WorkflowPanel — render", () => {
  it("renders the panel with test id", () => {
    render(<WorkflowPanel />)
    expect(screen.getByTestId("workflow-panel")).toBeDefined()
  })

  it("renders a single main URL input", () => {
    render(<WorkflowPanel />)
    expect(screen.getByTestId("main-url-input")).toBeDefined()
  })

  it("renders the single Analyze & Run button", () => {
    render(<WorkflowPanel />)
    expect(screen.getByTestId("run-button")).toBeDefined()
    expect(screen.getByTestId("run-button").textContent).toContain("Analyze & Run")
  })

  it("does NOT render any workflow type tabs", () => {
    render(<WorkflowPanel />)
    expect(screen.queryByText("Feature Gap")).toBeNull()
    expect(screen.queryByText("Dev Ticket")).toBeNull()
    expect(screen.queryByText("Pricing Response")).toBeNull()
    expect(screen.queryByText("Prospect Brief")).toBeNull()
    expect(screen.queryByText("Funding Alert")).toBeNull()
  })

  it("does NOT render Pricing Update tab", () => {
    render(<WorkflowPanel />)
    expect(screen.queryByText("Pricing Update")).toBeNull()
    expect(screen.queryByText(/lemon squeezy/i)).toBeNull()
  })

  it("run button is disabled when URL is empty", () => {
    render(<WorkflowPanel />)
    const btn = screen.getByTestId("run-button") as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it("run button is enabled when URL is filled", () => {
    render(<WorkflowPanel />)
    fireEvent.change(screen.getByTestId("main-url-input"), {
      target: { value: "https://rival.com" },
    })
    const btn = screen.getByTestId("run-button") as HTMLButtonElement
    expect(btn.disabled).toBe(false)
  })

  it("optional user site URL field is hidden by default", () => {
    render(<WorkflowPanel />)
    expect(screen.queryByTestId("user-site-url-input")).toBeNull()
  })

  it("optional user site URL appears after toggle", () => {
    render(<WorkflowPanel />)
    fireEvent.click(screen.getByTestId("toggle-user-site"))
    expect(screen.getByTestId("user-site-url-input")).toBeDefined()
  })
})

// ─── Status steps ─────────────────────────────────────────────────────────────

describe("WorkflowPanel — status steps", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it("shows status steps after clicking run", async () => {
    let resolveFetch!: (v: Response) => void
    const pendingFetch = new Promise<Response>((res) => { resolveFetch = res })
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(pendingFetch))

    render(<WorkflowPanel />)
    fireEvent.change(screen.getByTestId("main-url-input"), {
      target: { value: "https://rival.com" },
    })
    fireEvent.click(screen.getByTestId("run-button"))

    await waitFor(() => {
      expect(screen.getByTestId("status-steps")).toBeDefined()
    })

    // Resolve so the component doesn't hang
    resolveFetch(new Response(JSON.stringify(mockCompetitorResult), { status: 200 }))
  })

  it("step 0 is active initially during run", async () => {
    let resolveFetch!: (v: Response) => void
    const pendingFetch = new Promise<Response>((res) => { resolveFetch = res })
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(pendingFetch))

    render(<WorkflowPanel />)
    fireEvent.change(screen.getByTestId("main-url-input"), {
      target: { value: "https://rival.com" },
    })
    fireEvent.click(screen.getByTestId("run-button"))

    await waitFor(() => expect(screen.getByTestId("step-0")).toBeDefined())
    const step0 = screen.getByTestId("step-0")
    expect(step0.textContent).toContain("Scraping URL")

    resolveFetch(new Response(JSON.stringify(mockCompetitorResult), { status: 200 }))
  })
})

// ─── Competitor URL flow ──────────────────────────────────────────────────────

describe("WorkflowPanel — competitor URL flow", () => {
  afterEach(() => { vi.unstubAllGlobals() })

  it("calls /api/workflows/run with the provided URL", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockCompetitorResult,
    })
    vi.stubGlobal("fetch", mockFetch)

    render(<WorkflowPanel />)
    fireEvent.change(screen.getByTestId("main-url-input"), {
      target: { value: "https://rival.com" },
    })
    fireEvent.click(screen.getByTestId("run-button"))

    await waitFor(() => expect(mockFetch).toHaveBeenCalledOnce())
    const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toContain("/api/workflows/run")
    const body = JSON.parse(opts.body as string) as { url: string }
    expect(body.url).toBe("https://rival.com")
  })

  it("includes userSiteUrl in the request when provided", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockCompetitorResult,
    })
    vi.stubGlobal("fetch", mockFetch)

    render(<WorkflowPanel />)
    fireEvent.change(screen.getByTestId("main-url-input"), {
      target: { value: "https://rival.com" },
    })
    fireEvent.click(screen.getByTestId("toggle-user-site"))
    fireEvent.change(screen.getByTestId("user-site-url-input"), {
      target: { value: "https://mysite.com" },
    })
    fireEvent.click(screen.getByTestId("run-button"))

    await waitFor(() => expect(mockFetch).toHaveBeenCalledOnce())
    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit]
    const body = JSON.parse(opts.body as string) as { url: string; userSiteUrl: string }
    expect(body.userSiteUrl).toBe("https://mysite.com")
  })

  it("renders result card after successful competitor run", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockCompetitorResult,
    }))

    render(<WorkflowPanel />)
    fireEvent.change(screen.getByTestId("main-url-input"), {
      target: { value: "https://rival.com" },
    })
    fireEvent.click(screen.getByTestId("run-button"))

    await waitFor(() => expect(screen.getByTestId("result-card")).toBeDefined())
  })

  it("shows detected type badge as Competitor", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockCompetitorResult,
    }))

    render(<WorkflowPanel />)
    fireEvent.change(screen.getByTestId("main-url-input"), {
      target: { value: "https://rival.com" },
    })
    fireEvent.click(screen.getByTestId("run-button"))

    await waitFor(() => {
      const badge = screen.getByTestId("detected-type-badge")
      expect(badge.textContent).toContain("Competitor")
    })
  })

  it("shows dev ticket button for competitor result", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockCompetitorResult,
    }))

    render(<WorkflowPanel />)
    fireEvent.change(screen.getByTestId("main-url-input"), {
      target: { value: "https://rival.com" },
    })
    fireEvent.click(screen.getByTestId("run-button"))

    await waitFor(() => {
      expect(screen.getByTestId("create-dev-ticket-btn")).toBeDefined()
    })
  })

  it("dev ticket button calls /api/workflows/dev-ticket", async () => {
    let callCount = 0
    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      callCount++
      if (callCount === 1) {
        return { ok: true, json: async () => mockCompetitorResult }
      }
      return { ok: true, json: async () => ({ slackSent: true }) }
    })
    vi.stubGlobal("fetch", mockFetch)

    render(<WorkflowPanel />)
    fireEvent.change(screen.getByTestId("main-url-input"), {
      target: { value: "https://rival.com" },
    })
    fireEvent.click(screen.getByTestId("run-button"))

    await waitFor(() => screen.getByTestId("create-dev-ticket-btn"))
    fireEvent.click(screen.getByTestId("create-dev-ticket-btn"))

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2))
    const secondCall = mockFetch.mock.calls[1] as [string, RequestInit]
    expect(secondCall[0]).toContain("/api/workflows/dev-ticket")
  })
})

// ─── Prospect URL flow ────────────────────────────────────────────────────────

describe("WorkflowPanel — prospect URL flow", () => {
  afterEach(() => { vi.unstubAllGlobals() })

  it("renders result card with prospect type after prospect run", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockProspectResult,
    }))

    render(<WorkflowPanel />)
    fireEvent.change(screen.getByTestId("main-url-input"), {
      target: { value: "https://techflow.com" },
    })
    fireEvent.click(screen.getByTestId("run-button"))

    await waitFor(() => {
      const badge = screen.getByTestId("detected-type-badge")
      expect(badge.textContent).toContain("Sales Prospect")
    })
  })

  it("does NOT show dev ticket button for prospect result", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockProspectResult,
    }))

    render(<WorkflowPanel />)
    fireEvent.change(screen.getByTestId("main-url-input"), {
      target: { value: "https://techflow.com" },
    })
    fireEvent.click(screen.getByTestId("run-button"))

    await waitFor(() => screen.getByTestId("result-card"))
    expect(screen.queryByTestId("create-dev-ticket-btn")).toBeNull()
  })
})

// ─── Funding URL flow ─────────────────────────────────────────────────────────

describe("WorkflowPanel — funding URL flow", () => {
  afterEach(() => { vi.unstubAllGlobals() })

  it("renders result card with funding type after funding run", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockFundingResult,
    }))

    render(<WorkflowPanel />)
    fireEvent.change(screen.getByTestId("main-url-input"), {
      target: { value: "https://grants.gov/startup" },
    })
    fireEvent.click(screen.getByTestId("run-button"))

    await waitFor(() => {
      const badge = screen.getByTestId("detected-type-badge")
      expect(badge.textContent).toContain("Funding")
    })
  })

  it("does NOT show dev ticket button for funding result", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockFundingResult,
    }))

    render(<WorkflowPanel />)
    fireEvent.change(screen.getByTestId("main-url-input"), {
      target: { value: "https://grants.gov/startup" },
    })
    fireEvent.click(screen.getByTestId("run-button"))

    await waitFor(() => screen.getByTestId("result-card"))
    expect(screen.queryByTestId("create-dev-ticket-btn")).toBeNull()
  })
})

// ─── Error handling ───────────────────────────────────────────────────────────

describe("WorkflowPanel — error handling", () => {
  afterEach(() => { vi.unstubAllGlobals() })

  it("shows error message on API failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Scraping failed" }),
    }))

    render(<WorkflowPanel />)
    fireEvent.change(screen.getByTestId("main-url-input"), {
      target: { value: "https://rival.com" },
    })
    fireEvent.click(screen.getByTestId("run-button"))

    await waitFor(() => {
      expect(screen.getByText("Scraping failed")).toBeDefined()
    })
  })

  it("shows error message on network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")))

    render(<WorkflowPanel />)
    fireEvent.change(screen.getByTestId("main-url-input"), {
      target: { value: "https://rival.com" },
    })
    fireEvent.click(screen.getByTestId("run-button"))

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeDefined()
    })
  })
})

// ─── Delivery badges ──────────────────────────────────────────────────────────

describe("WorkflowPanel — delivery badges", () => {
  afterEach(() => { vi.unstubAllGlobals() })

  it("shows Telegram sent badge when telegram.sent is true", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockCompetitorResult,
    }))

    render(<WorkflowPanel />)
    fireEvent.change(screen.getByTestId("main-url-input"), {
      target: { value: "https://rival.com" },
    })
    fireEvent.click(screen.getByTestId("run-button"))

    await waitFor(() => screen.getByTestId("result-card"))
    const telegramBadges = screen.getAllByText(/telegram/i)
    expect(telegramBadges.length).toBeGreaterThan(0)
  })

  it("shows Slack channel badge when slack.sent is true", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockCompetitorResult,
    }))

    render(<WorkflowPanel />)
    fireEvent.change(screen.getByTestId("main-url-input"), {
      target: { value: "https://rival.com" },
    })
    fireEvent.click(screen.getByTestId("run-button"))

    await waitFor(() => screen.getByTestId("result-card"))
    const slackBadges = screen.getAllByText(/founder-os-alerts/i)
    expect(slackBadges.length).toBeGreaterThan(0)
  })
})

// ─── Pricing Update is gone ───────────────────────────────────────────────────

describe("WorkflowPanel — Pricing Update removal", () => {
  it("never renders any Lemon Squeezy reference", () => {
    render(<WorkflowPanel />)
    expect(screen.queryByText(/lemon squeezy/i)).toBeNull()
    expect(screen.queryByTestId("pricing-update-price")).toBeNull()
    expect(screen.queryByTestId("pricing-update-reason")).toBeNull()
    expect(screen.queryByTestId("pricing-update-confirm-btn")).toBeNull()
  })

  it("never renders the Pricing Update tab", () => {
    render(<WorkflowPanel />)
    expect(screen.queryByText("Pricing Update")).toBeNull()
  })
})
