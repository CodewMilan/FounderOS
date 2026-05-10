import { scrapeUrl } from "@/lib/services/anakinService"
import { analyzeFeatures } from "@/lib/services/openaiService"
import { sendMessage } from "@/lib/services/telegramService"
import {
  sendAlert,
  buildFeatureGapBlocks,
  type DevTicketData,
} from "@/lib/services/slackService"
import type { FeatureGapRequest, FeatureGapResult } from "@/lib/schemas/workflows"

function buildTelegramText(brief: {
  competitorName: string
  featureName: string
  whatItDoes: string
  gap: string
  whyItMatters: string
  suggestedAction: string
  confidence: string
  sourceUrl: string
}): string {
  return [
    "🔍 *Feature Gap Alert*",
    `*Competitor:* ${brief.competitorName}`,
    `*Feature:* ${brief.featureName}`,
    `*What it does:* ${brief.whatItDoes}`,
    `*Your gap:* ${brief.gap}`,
    `*Why it matters:* ${brief.whyItMatters}`,
    `*Suggested action:* ${brief.suggestedAction}`,
    `*Confidence:* ${brief.confidence}`,
    `*Source:* ${brief.sourceUrl}`,
  ].join("\n")
}

export async function runFeatureGapWorkflow(
  request: FeatureGapRequest
): Promise<FeatureGapResult> {
  const { competitorUrl, userSiteUrl: userSiteUrlParam } = request
  const userSiteUrl = userSiteUrlParam ?? process.env.USER_SITE_URL

  // Step 1 — Scrape competitor
  const competitorScrape = await scrapeUrl(competitorUrl)

  // Step 2 — Optionally scrape user site
  let userMarkdown: string | undefined
  if (userSiteUrl) {
    try {
      const userScrape = await scrapeUrl(userSiteUrl)
      userMarkdown = userScrape.markdown
    } catch {
      console.warn("[feature-gap] Could not scrape user site — skipping comparison")
    }
  }

  // Step 3 — Analyze with OpenAI
  const brief = await analyzeFeatures(competitorScrape.markdown, competitorUrl, userMarkdown)

  // Step 4 — Send Telegram
  const telegramText = buildTelegramText(brief)
  const telegramResult = await sendMessage(telegramText)

  // Step 5 — Build Slack blocks + send
  const webhookUrl = process.env.SLACK_WEBHOOK_URL ?? ""
  const devTicketPayload: DevTicketData = {
    featureName: brief.featureName,
    competitorName: brief.competitorName,
    description: brief.gap,
    whyNow: brief.whyItMatters,
    suggestedImplementation: brief.suggestedAction,
    confidence: brief.confidence,
    sourceUrl: brief.sourceUrl,
  }
  const slackBlocks = buildFeatureGapBlocks(brief, devTicketPayload)
  const slackResult = await sendAlert(webhookUrl, slackBlocks)

  return {
    brief,
    telegramSent: telegramResult.sent,
    telegramError: telegramResult.error,
    slackSent: slackResult.sent,
    slackError: slackResult.error,
  }
}
