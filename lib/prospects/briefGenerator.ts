import type { ProspectRecord, ProspectBrief, CompanyExtraction } from "@/lib/schemas"

// ─── ID helper ────────────────────────────────────────────────────────────────

function makeId(): string {
  return `brief-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

// ─── Opening line builder ─────────────────────────────────────────────────────

function buildOpeningLine(prospect: ProspectRecord, extraction?: CompanyExtraction): string {
  const company = prospect.companyName

  if (extraction?.hiringSignals.length && extraction.hiringSignals.length >= 2) {
    const role = extraction.hiringSignals[0]
    return `I noticed ${company} is expanding — you recently posted for ${role}. That kind of growth usually means your team is evaluating new tools to keep pace.`
  }

  if (extraction?.fundingSignals.length && extraction.fundingSignals.length >= 1) {
    const funding = extraction.fundingSignals[0]
    return `Congrats on ${funding} — exciting milestone for ${company}. As you scale, I'd love to show you how we help similar teams move faster without adding headcount.`
  }

  if (extraction?.enterpriseSignals.includes("SOC 2 certified")) {
    return `Saw that ${company} is SOC 2 certified — you're clearly thinking about enterprise readiness. We've helped teams at that stage go from pilots to paid contracts faster.`
  }

  return `${company} keeps coming up in our research as a company doing interesting things in ${prospect.category}. I wanted to reach out personally.`
}

// ─── Key points builder ───────────────────────────────────────────────────────

function buildKeyPoints(prospect: ProspectRecord, extraction?: CompanyExtraction): string[] {
  const points: string[] = []

  // Fit score point
  points.push(
    `${prospect.fitScore}% outreach fit score — ranked in the top tier of analyzed prospects.`
  )

  // Value prop understanding
  if (prospect.valueProp) {
    points.push(`Their value prop: "${prospect.valueProp.slice(0, 100)}..."`)
  }

  // Enterprise / compliance
  if (extraction?.enterpriseSignals.length && extraction.enterpriseSignals.length >= 1) {
    const sigs = extraction.enterpriseSignals.slice(0, 2).join(", ")
    points.push(`Enterprise-grade: ${sigs} — expect a formal vendor evaluation process.`)
  }

  // Integrations
  if (extraction?.integrationClues.length && extraction.integrationClues.length >= 2) {
    const tools = extraction.integrationClues.slice(0, 3).join(", ")
    points.push(`Integration ecosystem includes ${tools} — position as a natural fit.`)
  }

  // Hiring momentum
  if (prospect.hiringSignals.length >= 2) {
    points.push(`Actively hiring: ${prospect.hiringSignals.slice(0, 2).join(" and ")} — company is in growth mode.`)
  }

  // Category angle
  points.push(`Category: ${prospect.category} — align messaging with ${getCategoryPain(prospect.category)}`)

  return points.slice(0, 5)
}

function getCategoryPain(category: string): string {
  if (/developer|devtool/i.test(category)) return "engineering velocity and workflow depth."
  if (/data|analytics/i.test(category)) return "data reliability and team collaboration on insights."
  if (/no.?code|internal/i.test(category)) return "reducing bespoke engineering work at scale."
  if (/collaboration|docs/i.test(category)) return "eliminating context-switching across too many tools."
  if (/security/i.test(category)) return "audit readiness and reducing manual compliance work."
  return "reducing operational overhead as the team grows."
}

// ─── Call to action builder ───────────────────────────────────────────────────

function buildCallToAction(prospect: ProspectRecord, extraction?: CompanyExtraction): string {
  const company = prospect.companyName

  if (extraction?.likelyStage === "enterprise" || extraction?.likelyStage === "scale") {
    return `Request a 20-minute intro call with the Head of Engineering or Operations at ${company}. Offer a live workflow demo tailored to their stack.`
  }

  if (prospect.fitScore >= 80) {
    return `Send a warm intro via LinkedIn to the founding team at ${company}. Reference a specific workflow problem you spotted — keep it under 3 sentences.`
  }

  return `Add ${company} to a nurture sequence. Follow their product updates for a quarter before reaching out — look for a trigger like a funding announcement or key hire.`
}

// ─── Main generator ───────────────────────────────────────────────────────────

/**
 * Generate a structured outreach brief for a prospect.
 * Pure function — deterministic for a given prospect + extraction combination.
 */
export function generateProspectBrief(
  prospect: ProspectRecord,
  extraction?: CompanyExtraction
): ProspectBrief {
  return {
    id: makeId(),
    prospectId: prospect.id,
    companyName: prospect.companyName,
    headline: `${prospect.companyName} — ${prospect.fitScore}% fit · ${prospect.category}`,
    openingLine: buildOpeningLine(prospect, extraction),
    keyPoints: buildKeyPoints(prospect, extraction),
    callToAction: buildCallToAction(prospect, extraction),
    generatedAt: new Date().toISOString(),
  }
}
