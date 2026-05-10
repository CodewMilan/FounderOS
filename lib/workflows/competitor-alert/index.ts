import { scrapeCompetitorUrl } from "./scraper"
import { analyzeCompetitorContent } from "./analyzer"
import { generateBrief } from "./briefGenerator"
import { sendTelegramMessage } from "./telegram"
import type { CompetitorAlertRequest, CompetitorAlertResult } from "@/lib/schemas/competitor-alert"

/**
 * Orchestrates the full Competitor Intelligence → Telegram Alert workflow.
 *
 * Steps:
 * 1. Scrape the competitor URL via Anakin (or mock)
 * 2. Analyze the markdown with OpenAI to detect features/pricing changes
 * 3. Resolve workflow type (auto → use recommended from analysis)
 * 4. Generate a founder-ready Telegram brief
 * 5. Send the brief to Telegram
 */
export async function runCompetitorAlertWorkflow(
  request: CompetitorAlertRequest
): Promise<CompetitorAlertResult> {
  const { competitorUrl, userSiteUrl, workflowType } = request

  // Step 1 — Scrape
  const extraction = await scrapeCompetitorUrl(competitorUrl)

  // Step 2 — Analyze
  const analysis = await analyzeCompetitorContent(
    extraction.markdown ?? "",
    competitorUrl
  )

  // Step 3 — Resolve type
  const resolvedType: "feature_gap" | "pricing_response" =
    workflowType === "auto" ? analysis.recommendedWorkflowType : workflowType

  // Step 4 — Generate brief
  const brief = await generateBrief(analysis, resolvedType, userSiteUrl, competitorUrl)

  // Step 5 — Send to Telegram
  const telegramResult = await sendTelegramMessage(brief)

  return {
    workflowType: resolvedType,
    competitorName: analysis.competitorName,
    brief,
    telegramSent: telegramResult.sent,
    telegramError: telegramResult.error,
  }
}
