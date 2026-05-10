import type { AnalysisResult } from "@/lib/schemas/competitor-alert"

// ─── Mock fallback ────────────────────────────────────────────────────────────

const MOCK_ANALYSIS: AnalysisResult = {
  competitorName: "Acme Corp",
  detectedFeatures: [
    {
      name: "AI Assistant",
      description: "A new AI-powered assistant that answers customer questions instantly",
      pageContext: "Features section",
    },
  ],
  detectedPricingChanges: [
    {
      summary: "Starter plan price increased from $19/mo to $29/mo",
      oldSignal: "$19/mo",
      newSignal: "$29/mo",
    },
  ],
  recommendedWorkflowType: "feature_gap",
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a competitive intelligence analyst. 
Analyze the provided competitor website content (markdown) and extract:
1. New or notable product features
2. Pricing changes or pricing structure details

Return ONLY valid JSON matching this schema:
{
  "competitorName": string,
  "detectedFeatures": [{ "name": string, "description": string, "pageContext"?: string }],
  "detectedPricingChanges": [{ "summary": string, "oldSignal"?: string, "newSignal": string }],
  "recommendedWorkflowType": "feature_gap" | "pricing_response"
}

If both features and pricing changes are present, prefer "feature_gap".
If only pricing changes are detected, use "pricing_response".
Keep descriptions concise. Max 3 features and 3 pricing changes.`

// ─── analyzeCompetitorContent ─────────────────────────────────────────────────

/**
 * Passes the scraped markdown to OpenAI and returns a structured analysis
 * of detected features and pricing changes.
 *
 * Falls back to mock output if OPENAI_API_KEY is not set.
 */
export async function analyzeCompetitorContent(
  markdown: string,
  competitorUrl: string
): Promise<AnalysisResult> {
  const apiKey = process.env.OPENAI_API_KEY
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini"

  if (!apiKey) {
    console.warn("[competitor-alert/analyzer] OPENAI_API_KEY not set — using mock analysis")
    return MOCK_ANALYSIS
  }

  const userMessage = `Competitor URL: ${competitorUrl}\n\nPage content:\n${markdown.slice(0, 8000)}`

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
    signal: AbortSignal.timeout(30_000),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`OpenAI analysis failed: HTTP ${response.status} — ${text.slice(0, 200)}`)
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>
  }

  const raw = data.choices[0]?.message?.content
  if (!raw) throw new Error("OpenAI returned an empty response for analysis")

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error(`OpenAI returned non-JSON analysis: ${raw.slice(0, 200)}`)
  }

  // Validate shape
  const { AnalysisResultSchema } = await import("@/lib/schemas/competitor-alert")
  const result = AnalysisResultSchema.safeParse(parsed)
  if (!result.success) {
    console.error("[competitor-alert/analyzer] Schema mismatch:", result.error.issues)
    // Return best-effort fallback rather than crashing
    return {
      competitorName: (parsed as Record<string, unknown>).competitorName as string ?? "Unknown",
      detectedFeatures: [],
      detectedPricingChanges: [],
      recommendedWorkflowType: "feature_gap",
    }
  }

  return result.data
}
