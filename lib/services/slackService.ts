/**
 * slackService
 *
 * Sends Slack Block Kit messages via incoming webhooks.
 * Used by feature-gap, pricing-response, prospect-enrichment workflows.
 * Dev ticket goes to SLACK_DEV_TICKETS_WEBHOOK_URL.
 */

export interface SlackSendResult {
  sent: boolean
  error?: string
}

export type SlackBlock = Record<string, unknown>

// ─── sendAlert ────────────────────────────────────────────────────────────────

/**
 * Post a Block Kit message to any Slack webhook URL.
 */
export async function sendAlert(
  webhookUrl: string,
  blocks: SlackBlock[]
): Promise<SlackSendResult> {
  if (!webhookUrl) {
    console.warn("[slackService] No webhook URL provided — skipping")
    return { sent: false, error: "Slack webhook URL not configured" }
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks }),
      signal: AbortSignal.timeout(15_000),
    })

    if (res.ok) return { sent: true }

    const body = await res.text()
    const message = `Slack API error: HTTP ${res.status} — ${body.slice(0, 200)}`
    console.error(`[slackService] ${message}`)
    return { sent: false, error: message }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[slackService] Network error: ${message}`)
    return { sent: false, error: message }
  }
}

// ─── sendDevTicket ────────────────────────────────────────────────────────────

export interface DevTicketData {
  featureName: string
  competitorName: string
  description: string
  whyNow: string
  suggestedImplementation: string
  confidence: "high" | "medium" | "low"
  sourceUrl: string
}

const PRIORITY_MAP: Record<"high" | "medium" | "low", string> = {
  high: "P1 — Critical",
  medium: "P2 — High",
  low: "P3 — Medium",
}

/**
 * Format and post a dev ticket to the dev tickets Slack channel.
 */
export async function sendDevTicket(data: DevTicketData): Promise<SlackSendResult> {
  const webhookUrl = process.env.SLACK_DEV_TICKETS_WEBHOOK_URL
  if (!webhookUrl) {
    console.warn("[slackService] SLACK_DEV_TICKETS_WEBHOOK_URL not set — skipping dev ticket")
    return { sent: false, error: "Dev tickets webhook URL not configured" }
  }

  const priority = PRIORITY_MAP[data.confidence]

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: { type: "plain_text", text: "🎫 New Dev Ticket", emoji: true },
    },
    { type: "divider" },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Title:*\nImplement ${data.featureName} (competitor parity)` },
        { type: "mrkdwn", text: `*Source:*\nDetected on ${data.competitorName}` },
      ],
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*Description:*\n${data.description}` },
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*Why now:*\n${data.whyNow}` },
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*Suggested implementation:*\n${data.suggestedImplementation}` },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Priority:*\n${priority}` },
        { type: "mrkdwn", text: `*Raised by:*\nFounderOS` },
      ],
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*Link:*\n<${data.sourceUrl}|View competitor page>` },
    },
    { type: "divider" },
  ]

  return sendAlert(webhookUrl, blocks)
}

// ─── Block Kit builders ───────────────────────────────────────────────────────

/**
 * Build Block Kit blocks for a Feature Gap alert with a "Create Dev Ticket" button.
 */
export function buildFeatureGapBlocks(
  brief: {
    competitorName: string
    featureName: string
    whatItDoes: string
    gap: string
    whyItMatters: string
    suggestedAction: string
    confidence: string
    sourceUrl: string
  },
  devTicketPayload: DevTicketData
): SlackBlock[] {
  const encodedPayload = encodeURIComponent(JSON.stringify(devTicketPayload))

  return [
    {
      type: "header",
      text: { type: "plain_text", text: "🔍 Feature Gap Alert", emoji: true },
    },
    { type: "divider" },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Competitor:*\n${brief.competitorName}` },
        { type: "mrkdwn", text: `*Feature:*\n${brief.featureName}` },
      ],
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*What it does:*\n${brief.whatItDoes}` },
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*Your gap:*\n${brief.gap}` },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Why it matters:*\n${brief.whyItMatters}` },
        { type: "mrkdwn", text: `*Confidence:*\n${brief.confidence}` },
      ],
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*Suggested action:*\n${brief.suggestedAction}` },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "Create Dev Ticket", emoji: true },
          style: "primary",
          url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/workflows/dev-ticket?payload=${encodedPayload}`,
          action_id: "create_dev_ticket",
        },
        {
          type: "button",
          text: { type: "plain_text", text: "View Source", emoji: true },
          url: brief.sourceUrl,
          action_id: "view_source",
        },
      ],
    },
    { type: "divider" },
  ]
}

/**
 * Build Block Kit blocks for a Pricing Response alert.
 */
export function buildPricingResponseBlocks(brief: {
  competitorName: string
  changeDetected: string
  theirPricing: string
  yourPositioning: string
  suggestedResponse: string
  urgency: string
  sourceUrl: string
}): SlackBlock[] {
  return [
    {
      type: "header",
      text: { type: "plain_text", text: "💰 Pricing Alert", emoji: true },
    },
    { type: "divider" },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Competitor:*\n${brief.competitorName}` },
        { type: "mrkdwn", text: `*Urgency:*\n${brief.urgency}` },
      ],
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*Change detected:*\n${brief.changeDetected}` },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Their pricing:*\n${brief.theirPricing}` },
        { type: "mrkdwn", text: `*Your positioning:*\n${brief.yourPositioning}` },
      ],
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*Suggested response:*\n${brief.suggestedResponse}` },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "View Source", emoji: true },
          url: brief.sourceUrl,
          action_id: "view_source",
        },
      ],
    },
    { type: "divider" },
  ]
}

/**
 * Build Block Kit blocks for a Prospect Brief alert.
 */
export function buildProspectBriefBlocks(brief: {
  companyName: string
  icpFit: string
  keySignals: string[]
  outreachAngle: string
  confidence: string
  sourceUrl: string
}): SlackBlock[] {
  const signalText = brief.keySignals.map((s) => `• ${s}`).join("\n")

  return [
    {
      type: "header",
      text: { type: "plain_text", text: "🎯 Prospect Brief", emoji: true },
    },
    { type: "divider" },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Company:*\n${brief.companyName}` },
        { type: "mrkdwn", text: `*ICP Fit:*\n${brief.icpFit}` },
      ],
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*Key signals:*\n${signalText}` },
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*Outreach angle:*\n${brief.outreachAngle}` },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Confidence:*\n${brief.confidence}` },
        { type: "mrkdwn", text: `*Source:*\n<${brief.sourceUrl}|View site>` },
      ],
    },
    { type: "divider" },
  ]
}
