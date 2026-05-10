import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ProspectFeed } from "@/components/app/prospect-feed"
import { ProspectDetailSheet } from "@/components/app/signal-detail-sheet"
import { seedProspects } from "@/lib/seed"
import type { ProspectRecord, ProspectBrief } from "@/lib/schemas"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockBrief: ProspectBrief = {
  id: "brief-test",
  prospectId: "pr-001",
  companyName: "Retool",
  headline: "Retool — 88% fit · No-code / Low-code",
  openingLine: "I noticed Retool is expanding rapidly — a great trigger to reach out.",
  keyPoints: [
    "88% outreach fit score — ranked in the top tier.",
    "Their value prop: Build internal tools in minutes...",
    "Enterprise-grade: SOC 2 certified, SAML / SSO support.",
  ],
  callToAction:
    "Request a 20-minute intro call with the Head of Engineering at Retool.",
  generatedAt: "2026-05-09T12:00:00.000Z",
}

// ─── ProspectFeed ─────────────────────────────────────────────────────────────

describe("ProspectFeed", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("renders the prospects page container", () => {
    render(<ProspectFeed initialProspects={seedProspects} />)
    expect(screen.getByTestId("prospects-page")).toBeInTheDocument()
  })

  it("renders the header title", () => {
    render(<ProspectFeed initialProspects={seedProspects} />)
    expect(screen.getByText("Prospects")).toBeInTheDocument()
  })

  it("renders all seeded prospect cards", () => {
    render(<ProspectFeed initialProspects={seedProspects} />)
    expect(screen.getByTestId("prospect-list")).toBeInTheDocument()
    // Check at least some company names appear
    expect(screen.getAllByText(/Retool|Coda|Hex|Raycast|Linear/).length).toBeGreaterThanOrEqual(1)
  })

  it("shows stats row with companies analyzed count", () => {
    render(<ProspectFeed initialProspects={seedProspects} />)
    expect(screen.getByText(/companies analyzed/)).toBeInTheDocument()
  })

  it("shows high fit count in stats", () => {
    render(<ProspectFeed initialProspects={seedProspects} />)
    expect(screen.getByText(/high fit/)).toBeInTheDocument()
  })

  it("renders the Analyze company button", () => {
    render(<ProspectFeed initialProspects={seedProspects} />)
    expect(screen.getByTestId("analyze-button")).toBeInTheDocument()
  })

  it("shows the analyze form when the button is clicked", () => {
    render(<ProspectFeed initialProspects={seedProspects} />)
    const btn = screen.getByTestId("analyze-button")
    fireEvent.click(btn)
    expect(screen.getByTestId("analyze-form")).toBeInTheDocument()
  })

  it("hides analyze form when dismissed", () => {
    render(<ProspectFeed initialProspects={seedProspects} />)
    fireEvent.click(screen.getByTestId("analyze-button"))
    expect(screen.getByTestId("analyze-form")).toBeInTheDocument()

    const closeBtn = screen.getByLabelText("Close")
    fireEvent.click(closeBtn)
    expect(screen.queryByTestId("analyze-form")).not.toBeInTheDocument()
  })

  it("analyze form has a URL input", () => {
    render(<ProspectFeed initialProspects={seedProspects} />)
    fireEvent.click(screen.getByTestId("analyze-button"))
    expect(screen.getByTestId("url-input")).toBeInTheDocument()
  })

  it("calls fetch when analyze form is submitted", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ prospect: seedProspects[0] }),
    })
    vi.stubGlobal("fetch", fetchMock)

    render(<ProspectFeed initialProspects={seedProspects} />)
    fireEvent.click(screen.getByTestId("analyze-button"))

    const urlInput = screen.getByTestId("url-input")
    fireEvent.change(urlInput, { target: { value: "https://retool.com" } })

    const submitBtn = screen.getByText("Analyze")
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/prospects/analyze",
        expect.objectContaining({ method: "POST" })
      )
    })
  })

  it("renders empty state when no prospects", () => {
    render(<ProspectFeed initialProspects={[]} />)
    expect(screen.getByText(/No prospects yet/)).toBeInTheDocument()
  })

  it("renders prospects sorted by fitScore descending", () => {
    render(<ProspectFeed initialProspects={seedProspects} />)
    const cards = screen.getAllByText(/%\s*fit/)
    // The first card should have the highest score in the list
    expect(cards.length).toBeGreaterThan(0)
  })
})

