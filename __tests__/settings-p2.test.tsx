import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { SourceManager } from "@/components/app/source-manager"
import type { Source } from "@/lib/schemas"

// ─── Mock fetch ───────────────────────────────────────────────────────────────

const mockSources: Source[] = [
  {
    id: "src-001",
    type: "url",
    label: "Linear Pricing Page",
    url: "https://linear.app/pricing",
    tags: ["pricing"],
    module: "competitors",
    createdAt: "2026-05-01T09:00:00.000Z",
    updatedAt: "2026-05-09T08:00:00.000Z",
  },
  {
    id: "src-002",
    type: "url",
    label: "Retool Website",
    url: "https://retool.com",
    tags: ["prospect"],
    module: "prospects",
    createdAt: "2026-05-03T11:00:00.000Z",
    updatedAt: "2026-05-09T09:00:00.000Z",
  },
]

function setupFetchMock(overrides?: Partial<Record<string, () => Response>>) {
  const handlers: Record<string, () => Response> = {
    "/api/sources": () =>
      new Response(JSON.stringify({ sources: mockSources }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ...overrides,
  }

  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const key = Object.keys(handlers).find((k) => url.includes(k))
      if (key) return handlers[key]()
      return new Response(JSON.stringify({ error: "not found" }), { status: 404 })
    })
  )
}

beforeEach(() => {
  vi.restoreAllMocks()
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("SourceManager component", () => {
  it("renders the source manager container", async () => {
    setupFetchMock()
    render(<SourceManager />)
    expect(screen.getByTestId("source-manager")).toBeDefined()
  })

  it("renders the Add a source form", async () => {
    setupFetchMock()
    render(<SourceManager />)
    expect(screen.getByText("Add a source")).toBeDefined()
  })

  it("renders label and url input fields", () => {
    setupFetchMock()
    render(<SourceManager />)
    expect(screen.getByLabelText("Label")).toBeDefined()
    expect(screen.getByLabelText("URL")).toBeDefined()
  })

  it("renders the Add source button", () => {
    setupFetchMock()
    render(<SourceManager />)
    expect(screen.getByText("Add source")).toBeDefined()
  })

  it("fetches and displays sources after mount", async () => {
    setupFetchMock()
    render(<SourceManager />)

    await waitFor(() => {
      expect(screen.getByText("Linear Pricing Page")).toBeDefined()
    })
  })

  it("displays all fetched sources", async () => {
    setupFetchMock()
    render(<SourceManager />)

    await waitFor(() => {
      expect(screen.getByText("Linear Pricing Page")).toBeDefined()
      expect(screen.getByText("Retool Website")).toBeDefined()
    })
  })

  it("groups sources under module section labels", async () => {
    setupFetchMock()
    render(<SourceManager />)

    await waitFor(() => {
      // "Competitor Radar" only appears as a group label
      expect(screen.getByText("Competitor Radar")).toBeDefined()
      // "Prospects" appears in both the group label and the select option
      expect(screen.getAllByText("Prospects").length).toBeGreaterThanOrEqual(1)
    })
  })

  it("renders an ingest button for each source", async () => {
    setupFetchMock()
    render(<SourceManager />)

    await waitFor(() => {
      const ingestButtons = screen.getAllByRole("button", { name: /ingest/i })
      expect(ingestButtons.length).toBe(mockSources.length)
    })
  })

  it("shows validation error when label is empty", async () => {
    setupFetchMock()
    render(<SourceManager />)

    fireEvent.click(screen.getByText("Add source"))
    await waitFor(() => {
      expect(screen.getByText("Label is required.")).toBeDefined()
    })
  })

  it("shows validation error when URL is empty", async () => {
    setupFetchMock()
    render(<SourceManager />)

    fireEvent.change(screen.getByLabelText("Label"), {
      target: { value: "Some Label" },
    })
    fireEvent.click(screen.getByText("Add source"))

    await waitFor(() => {
      expect(screen.getByText("URL is required.")).toBeDefined()
    })
  })

  it("calls POST /api/sources when form is submitted with valid data", async () => {
    const newSource: Source = {
      id: "src-new",
      type: "url",
      label: "New Source",
      url: "https://new.example.com/pricing",
      tags: [],
      module: "competitors",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.includes("/api/sources") && (!init?.method || init.method === "GET")) {
        return new Response(JSON.stringify({ sources: mockSources }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      }
      if (url.includes("/api/sources") && init?.method === "POST") {
        return new Response(JSON.stringify({ source: newSource }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        })
      }
      return new Response("{}", { status: 404 })
    })
    vi.stubGlobal("fetch", fetchMock)

    render(<SourceManager />)

    fireEvent.change(screen.getByLabelText("Label"), {
      target: { value: "New Source" },
    })
    fireEvent.change(screen.getByLabelText("URL"), {
      target: { value: "https://new.example.com/pricing" },
    })
    fireEvent.click(screen.getByText("Add source"))

    await waitFor(() => {
      const postCalls = (fetchMock.mock.calls as [string, RequestInit?][]).filter(
        ([url, init]) =>
          url.includes("/api/sources") && init?.method === "POST"
      )
      expect(postCalls.length).toBeGreaterThan(0)
    })
  })

  it("shows empty state message when no sources exist", async () => {
    const emptyFetch = vi.fn(async () =>
      new Response(JSON.stringify({ sources: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    )
    vi.stubGlobal("fetch", emptyFetch)

    render(<SourceManager />)

    await waitFor(() => {
      expect(screen.getByText("No sources yet. Add one above.")).toBeDefined()
    })
  })
})
