import type { CompanyExtraction, LikelyStage, StartupProfile } from "@/lib/schemas"

// ─── Stage score lookup ───────────────────────────────────────────────────────

const STAGE_SCORE: Record<LikelyStage, number> = {
  enterprise: 18,
  scale: 15,
  growth: 10,
  early: 2,
  unknown: 5,
}

// ─── B2B relevance detection ──────────────────────────────────────────────────

const B2B_CATEGORY_SIGNALS = [
  "Developer Tools",
  "No-code / Low-code",
  "Project Management",
  "Collaboration / Docs",
  "Analytics / BI",
  "Data / Analytics",
  "CRM / Sales",
  "Security / Compliance",
  "HR / People",
  "Finance / Payments",
  "Marketing",
  "B2B SaaS",
]

function isB2BFocused(extraction: CompanyExtraction): boolean {
  return (
    B2B_CATEGORY_SIGNALS.some((cat) => extraction.category.includes(cat.split("/")[0].trim())) ||
    extraction.enterpriseSignals.length > 0 ||
    /b2b|enterprise|teams|business|company/i.test(extraction.valueProp)
  )
}

// ─── Main fit scorer ──────────────────────────────────────────────────────────

/**
 * Score how well a prospect company fits for outreach, 0–100.
 *
 * Factors:
 *   1. B2B alignment with the founder's startup profile (± 15)
 *   2. Stage of the prospect (companies with budget are better targets) (+2–18)
 *   3. Hiring signals (buying mode indicator) (+5–12)
 *   4. Enterprise maturity signals (budget signal) (+5–12)
 *   5. Integration ecosystem overlap (workflow tool spend signal) (+3–8)
 *   6. Funding signal strength (+3–8)
 *
 * Base score: 42 (average B2B company before signals)
 */
export function scoreProspectFit(
  extraction: CompanyExtraction,
  profile?: StartupProfile
): number {
  let score = 42

  // 1. B2B alignment
  const b2b = isB2BFocused(extraction)
  if (profile?.businessModel === "b2b" || profile?.businessModel === "b2b2c") {
    score += b2b ? 15 : -8
  } else {
    score += b2b ? 5 : 0
  }

  // 2. Stage (companies with established teams have budget)
  score += STAGE_SCORE[extraction.likelyStage]

  // 3. Hiring signals (active hiring = growth = buying new tools)
  const hiringCount = extraction.hiringSignals.length
  if (hiringCount >= 4) score += 12
  else if (hiringCount >= 2) score += 8
  else if (hiringCount >= 1) score += 5

  // 4. Enterprise signals (compliance = dedicated tooling budget)
  const entCount = extraction.enterpriseSignals.length
  if (entCount >= 4) score += 12
  else if (entCount >= 2) score += 8
  else if (entCount >= 1) score += 5

  // 5. Integration clues (more integrations = heavier tooling buyer)
  const intCount = extraction.integrationClues.length
  if (intCount >= 5) score += 8
  else if (intCount >= 3) score += 5
  else if (intCount >= 1) score += 3

  // 6. Funding signals (funded = has budget, team, and growth pressure)
  const fundCount = extraction.fundingSignals.length
  if (fundCount >= 2) score += 8
  else if (fundCount >= 1) score += 4

  return Math.min(100, Math.max(0, Math.round(score)))
}

// ─── Maturity signals ─────────────────────────────────────────────────────────

/**
 * Derive a human-readable list of maturity signals from an extraction.
 * Used to populate ProspectRecord.maturitySignals.
 */
export function buildMaturitySignals(extraction: CompanyExtraction): string[] {
  const signals: string[] = []

  for (const s of extraction.fundingSignals.slice(0, 2)) signals.push(s)
  for (const s of extraction.enterpriseSignals.slice(0, 2)) signals.push(s)

  if (extraction.likelyStage === "enterprise") signals.push("Enterprise-scale company")
  if (extraction.likelyStage === "scale") signals.push("Scaled startup (Series C+)")
  if (extraction.integrationClues.length >= 4) {
    signals.push(`${extraction.integrationClues.length}+ native integrations`)
  }

  return signals.slice(0, 4)
}

// ─── Recommended angle ────────────────────────────────────────────────────────

const ANGLE_TEMPLATES: [RegExp, string][] = [
  [
    /developer|devtool|cli|sdk/i,
    "Target technical founders and engineering leads. Lead with workflow depth and developer experience — avoid marketing-speak.",
  ],
  [
    /no.?code|low.?code|internal tool/i,
    "Focus on ROI and time savings. Their users are technical PMs — show how your product reduces manual work without engineering effort.",
  ],
  [
    /data|analytics|BI/i,
    "Target analytics leads and data teams. Emphasize structured output, clean data models, and compatibility with their existing stack.",
  ],
  [
    /collaboration|docs|wiki|workspace/i,
    "Target team leads and ops. Focus on how your product fills gaps where collaborative docs hit their limits.",
  ],
  [
    /security|compliance/i,
    "Lead with security credentials and compliance posture. These buyers have thorough vendor review processes — be ready with SOC 2 or equivalent.",
  ],
  [
    /crm|sales|marketing/i,
    "Target RevOps and sales leadership. Focus on pipeline impact, time-to-value, and integration with their CRM.",
  ],
]

export function buildRecommendedAngle(extraction: CompanyExtraction): string {
  for (const [pattern, angle] of ANGLE_TEMPLATES) {
    if (pattern.test(extraction.category)) return angle
  }

  // Generic angle based on stage
  if (extraction.likelyStage === "enterprise" || extraction.likelyStage === "scale") {
    return `${extraction.companyName} is a scaled company with established tooling budgets. Lead with ROI data, security posture, and enterprise SLA. Request intro to the Head of Engineering or Operations.`
  }

  return `${extraction.companyName} is in growth mode — their team is expanding and actively buying new tools. Lead with speed-to-value and reference a similar company in their category.`
}
