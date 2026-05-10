import type { AnalysisResult, WorkflowType } from "@/lib/schemas/competitor-alert"

// ─── Mock brief builders ──────────────────────────────────────────────────────

function mockFeatureBrief(analysis: AnalysisResult, competitorUrl: string): string {
  const feature = analysis.detectedFeatures[0]
  return [
    "🔍 *Competitor Feature Alert*",
    `*Competitor:* ${analysis.competitorName}`,
    `*New Feature Detected:* ${feature?.name ?? "Unknown feature"}`,
    `*What it does:* ${feature?.description ?? "N/A"}`,
    `*Your gap:* You don't currently offer this capability`,
    `*Why it matters:* Customers comparing tools will notice this differentiator`,
    `*Suggested action:* Evaluate adding a lightweight version to your roadmap`,
    `*Confidence:* medium`,
    `*Source:* ${competitorUrl}`,
  ].join("\n")
}

function mockPricingBrief(analysis: AnalysisResult, competitorUrl: string): string {
  const change = analysis.detectedPricingChanges[0]
  return [
    "💰 *Competitor Pricing Alert*",
    `*Competitor:* ${analysis.competitorName}`,
    `*Change detected:* ${change?.summary ?? "Pricing update detected"}`,
    `*Their current pricing:* ${change?.newSignal ?? "See source URL"}`,
    `*Your current positioning:* Review your pricing page for comparison`,
    `*Suggested response:* Consider updating your value messaging to highlight differentiation`,
    `*Urgency:* medium`,
    `*Source:* ${competitorUrl}`,
  ].join("\n")
}

// ─── OpenAI brief prompts ─────────────────────────────────────────────────────

function buildFeatureBriefPrompt(
  analysis: AnalysisResult,
  userSiteUrl: string | undefined,
  competitorUrl: string
): string {
  return `You are a founder-focused product strategist. Generate a Telegram alert brief.

Competitor: ${analysis.competitorName}
Competitor URL: ${competitorUrl}
${userSiteUrl ? `Founder's site: ${userSiteUrl}` : "No founder site provided for comparison."}

Detected features:
${JSON.stringify(analysis.detectedFeatures, null, 2)}

Output ONLY this exact format (no preamble, no markdown code fences):
🔍 *Competitor Feature Alert*
*Competitor:* [name]
*New Feature Detected:* [feature name]
*What it does:* [1-2 sentences]
*Your gap:* [what the founder is missing]
*Why it matters:* [business impact, 1 sentence]
*Suggested action:* [specific product change to make]
*Confidence:* [high/medium/low]
*Source:* [URL]

Rules:
- Be direct and founder-friendly
- Max 1 feature (the most impactful)
- Keep each line to one sentence`
}

function buildPricingBriefPrompt(
  analysis: AnalysisResult,
  userSiteUrl: string | undefined,
  competitorUrl: string
): string {
  return `You are a founder-focused pricing strategist. Generate a Telegram alert brief.

Competitor: ${analysis.competitorName}
Competitor URL: ${competitorUrl}
${userSiteUrl ? `Founder's pricing page: ${userSiteUrl}` : "No founder pricing URL provided."}

Detected pricing changes:
${JSON.stringify(analysis.detectedPricingChanges, null, 2)}

Output ONLY this exact format (no preamble, no markdown code fences):
💰 *Competitor Pricing Alert*
*Competitor:* [name]
*Change detected:* [what changed]
*Their current pricing:* [extracted summary]
*Your current positioning:* [based on founder site if provided, else "Review your pricing page"]
*Suggested response:* [specific pricing or messaging change]
*Urgency:* [high/medium/low]
*Source:* [URL]

Rules:
- Be direct and actionable
- Urgency: high if price dropped >20%, medium otherwise
- Max 6 lines`
}

// ─── generateBrief ────────────────────────────────────────────────────────────

/**
 * Generates a founder-ready Telegram brief from the structured analysis.
 *
 * Falls back to a deterministic mock brief if OPENAI_API_KEY is not set.
 */
export async function generateBrief(
  analysis: AnalysisResult,
  resolvedWorkflowType: "feature_gap" | "pricing_response",
  userSiteUrl: string | undefined,
  competitorUrl: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini"

  if (!apiKey) {
    console.warn("[competitor-alert/briefGenerator] OPENAI_API_KEY not set — using mock brief")
    return resolvedWorkflowType === "feature_gap"
      ? mockFeatureBrief(analysis, competitorUrl)
      : mockPricingBrief(analysis, competitorUrl)
  }

  const prompt =
    resolvedWorkflowType === "feature_gap"
      ? buildFeatureBriefPrompt(analysis, userSiteUrl, competitorUrl)
      : buildPricingBriefPrompt(analysis, userSiteUrl, competitorUrl)

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 400,
    }),
    signal: AbortSignal.timeout(30_000),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`OpenAI brief generation failed: HTTP ${response.status} — ${text.slice(0, 200)}`)
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>
  }

  const brief = data.choices[0]?.message?.content?.trim()
  if (!brief) throw new Error("OpenAI returned an empty brief")

  return brief
}