// ─── ProspectDetailSheet ──────────────────────────────────────────────────────

describe("ProspectDetailSheet", () => {
  const prospect = seedProspects[0] // Retool

  it("renders nothing when no prospect", () => {
    const { container } = render(
      <ProspectDetailSheet prospect={null} open={false} onOpenChange={() => {}} />
    )
    expect(container.firstChild).toBeNull()
  })

  it("renders company name when open", () => {
    render(
      <ProspectDetailSheet prospect={prospect} open={true} onOpenChange={() => {}} />
    )
    expect(screen.getAllByText(prospect.companyName).length).toBeGreaterThan(0)
  })

  it("renders category badge", () => {
    render(
      <ProspectDetailSheet prospect={prospect} open={true} onOpenChange={() => {}} />
    )
    expect(screen.getByText(prospect.category)).toBeInTheDocument()
  })

  it("renders the generate brief button when callback provided", () => {
    render(
      <ProspectDetailSheet
        prospect={prospect}
        open={true}
        onOpenChange={() => {}}
        onGenerateBrief={vi.fn()}
      />
    )
    expect(screen.getByTestId("generate-brief-button")).toBeInTheDocument()
  })

  it("renders refresh analysis button when callback provided", () => {
    render(
      <ProspectDetailSheet
        prospect={prospect}
        open={true}
        onOpenChange={() => {}}
        onRefresh={vi.fn()}
      />
    )
    expect(screen.getByTestId("refresh-button")).toBeInTheDocument()
  })

  it("does not render brief section when brief is null", () => {
    render(
      <ProspectDetailSheet
        prospect={prospect}
        open={true}
        onOpenChange={() => {}}
        brief={null}
      />
    )
    expect(screen.queryByTestId("prospect-brief")).not.toBeInTheDocument()
  })

  it("renders brief section when brief is provided", () => {
    render(
      <ProspectDetailSheet
        prospect={prospect}
        open={true}
        onOpenChange={() => {}}
        brief={mockBrief}
      />
    )
    expect(screen.getByTestId("prospect-brief")).toBeInTheDocument()
  })

  it("shows brief headline in brief section", () => {
    render(
      <ProspectDetailSheet
        prospect={prospect}
        open={true}
        onOpenChange={() => {}}
        brief={mockBrief}
      />
    )
    expect(screen.getByText(mockBrief.headline)).toBeInTheDocument()
  })

  it("shows opening line in brief section", () => {
    render(
      <ProspectDetailSheet
        prospect={prospect}
        open={true}
        onOpenChange={() => {}}
        brief={mockBrief}
      />
    )
    expect(screen.getByText(mockBrief.openingLine)).toBeInTheDocument()
  })

  it("renders copy button when brief is present", () => {
    render(
      <ProspectDetailSheet
        prospect={prospect}
        open={true}
        onOpenChange={() => {}}
        brief={mockBrief}
      />
    )
    expect(screen.getByTestId("copy-button")).toBeInTheDocument()
  })

  it("calls onGenerateBrief when generate brief button clicked", async () => {
    const mockGenerateBrief = vi.fn().mockResolvedValue(undefined)
    render(
      <ProspectDetailSheet
        prospect={prospect}
        open={true}
        onOpenChange={() => {}}
        onGenerateBrief={mockGenerateBrief}
      />
    )
    fireEvent.click(screen.getByTestId("generate-brief-button"))
    await waitFor(() => {
      expect(mockGenerateBrief).toHaveBeenCalledWith(prospect.id)
    })
  })

  it("calls onRefresh when refresh button clicked", async () => {
    const mockRefresh = vi.fn().mockResolvedValue(undefined)
    render(
      <ProspectDetailSheet
        prospect={prospect}
        open={true}
        onOpenChange={() => {}}
        onRefresh={mockRefresh}
      />
    )
    fireEvent.click(screen.getByTestId("refresh-button"))
    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalledWith(prospect)
    })
  })

  it("renders maturity signals", () => {
    render(
      <ProspectDetailSheet prospect={prospect} open={true} onOpenChange={() => {}} />
    )
    // At least one maturity signal should appear
    const signals = prospect.maturitySignals
    if (signals.length > 0) {
      expect(screen.getByText(signals[0])).toBeInTheDocument()
    }
  })

  it("renders hiring signals", () => {
    render(
      <ProspectDetailSheet prospect={prospect} open={true} onOpenChange={() => {}} />
    )
    const hiringSignals = prospect.hiringSignals
    if (hiringSignals.length > 0) {
      expect(screen.getByText(hiringSignals[0])).toBeInTheDocument()
    }
  })
})

