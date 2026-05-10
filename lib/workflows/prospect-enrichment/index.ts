import { scrapeUrl } from "@/lib/services/anakinService"
import { extractProspectSignals } from "@/lib/services/openaiService"
import { sendMessage } from "@/lib/services/telegramService"
import { sendAlert, buildProspectBriefBlocks } from "@/lib/services/slackService"
import type { ProspectEnrichmentRequest, ProspectEnrichmentResult } from "@/lib/schemas/workflows"

function buildTelegramText(brief: {
  companyName: string
  icpFit: string
  keySignals: string[]
  outreachAngle: string
  confidence: string
  sourceUrl: string
}): string {
  const signalLines = brief.keySignals.slice(0, 3).map((s) => `• ${s}`).join("\n")
  return [
    "🎯 *Prospect Brief*",
    `*Company:* ${brief.companyName}`,
    `*ICP Fit:* ${brief.icpFit}`,
    `*Key signals:*\n${signalLines}`,
    `*Outreach angle:* ${brief.outreachAngle}`,
    `*Confidence:* ${brief.confidence}`,
    `*Source:* ${brief.sourceUrl}`,
  ].join("\n")
}

export async function runProspectEnrichmentWorkflow(
  request: ProspectEnrichmentRequest
): Promise<ProspectEnrichmentResult> {
  const { prospectUrl } = request

  // Step 1 — Scrape prospect site
  const scrape = await scrapeUrl(prospectUrl)

  // Step 2 — Extract signals with OpenAI
  const brief = await extractProspectSignals(scrape.markdown, prospectUrl)

  // Step 3 — Send Telegram
  const telegramText = buildTelegramText(brief)
  const telegramResult = await sendMessage(telegramText)

  // Step 4 — Send to Slack
  const webhookUrl = process.env.SLACK_WEBHOOK_URL ?? ""
  const slackBlocks = buildProspectBriefBlocks(brief)
  const slackResult = await sendAlert(webhookUrl, slackBlocks)

  return {
    brief,
    telegramSent: telegramResult.sent,
    telegramError: telegramResult.error,
    slackSent: slackResult.sent,
    slackError: slackResult.error,
  }
}
