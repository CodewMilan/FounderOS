import { scrapeUrl } from "@/lib/services/anakinService"
import { extractFundingInfo } from "@/lib/services/openaiService"
import { sendMessage } from "@/lib/services/telegramService"
import type { FundingAlertRequest, FundingAlertResult } from "@/lib/schemas/workflows"

function buildTelegramText(brief: {
  programName: string
  provider: string
  deadline: string
  isUrgent: boolean
  eligibility: string
  fitReason: string
  applyUrl: string
}): string {
  const deadlineLabel = `${brief.deadline}${brief.isUrgent ? " ⚠️" : ""}`
  return [
    "💼 *Funding Opportunity*",
    `*Program:* ${brief.programName}`,
    `*Provider:* ${brief.provider}`,
    `*Deadline:* ${deadlineLabel}`,
    `*Eligibility:* ${brief.eligibility}`,
    `*Fit:* ${brief.fitReason}`,
    `*Apply:* ${brief.applyUrl}`,
  ].join("\n")
}

export async function runFundingAlertWorkflow(
  request: FundingAlertRequest
): Promise<FundingAlertResult> {
  const { fundingUrl } = request

  // Step 1 — Scrape funding page
  const scrape = await scrapeUrl(fundingUrl)

  // Step 2 — Extract info with OpenAI
  const brief = await extractFundingInfo(scrape.markdown, fundingUrl)

  // Step 3 — Send Telegram only (lightweight notification)
  const telegramText = buildTelegramText(brief)
  const telegramResult = await sendMessage(telegramText)

  return {
    brief,
    telegramSent: telegramResult.sent,
    telegramError: telegramResult.error,
  }
}