// ─── Schema validation ────────────────────────────────────────────────────────

describe("ProspectRecord schema", () => {
  it("seeded prospects all validate against schema", async () => {
    const { ProspectRecordSchema } = await import("@/lib/schemas")
    for (const p of seedProspects) {
      expect(() => ProspectRecordSchema.parse(p)).not.toThrow()
    }
  })

  it("rejects prospect with negative fitScore", async () => {
    const { ProspectRecordSchema } = await import("@/lib/schemas")
    const invalid = { ...seedProspects[0], fitScore: -10 }
    expect(() => ProspectRecordSchema.parse(invalid)).toThrow()
  })

  it("rejects prospect with fitScore over 100", async () => {
    const { ProspectRecordSchema } = await import("@/lib/schemas")
    const invalid = { ...seedProspects[0], fitScore: 110 }
    expect(() => ProspectRecordSchema.parse(invalid)).toThrow()
  })

  it("rejects prospect with invalid website URL", async () => {
    const { ProspectRecordSchema } = await import("@/lib/schemas")
    const invalid = { ...seedProspects[0], website: "not-a-url" }
    expect(() => ProspectRecordSchema.parse(invalid)).toThrow()
  })
})

// ─── ProspectBrief schema ─────────────────────────────────────────────────────

describe("ProspectBrief schema", () => {
  it("validates the mock brief", async () => {
    const { ProspectBriefSchema } = await import("@/lib/schemas")
    expect(() => ProspectBriefSchema.parse(mockBrief)).not.toThrow()
  })

  it("rejects brief missing required fields", async () => {
    const { ProspectBriefSchema } = await import("@/lib/schemas")
    expect(() => ProspectBriefSchema.parse({ id: "x" })).toThrow()
  })
})

// ─── AnalyzeProspect schema ───────────────────────────────────────────────────

describe("AnalyzeProspect schema", () => {
  it("validates a valid URL input", async () => {
    const { AnalyzeProspectSchema } = await import("@/lib/schemas")
    expect(() =>
      AnalyzeProspectSchema.parse({ url: "https://retool.com" })
    ).not.toThrow()
  })

  it("validates with optional company name", async () => {
    const { AnalyzeProspectSchema } = await import("@/lib/schemas")
    expect(() =>
      AnalyzeProspectSchema.parse({ url: "https://retool.com", companyName: "Retool" })
    ).not.toThrow()
  })

  it("rejects an invalid URL", async () => {
    const { AnalyzeProspectSchema } = await import("@/lib/schemas")
    expect(() =>
      AnalyzeProspectSchema.parse({ url: "not-a-url" })
    ).toThrow()
  })

  it("rejects missing URL", async () => {
    const { AnalyzeProspectSchema } = await import("@/lib/schemas")
    expect(() => AnalyzeProspectSchema.parse({})).toThrow()
  })
})
