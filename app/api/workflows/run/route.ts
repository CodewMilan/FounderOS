/**
 * POST /api/workflows/run
 *
 * Unified workflow orchestration endpoint.
 * Accepts a single URL, auto-detects its type, runs the appropriate
 * workflow(s), delivers to Telegram and Slack, and returns a structured result.
 *
 * The individual workflow routes (/feature-gap, /prospect-enrichment, etc.)
 * are NOT called over HTTP — their service functions are imported directly.
 */

import { NextResponse } from "next/server"
import { UnifiedRunRequestSchema, type UnifiedRunResult } from "@/lib/schemas/workflows"
import { detectUrlType } from "@/lib/workflows/url-detector"
import { runFeatureGapWorkflow } from "@/lib/workflows/feature-gap"
import { runPricingResponseWorkflow } from "@/lib/workflows/pricing-response"
import { runProspectEnrichmentWorkflow } from "@/lib/workflows/prospect-enrichment"
import { runFundingAlertWorkflow } from "@/lib/workflows/funding-alert"
import type { FeatureGapBrief } from "@/lib/services/openaiService"

function nowIso(): string {
  return new Date().toISOString()
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = UnifiedRunRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    )
  }

  const { url, userSiteUrl } = parsed.data

  try {
    // ── Step 1: Detect URL type ──────────────────────────────────────────────
    const detectedType = await detectUrlType(url)

    // ── Step 2: Run appropriate workflow(s) ─────────────────────────────────
    const briefs: unknown[] = []
    const workflowNames: string[] = []
    let telegramSent = false
    let telegramError: string | undefined
    let slackSent = false
    let slackError: string | undefined
    let devTicketAvailable = false
    let devTicketData: UnifiedRunResult["devTicketData"] | undefined

    if (detectedType === "competitor") {
      // Run feature gap + pricing response in parallel
      const [fgResult, prResult] = await Promise.all([
        runFeatureGapWorkflow({ competitorUrl: url, userSiteUrl }),
        runPricingResponseWorkflow({ competitorUrl: url, userPricingUrl: userSiteUrl }),
      ])

      workflowNames.push("feature_gap", "pricing_response")
      briefs.push(fgResult.brief, prResult.brief)

      telegramSent = fgResult.telegramSent || prResult.telegramSent
      telegramError = fgResult.telegramError ?? prResult.telegramError
      slackSent = fgResult.slackSent || prResult.slackSent
      slackError = fgResult.slackError ?? prResult.slackError

      // Feature gap always produces a dev ticket candidate
      devTicketAvailable = true
      const fg = fgResult.brief as FeatureGapBrief
      devTicketData = {
        featureName: fg.featureName,
        competitorName: fg.competitorName,
        description: fg.gap,
        whyNow: fg.whyItMatters,
        suggestedImplementation: fg.suggestedAction,
        confidence: fg.confidence,
        sourceUrl: fg.sourceUrl,
      }
    } else if (detectedType === "prospect") {
      const result = await runProspectEnrichmentWorkflow({ prospectUrl: url })
      workflowNames.push("prospect_enrichment")
      briefs.push(result.brief)
      telegramSent = result.telegramSent
      telegramError = result.telegramError
      slackSent = result.slackSent
      slackError = result.slackError
    } else if (detectedType === "funding") {
      const result = await runFundingAlertWorkflow({ fundingUrl: url })
      workflowNames.push("funding_alert")
      briefs.push(result.brief)
      telegramSent = result.telegramSent
      telegramError = result.telegramError
      // funding-alert does not post to Slack currently
      slackSent = false
    } else {
      // "unknown" — run general prospect enrichment as fallback
      const result = await runProspectEnrichmentWorkflow({ prospectUrl: url })
      workflowNames.push("prospect_enrichment")
      briefs.push(result.brief)
      telegramSent = result.telegramSent
      telegramError = result.telegramError
      slackSent = result.slackSent
      slackError = result.slackError
    }

    // ── Step 3: Assemble unified result ──────────────────────────────────────
    const result: UnifiedRunResult = {
      detectedType,
      workflows: workflowNames,
      briefs,
      deliveries: {
        telegram: {
          sent: telegramSent,
          timestamp: telegramSent ? nowIso() : undefined,
          error: telegramError,
        },
        slack: {
          sent: slackSent,
          channel: slackSent ? "#founder-os-alerts" : undefined,
          timestamp: slackSent ? nowIso() : undefined,
          error: slackError,
        },
      },
      devTicketAvailable,
      devTicketData,
    }

    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    console.error("[/api/workflows/run]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Workflow run failed" },
      { status: 500 }
    )
  }
}
