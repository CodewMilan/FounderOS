/**
 * openaiService
 *
 * Centralised OpenAI caller for all workflow analysis needs.
 * Falls back to deterministic mock objects when OPENAI_API_KEY is not set.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FeatureGapBrief {
  competitorName: string
  featureName: string
  whatItDoes: string
  gap: string
  whyItMatters: string
  suggestedAction: string
  confidence: "high" | "medium" | "low"
  sourceUrl: string
}

export interface PricingResponseBrief {
  competitorName: string
  changeDetected: string
  theirPricing: string
  yourPositioning: string
  suggestedResponse: string
  urgency: "high" | "medium" | "low"
  sourceUrl: string
}

export interface ProspectBrief {
  companyName: string
  description: string
  icpFit: "high" | "medium" | "low"
  keySignals: string[]
  outreachAngle: string
  confidence: "high" | "medium" | "low"
  sourceUrl: string
}

export interface FundingBrief {
  programName: string
  provider: string
  deadline: string
  isUrgent: boolean
  eligibility: string
  fitReason: string
  applyUrl: string
}

// ─── Mock fallbacks ───────────────────────────────────────────────────────────

function mockFeatureGapBrief(competitorUrl: string): FeatureGapBrief {
  return {
    competitorName: "Acme Corp",
    featureName: "AI Assistant",
    whatItDoes: "An AI-powered assistant that answers customer questions instantly using your docs.",
    gap: "You don't currently offer an in-product AI assistant.",
    whyItMatters: "Customers comparing tools will see this as a major differentiator.",
    suggestedAction: "Add a lightweight AI chat widget to your dashboard — a 2-week sprint.",
    confidence: "medium",
    sourceUrl: competitorUrl,
  }
}

function mockPricingResponseBrief(competitorUrl: string): PricingResponseBrief {
  return {
    competitorName: "Acme Corp",
    changeDetected: "Starter plan price raised from $19/mo to $29/mo (+53%)",
    theirPricing: "Starter $29/mo · Pro $99/mo · Enterprise custom",
    yourPositioning: "Not provided — review your pricing page",
    suggestedResponse: "Highlight your lower entry price and better value-per-feature in your messaging.",
    urgency: "medium",
    sourceUrl: competitorUrl,
  }
}

function mockProspectBrief(prospectUrl: string): ProspectBrief {
  return {
    companyName: "TechFlow Inc",
    description: "TechFlow builds workflow automation tools for mid-market SaaS companies.",
    icpFit: "high",
    keySignals: [
      "Hiring 3 backend engineers — suggests active product expansion",
      "Recently launched EU data region — indicates enterprise push",
      "Posted about AI integration in their latest blog — signals buy vs build decision",
    ],
    outreachAngle: "Lead with your AI-native data pipeline — they're actively evaluating AI integrations.",
    confidence: "high",
    sourceUrl: prospectUrl,
  }
}

function mockFundingBrief(fundingUrl: string): FundingBrief {
  const deadline = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!
  return {
    programName: "Startup India Seed Fund",
    provider: "DPIIT / Government of India",
    deadline,
    isUrgent: true,
    eligibility: "DPIIT-recognised startups, <2 years old, not previously funded",
    fitReason: "Strong match for AI/data tools startup at pre-seed stage in India.",
    applyUrl: fundingUrl,
  }
}

// ─── OpenAI caller ────────────────────────────────────────────────────────────

async function callOpenAI(systemPrompt: string, userMessage: string): Promise<unknown> {
  const apiKey = process.env.OPENAI_API_KEY
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini"

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
    signal: AbortSignal.timeout(30_000),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`OpenAI request failed: HTTP ${response.status} — ${text.slice(0, 200)}`)
  }

  const data = await response.json() as { choices: Array<{ message: { content: string } }> }
  const raw = data.choices[0]?.message?.content
  if (!raw) throw new Error("OpenAI returned an empty response")

  try {
    return JSON.parse(raw)
  } catch {
    throw new Error(`OpenAI returned non-JSON: ${raw.slice(0, 200)}`)
  }
}

// ─── analyzeFeatures ──────────────────────────────────────────────────────────

const FEATURE_SYSTEM_PROMPT = `You are a competitive intelligence analyst.
Analyze competitor and optionally the user's site content (markdown) and return a feature gap brief.
Return ONLY valid JSON with this exact shape:
{
  "competitorName": string,
  "featureName": string,
  "whatItDoes": string,
  "gap": string,
  "whyItMatters": string,
  "suggestedAction": string,
  "confidence": "high" | "medium" | "low",
  "sourceUrl": string
}
Focus on the most impactful single feature. Be direct and founder-friendly.`

export async function analyzeFeatures(
  markdown: string,
  competitorUrl: string,
  userMarkdown?: string
): Promise<FeatureGapBrief> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("[openaiService] OPENAI_API_KEY not set — using mock feature gap brief")
    return mockFeatureGapBrief(competitorUrl)
  }

  const userMessage = [
    `Competitor URL: ${competitorUrl}`,
    `Competitor site content:\n${markdown.slice(0, 6000)}`,
    userMarkdown ? `\nFounder's site content:\n${userMarkdown.slice(0, 3000)}` : "",
  ].join("\n")

  const result = await callOpenAI(FEATURE_SYSTEM_PROMPT, userMessage)
  return result as FeatureGapBrief
}

// ─── analyzePricing ───────────────────────────────────────────────────────────

const PRICING_SYSTEM_PROMPT = `You are a pricing strategist for startups.
Analyze competitor pricing signals and return a pricing response brief.
Return ONLY valid JSON with this exact shape:
{
  "competitorName": string,
  "changeDetected": string,
  "theirPricing": string,
  "yourPositioning": string,
  "suggestedResponse": string,
  "urgency": "high" | "medium" | "low",
  "sourceUrl": string
}
Urgency: high if price dropped >20%, medium for other changes, low for no change.`

export async function analyzePricing(
  markdown: string,
  competitorUrl: string,
  userMarkdown?: string
): Promise<PricingResponseBrief> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("[openaiService] OPENAI_API_KEY not set — using mock pricing brief")
    return mockPricingResponseBrief(competitorUrl)
  }

  const userMessage = [
    `Competitor URL: ${competitorUrl}`,
    `Competitor site content:\n${markdown.slice(0, 6000)}`,
    userMarkdown ? `\nFounder's pricing page:\n${userMarkdown.slice(0, 3000)}` : "",
  ].join("\n")

  const result = await callOpenAI(PRICING_SYSTEM_PROMPT, userMessage)
  return result as PricingResponseBrief
}

// ─── extractProspectSignals ───────────────────────────────────────────────────

const PROSPECT_SYSTEM_PROMPT = `You are a B2B sales intelligence analyst.
Analyze the prospect company's website and extract a founder-ready brief.
Return ONLY valid JSON with this exact shape:
{
  "companyName": string,
  "description": string,
  "icpFit": "high" | "medium" | "low",
  "keySignals": string[],
  "outreachAngle": string,
  "confidence": "high" | "medium" | "low",
  "sourceUrl": string
}
keySignals: exactly 3 bullet strings about hiring, expansion, growth, or buying signals.
outreachAngle: one specific, actionable recommendation for first outreach.`

export async function extractProspectSignals(
  markdown: string,
  prospectUrl: string
): Promise<ProspectBrief> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("[openaiService] OPENAI_API_KEY not set — using mock prospect brief")
    return mockProspectBrief(prospectUrl)
  }

  const userMessage = `Prospect URL: ${prospectUrl}\n\nSite content:\n${markdown.slice(0, 8000)}`
  const result = await callOpenAI(PROSPECT_SYSTEM_PROMPT, userMessage)
  return result as ProspectBrief
}

// ─── classifyPageType ─────────────────────────────────────────────────────────

export type PageType = "competitor" | "prospect" | "funding" | "unknown"

function mockClassifyPageType(markdown: string, url: string): PageType {
  const text = (markdown + " " + url).toLowerCase()
  if (
    text.includes("grant") ||
    text.includes("accelerator") ||
    text.includes("fund") ||
    text.includes("vc.com") ||
    text.includes("investor") ||
    text.includes("fellowship")
  ) {
    return "funding"
  }
  if (
    text.includes("pricing") ||
    text.includes("features") ||
    text.includes("vs ") ||
    text.includes("plans") ||
    text.includes("changelog")
  ) {
    return "competitor"
  }
  return "prospect"
}

const CLASSIFY_SYSTEM_PROMPT = `You are a URL classifier for a founder intelligence tool.
Given a page's content, classify it into exactly one of these types:
- "competitor": a product/SaaS company website, pricing page, or feature page
- "prospect": a B2B company website that could be a sales target
- "funding": a grant, VC fund, accelerator, fellowship, or startup funding program
- "unknown": none of the above

Return ONLY valid JSON with this exact shape: { "type": "competitor" | "prospect" | "funding" | "unknown" }`

export async function classifyPageType(markdown: string, url: string): Promise<PageType> {
  if (!process.env.OPENAI_API_KEY) {
    return mockClassifyPageType(markdown, url)
  }

  try {
    const userMessage = `URL: ${url}\n\nPage content (first 4000 chars):\n${markdown.slice(0, 4000)}`
    const result = await callOpenAI(CLASSIFY_SYSTEM_PROMPT, userMessage)
    const typed = result as { type?: string }
    const allowed: PageType[] = ["competitor", "prospect", "funding", "unknown"]
    if (typeof typed.type === "string" && allowed.includes(typed.type as PageType)) {
      return typed.type as PageType
    }
    return "unknown"
  } catch {
    console.warn("[openaiService] classifyPageType failed — falling back to heuristic")
    return mockClassifyPageType(markdown, url)
  }
}

// ─── extractFundingInfo ───────────────────────────────────────────────────────

const FUNDING_SYSTEM_PROMPT = `You are a startup funding analyst.
Analyze this funding/grant opportunity page and extract structured info.
Return ONLY valid JSON with this exact shape:
{
  "programName": string,
  "provider": string,
  "deadline": string,
  "isUrgent": boolean,
  "eligibility": string,
  "fitReason": string,
  "applyUrl": string
}
isUrgent: true if deadline is within 14 days from today.
fitReason: why this matches an AI/data tools startup in India.
deadline: ISO date string YYYY-MM-DD or "Unknown".`

export async function extractFundingInfo(
  markdown: string,
  fundingUrl: string
): Promise<FundingBrief> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("[openaiService] OPENAI_API_KEY not set — using mock funding brief")
    return mockFundingBrief(fundingUrl)
  }

  const today = new Date().toISOString().split("T")[0]
  const userMessage = `Today's date: ${today}\nFunding URL: ${fundingUrl}\n\nPage content:\n${markdown.slice(0, 8000)}`
  const result = await callOpenAI(FUNDING_SYSTEM_PROMPT, userMessage)
  return result as FundingBrief
}
