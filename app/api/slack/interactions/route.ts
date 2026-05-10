/**
 * POST /api/slack/interactions
 *
 * Receives Slack Block Kit interaction payloads (type: block_actions).
 * Handles the "create_dev_ticket" action triggered by the Feature Gap alert button.
 *
 * SETUP REQUIRED:
 * In your Slack app dashboard → Interactivity & Shortcuts, set the
 * Interactivity Request URL to:
 *   https://<your-domain>/api/slack/interactions
 *
 * For local development you need an HTTPS tunnel (e.g. ngrok):
 *   ngrok http 3000
 *   → set Request URL to https://<ngrok-id>.ngrok.io/api/slack/interactions
 *
 * SECURITY NOTE:
 * Slack request signature verification is not yet implemented.
 * TODO: Add HMAC-SHA256 verification using SLACK_SIGNING_SECRET before
 * deploying to production. Pattern:
 *   1. Read X-Slack-Request-Timestamp and X-Slack-Signature headers
 *   2. Construct sigBaseString = `v0:${timestamp}:${rawBody}`
 *   3. Compute HMAC-SHA256(SLACK_SIGNING_SECRET, sigBaseString)
 *   4. Compare `v0=${hmac}` with X-Slack-Signature (constant-time)
 *   5. Reject if mismatch or timestamp > 5 minutes old
 */

import { NextResponse } from "next/server"
import { DevTicketRequestSchema } from "@/lib/schemas/workflows"
import { runDevTicketWorkflow } from "@/lib/workflows/dev-ticket"

// ─── Types ────────────────────────────────────────────────────────────────────

interface SlackAction {
  action_id: string
  value?: string
  type: string
}

interface SlackBlockActionsPayload {
  type: "block_actions"
  actions: SlackAction[]
  response_url?: string
  user?: { id: string; name: string }
  channel?: { id: string; name: string }
}

// ─── Route handler ─────────────────────────────────────────────────────────--

export async function POST(request: Request): Promise<NextResponse> {
  // Slack sends interaction payloads as application/x-www-form-urlencoded
  // with a single "payload" field containing JSON.
  let rawBody: string
  try {
    rawBody = await request.text()
  } catch {
    return NextResponse.json({ error: "Could not read request body" }, { status: 400 })
  }

  // Parse the form-encoded payload field
  let payloadJson: string | null = null
  try {
    const params = new URLSearchParams(rawBody)
    payloadJson = params.get("payload")
  } catch {
    return NextResponse.json({ error: "Malformed request body" }, { status: 400 })
  }

  if (!payloadJson) {
    return NextResponse.json({ error: "Missing payload field" }, { status: 400 })
  }

  // Parse the JSON payload
  let slackPayload: unknown
  try {
    slackPayload = JSON.parse(payloadJson)
  } catch {
    return NextResponse.json({ error: "Invalid payload JSON" }, { status: 400 })
  }

  // Validate shape: must be block_actions with at least one action
  if (
    typeof slackPayload !== "object" ||
    slackPayload === null ||
    (slackPayload as { type?: unknown }).type !== "block_actions"
  ) {
    return NextResponse.json({ error: "Unsupported payload type" }, { status: 400 })
  }

  const payload = slackPayload as SlackBlockActionsPayload

  if (!Array.isArray(payload.actions) || payload.actions.length === 0) {
    return NextResponse.json({ error: "No actions in payload" }, { status: 400 })
  }

  // Find the create_dev_ticket action
  const ticketAction = payload.actions.find(
    (a) => a.action_id === "create_dev_ticket"
  )

  if (!ticketAction) {
    // Unrecognised action — acknowledge immediately without error
    // (Slack requires a 200 within 3 seconds for all interactions)
    return new NextResponse(null, { status: 200 })
  }

  // Parse and validate the ticket value
  if (!ticketAction.value) {
    return NextResponse.json({ error: "create_dev_ticket action has no value" }, { status: 400 })
  }

  let ticketData: unknown
  try {
    ticketData = JSON.parse(ticketAction.value)
  } catch {
    return NextResponse.json({ error: "Invalid ticket value JSON" }, { status: 400 })
  }

  const parsed = DevTicketRequestSchema.safeParse(ticketData)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid ticket payload", issues: parsed.error.issues },
      { status: 400 }
    )
  }

  // Create the dev ticket (calls sendDevTicket → SLACK_DEV_TICKETS_WEBHOOK_URL)
  let workflowResult: Awaited<ReturnType<typeof runDevTicketWorkflow>>
  try {
    workflowResult = await runDevTicketWorkflow(parsed.data)
  } catch (err) {
    console.error("[/api/slack/interactions] runDevTicketWorkflow threw:", err)
    // Still return 200 so Slack does not show an error to the user;
    // log the failure server-side for debugging.
    return new NextResponse(null, { status: 200 })
  }

  // Send a confirmation back to Slack if response_url is present.
  // This updates the message in-place so the user sees confirmation.
  if (payload.response_url) {
    const confirmationText = workflowResult.slackSent
      ? "✅ Dev ticket created and posted to #dev-tickets."
      : `⚠️ Dev ticket created but Slack notification failed: ${workflowResult.slackError ?? "unknown error"}`

    sendResponseUrlConfirmation(payload.response_url, confirmationText).catch((err) => {
      console.error("[/api/slack/interactions] Failed to send response_url confirmation:", err)
    })
  }

  // Acknowledge the interaction immediately (Slack requires 200 within 3s)
  return new NextResponse(null, { status: 200 })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Posts a follow-up message to Slack via the response_url provided in the
 * interaction payload. Uses "replace_original: false" to send an ephemeral
 * confirmation without replacing the original Feature Gap alert.
 */
async function sendResponseUrlConfirmation(
  responseUrl: string,
  text: string
): Promise<void> {
  await fetch(responseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      replace_original: false,
      response_type: "ephemeral",
    }),
    signal: AbortSignal.timeout(10_000),
  })
}
