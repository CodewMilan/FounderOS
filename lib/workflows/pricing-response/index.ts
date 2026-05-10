import { scrapeUrl } from "@/lib/services/anakinService"
import { analyzePricing } from "@/lib/services/openaiService"
import { sendMessage } from "@/lib/services/telegramService"
import { sendAlert, buildPricingResponseBlocks } from "@/lib/services/slackService"
import type { PricingResponseRequest, PricingResponseResult } from "@/lib/schemas/workflows"

function buildTelegramText(brief: {
  competitorName: string
  changeDetected: string
  theirPricing: string
  yourPositioning: string
  suggestedResponse: string
  urgency: string
  sourceUrl: string
}): string {
  return [
    "💰 *Pricing Alert*",
    `*Competitor:* ${brief.competitorName}`,
    `*Change detected:* ${brief.changeDetected}`,
    `*Their pricing:* ${brief.theirPricing}`,
    `*Your positioning:* ${brief.yourPositioning}`,
    `*Suggested response:* ${brief.suggestedResponse}`,
    `*Urgency:* ${brief.urgency}`,
    `*Source:* ${brief.sourceUrl}`,
  ].join("\n")
}

export async function runPricingResponseWorkflow(
  request: PricingResponseRequest
): Promise<PricingResponseResult> {
  const { competitorUrl, userPricingUrl } = request

  // Step 1 — Scrape competitor
  const competitorScrape = await scrapeUrl(competitorUrl)

  // Step 2 — Optionally scrape user pricing page
  let userMarkdown: string | undefined
  const userPricingUrlResolved = userPricingUrl ?? process.env.USER_SITE_URL
  if (userPricingUrlResolved) {
    try {
      const userScrape = await scrapeUrl(userPricingUrlResolved)
      userMarkdown = userScrape.markdown
    } catch {
      console.warn("[pricing-response] Could not scrape user pricing page — skipping comparison")
    }
  }

  // Step 3 — Analyze with OpenAI
  const brief = await analyzePricing(competitorScrape.markdown, competitorUrl, userMarkdown)

  // Step 4 — Send Telegram
  const telegramText = buildTelegramText(brief)
  const telegramResult = await sendMessage(telegramText)

  // Step 5 — Build Slack blocks + send
  const webhookUrl = process.env.SLACK_WEBHOOK_URL ?? ""
  const slackBlocks = buildPricingResponseBlocks(brief)
  const slackResult = await sendAlert(webhookUrl, slackBlocks)

  return {
    brief,
    telegramSent: telegramResult.sent,
    telegramError: telegramResult.error,
    slackSent: slackResult.sent,
    slackError: slackResult.error,
  }
}
