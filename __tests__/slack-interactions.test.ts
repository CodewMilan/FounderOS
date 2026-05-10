/**
 * Tests for POST /api/slack/interactions
 *
 * All external calls are mocked:
 *   - runDevTicketWorkflow is mocked via vi.mock
 *   - fetch (response_url confirmation) is stubbed with vi.stubGlobal
 *
 * Covers:
 *   - valid create_dev_ticket block_actions payload → 200 + workflow called
 *   - valid payload without SLACK_DEV_TICKETS_WEBHOOK_URL → 200 (ticket still attempted)
 *   - missing payload field → 400
 *   - malformed payload JSON → 400
 *   - wrong payload type → 400
 *   - no actions in payload → 400
 *   - unrecognised action_id → 200 (silent acknowledge)
 *   - create_dev_ticket action with no value → 400
 *   - create_dev_ticket action with invalid value JSON → 400
 *   - create_dev_ticket action with invalid ticket data → 400
 *   - response_url confirmation is attempted when present
 *   - workflow error does NOT cause a non-200 response
 *   - buildFeatureGapBlocks does NOT contain localhost URL
 *   - buildFeatureGapBlocks Create Dev Ticket button uses action_id + value
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const VALID_TICKET = {
  featureName: "AI Chat",
  competitorName: "Rival Inc",
  description: "Competitor has an AI chat widget on their pricing page.",
  whyNow: "Users are asking about it in support.",
  suggestedImplementation: "Add an Intercom-style AI chat to the dashboard.",
  confidence: "high" as const,
  sourceUrl: "https://rival.com/features",
}

function makeSlackPayload(overrides?: Partial<{
  type: string
  actions: unknown[]
  response_url: string
}>) {
  return {
    type: "block_actions",
    actions: [
      {
        type: "button",
        action_id: "create_dev_ticket",
        value: JSON.stringify(VALID_TICKET),
      },
    ],
    ...overrides,
  }
}

function makeRequest(payload: unknown) {
  const body = `payload=${encodeURIComponent(JSON.stringify(payload))}`
  return new Request("http://localhost/api/slack/interactions", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })
}

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/workflows/dev-ticket", () => ({
  runDevTicketWorkflow: vi.fn().mockResolvedValue({ slackSent: true }),
}))

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/slack/interactions — valid create_dev_ticket", () => {
  beforeEach(() => {
    vi.stubEnv("SLACK_DEV_TICKETS_WEBHOOK_URL", "https://hooks.slack.com/dev")
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it("returns 200 for a valid create_dev_ticket payload", async () => {
    const { POST } = await import("@/app/api/slack/interactions/route")
    const res = await POST(makeRequest(makeSlackPayload()))
    expect(res.status).toBe(200)
  })

  it("calls runDevTicketWorkflow with the parsed ticket data", async () => {
    const { runDevTicketWorkflow } = await import("@/lib/workflows/dev-ticket")
    const { POST } = await import("@/app/api/slack/interactions/route")
    await POST(makeRequest(makeSlackPayload()))
    expect(runDevTicketWorkflow).toHaveBeenCalledOnce()
    expect(runDevTicketWorkflow).toHaveBeenCalledWith(VALID_TICKET)
  })

  it("returns 200 even when SLACK_DEV_TICKETS_WEBHOOK_URL is not set", async () => {
    vi.stubEnv("SLACK_DEV_TICKETS_WEBHOOK_URL", "")
    const { POST } = await import("@/app/api/slack/interactions/route")
    const res = await POST(makeRequest(makeSlackPayload()))
    expect(res.status).toBe(200)
  })
})

describe("POST /api/slack/interactions — response_url confirmation", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it("fires a confirmation POST to response_url when present", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal("fetch", mockFetch)

    const { POST } = await import("@/app/api/slack/interactions/route")
    const payload = makeSlackPayload({ response_url: "https://hooks.slack.com/response/abc123" })
    await POST(makeRequest(payload))

    // Give the fire-and-forget confirmation a chance to run
    await new Promise((r) => setTimeout(r, 10))

    const confirmationCalls = (mockFetch.mock.calls as Array<[string, RequestInit]>).filter(
      ([url]) => url === "https://hooks.slack.com/response/abc123"
    )
    expect(confirmationCalls.length).toBeGreaterThanOrEqual(1)
  })
})

describe("POST /api/slack/interactions — malformed input", () => {
  afterEach(() => { vi.clearAllMocks() })

  it("returns 400 when the body has no payload field", async () => {
    const { POST } = await import("@/app/api/slack/interactions/route")
    const req = new Request("http://localhost/api/slack/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "other_field=foo",
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string }
    expect(body.error).toMatch(/missing payload/i)
  })

  it("returns 400 when payload field contains invalid JSON", async () => {
    const { POST } = await import("@/app/api/slack/interactions/route")
    const req = new Request("http://localhost/api/slack/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "payload=not-valid-json",
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string }
    expect(body.error).toMatch(/invalid payload json/i)
  })

  it("returns 400 when payload type is not block_actions", async () => {
    const { POST } = await import("@/app/api/slack/interactions/route")
    const res = await POST(makeRequest({ type: "view_submission", view: {} }))
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string }
    expect(body.error).toMatch(/unsupported payload type/i)
  })

  it("returns 400 when actions array is empty", async () => {
    const { POST } = await import("@/app/api/slack/interactions/route")
    const res = await POST(makeRequest(makeSlackPayload({ actions: [] })))
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string }
    expect(body.error).toMatch(/no actions/i)
  })
})

describe("POST /api/slack/interactions — unknown action", () => {
  it("returns 200 silently for an unrecognised action_id", async () => {
    const { POST } = await import("@/app/api/slack/interactions/route")
    const payload = {
      type: "block_actions",
      actions: [{ type: "button", action_id: "view_source", value: "" }],
    }
    const res = await POST(makeRequest(payload))
    expect(res.status).toBe(200)
  })
})

describe("POST /api/slack/interactions — invalid ticket value", () => {
  it("returns 400 when create_dev_ticket action has no value", async () => {
    const { POST } = await import("@/app/api/slack/interactions/route")
    const payload = {
      type: "block_actions",
      actions: [{ type: "button", action_id: "create_dev_ticket" }],
    }
    const res = await POST(makeRequest(payload))
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string }
    expect(body.error).toMatch(/no value/i)
  })

  it("returns 400 when value is not valid JSON", async () => {
    const { POST } = await import("@/app/api/slack/interactions/route")
    const payload = {
      type: "block_actions",
      actions: [{ type: "button", action_id: "create_dev_ticket", value: "{{broken" }],
    }
    const res = await POST(makeRequest(payload))
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string }
    expect(body.error).toMatch(/invalid ticket value json/i)
  })

  it("returns 400 when ticket value fails schema validation", async () => {
    const { POST } = await import("@/app/api/slack/interactions/route")
    const badTicket = { featureName: "Only this field" }
    const payload = {
      type: "block_actions",
      actions: [{ type: "button", action_id: "create_dev_ticket", value: JSON.stringify(badTicket) }],
    }
    const res = await POST(makeRequest(payload))
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string; issues: unknown[] }
    expect(body.error).toMatch(/invalid ticket payload/i)
    expect(Array.isArray(body.issues)).toBe(true)
  })
})

describe("POST /api/slack/interactions — workflow error resilience", () => {
  afterEach(() => { vi.clearAllMocks() })

  it("returns 200 even when runDevTicketWorkflow throws", async () => {
    const { runDevTicketWorkflow } = await import("@/lib/workflows/dev-ticket")
    vi.mocked(runDevTicketWorkflow).mockRejectedValueOnce(new Error("Slack down"))

    const { POST } = await import("@/app/api/slack/interactions/route")
    const res = await POST(makeRequest(makeSlackPayload()))
    expect(res.status).toBe(200)
  })
})

// ─── slackService block builder assertions ────────────────────────────────────

describe("buildFeatureGapBlocks — button shape", () => {
  it("does NOT contain a localhost URL in any block", async () => {
    const { buildFeatureGapBlocks } = await import("@/lib/services/slackService")
    const blocks = buildFeatureGapBlocks(
      {
        competitorName: "Rival",
        featureName: "AI Chat",
        whatItDoes: "Instant chat.",
        gap: "Missing.",
        whyItMatters: "Big deal.",
        suggestedAction: "Build it.",
        confidence: "high",
        sourceUrl: "https://rival.com",
      },
      {
        featureName: "AI Chat",
        competitorName: "Rival",
        description: "Gap.",
        whyNow: "Now.",
        suggestedImplementation: "Build it.",
        confidence: "high",
        sourceUrl: "https://rival.com",
      }
    )
    const blockStr = JSON.stringify(blocks)
    expect(blockStr).not.toContain("localhost")
    expect(blockStr).not.toContain("/api/workflows/dev-ticket")
  })

  it("Create Dev Ticket button uses action_id and value, not url", async () => {
    const { buildFeatureGapBlocks } = await import("@/lib/services/slackService")
    const devTicketPayload = {
      featureName: "AI Chat",
      competitorName: "Rival",
      description: "Gap.",
      whyNow: "Now.",
      suggestedImplementation: "Build it.",
      confidence: "high" as const,
      sourceUrl: "https://rival.com",
    }
    const blocks = buildFeatureGapBlocks(
      {
        competitorName: "Rival",
        featureName: "AI Chat",
        whatItDoes: "Chat.",
        gap: "Missing.",
        whyItMatters: "Big.",
        suggestedAction: "Build it.",
        confidence: "high",
        sourceUrl: "https://rival.com",
      },
      devTicketPayload
    )

    // Find the actions block
    const actionsBlock = blocks.find((b) => b.type === "actions") as {
      type: string
      elements: Array<Record<string, unknown>>
    } | undefined
    expect(actionsBlock).toBeDefined()

    const ticketButton = actionsBlock!.elements.find(
      (el) => el.action_id === "create_dev_ticket"
    )
    expect(ticketButton).toBeDefined()

    // Must have a value (serialised JSON)
    expect(typeof ticketButton!.value).toBe("string")
    const parsedValue = JSON.parse(ticketButton!.value as string) as typeof devTicketPayload
    expect(parsedValue.featureName).toBe("AI Chat")
    expect(parsedValue.confidence).toBe("high")

    // Must NOT have a url property
    expect(ticketButton!.url).toBeUndefined()
  })

  it("View Source button still has url", async () => {
    const { buildFeatureGapBlocks } = await import("@/lib/services/slackService")
    const blocks = buildFeatureGapBlocks(
      {
        competitorName: "Rival",
        featureName: "AI Chat",
        whatItDoes: "Chat.",
        gap: "Missing.",
        whyItMatters: "Big.",
        suggestedAction: "Build it.",
        confidence: "high",
        sourceUrl: "https://rival.com/features",
      },
      {
        featureName: "AI Chat",
        competitorName: "Rival",
        description: "Gap.",
        whyNow: "Now.",
        suggestedImplementation: "Build it.",
        confidence: "high",
        sourceUrl: "https://rival.com/features",
      }
    )
    const actionsBlock = blocks.find((b) => b.type === "actions") as {
      elements: Array<Record<string, unknown>>
    }
    const viewSourceBtn = actionsBlock.elements.find((el) => el.action_id === "view_source")
    expect(viewSourceBtn).toBeDefined()
    expect(viewSourceBtn!.url).toBe("https://rival.com/features")
  })
})
