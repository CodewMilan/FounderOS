import type { RawExtraction, CompanyExtraction, LikelyStage } from "@/lib/schemas"

// ─── Company name ─────────────────────────────────────────────────────────────

export function extractCompanyName(url: string, markdown: string, override?: string): string {
  if (override && override.trim().length > 0) return override.trim()

  // Try H1
  const h1 = /^#\s+(.+?)$/m.exec(markdown)
  if (h1 && h1[1].length < 60) {
    const candidate = h1[1].trim()
    // Skip generic headlines like "The smartest way to..."
    if (!/^(the |a |an )/i.test(candidate)) return candidate
  }

  // Fallback to domain hostname
  try {
    const hostname = new URL(url).hostname.replace("www.", "")
    const parts = hostname.split(".")
    const name = parts[0]
    return name.charAt(0).toUpperCase() + name.slice(1)
  } catch {
    return "Unknown Company"
  }
}

// ─── Category detection ───────────────────────────────────────────────────────

const CATEGORY_PATTERNS: [RegExp, string][] = [
  [/data\s*(analytics|warehouse|pipeline|platform|science|viz)/i, "Data / Analytics"],
  [/developer|devtool|dev tool|cli|sdk|api\s*platform|infrastructure/i, "Developer Tools"],
  [/no.?code|low.?code|visual builder|drag.?and.?drop/i, "No-code / Low-code"],
  [/crm|customer relationship|sales force|salesforce/i, "CRM / Sales"],
  [/project.?manage|issue.?track|sprint|kanban|task manage/i, "Project Management"],
  [/collaboration|document|wiki|knowledge base|workspace/i, "Collaboration / Docs"],
  [/analytics|business intelligence|BI tool|reporting|dashboard/i, "Analytics / BI"],
  [/security|compliance|soc\s*2|pen.?test|vulnerability/i, "Security / Compliance"],
  [/hr|human resources|payroll|recruitment|hiring platform/i, "HR / People"],
  [/finance|accounting|expense|invoice|payments/i, "Finance / Payments"],
  [/design|figma|prototyp|ui kit|design system/i, "Design Tools"],
  [/marketing|email|campaign|seo|growth/i, "Marketing"],
  [/e.?commerce|shopify|marketplace|retail/i, "E-commerce"],
  [/ai|machine learning|llm|gpt|nlp/i, "AI / ML"],
  [/productivity|task|todo|time.?track|calendar/i, "Productivity"],
]

export function detectCategory(markdown: string): string {
  const c = markdown.toLowerCase()
  for (const [pattern, category] of CATEGORY_PATTERNS) {
    if (pattern.test(c)) return category
  }
  return "B2B SaaS"
}

// ─── Value proposition ────────────────────────────────────────────────────────

export function extractValueProp(markdown: string): string {
  // Look for the first substantial paragraph after an H1
  const lines = markdown.split("\n")
  let passedH1 = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (/^#\s/.test(trimmed)) {
      passedH1 = true
      continue
    }
    if (
      passedH1 &&
      trimmed.length > 30 &&
      trimmed.length < 250 &&
      !trimmed.startsWith("#") &&
      !trimmed.startsWith("-") &&
      !trimmed.startsWith("*") &&
      !trimmed.startsWith(">")
    ) {
      return trimmed
    }
  }

  // Fallback: first long line
  return (
    lines.find((l) => l.trim().length > 40 && !l.trim().startsWith("#"))?.trim() ??
    "No description available."
  )
}

// ─── Likely stage ─────────────────────────────────────────────────────────────

export function inferLikelyStage(markdown: string): LikelyStage {
  const c = markdown.toLowerCase()

  if (/series\s*[de]|ipo|public company|nasdaq|nyse|\$[5-9]\d{2}m|\$[1-9]\d{3}m/i.test(c))
    return "enterprise"
  if (/series\s*c|series\s*d|\$[1-4]\d{2}m raised/i.test(c)) return "scale"
  if (/series\s*[ab]|\$\d{1,3}m raised|raised \$\d+m/i.test(c)) return "growth"
  if (/seed|pre-seed|angel|bootstrapped|early.?stage/i.test(c)) return "early"

  // Infer from enterprise signals
  if (
    /soc\s*2|hipaa|gdpr complian|iso\s*27001|fedramp/i.test(c) &&
    /enterprise|fortune\s*500/i.test(c)
  )
    return "enterprise"
  if (/1,000|10,000|100,000|1 million|10 million/.test(c)) return "scale"

  return "unknown"
}

// ─── Signal extraction ────────────────────────────────────────────────────────

export function extractFundingSignals(markdown: string): string[] {
  const signals: string[] = []
  const patterns: [RegExp, string][] = [
    [/series\s*[a-e]/i, (m: string) => `Raised ${m[0].toUpperCase() + m.slice(1)}`],
    [/raised \$[\d,.]+[mb]/i, (m: string) => m.charAt(0).toUpperCase() + m.slice(1)],
    [/\$[\d,.]+[mb]\s*(?:in\s*)?(?:funding|investment|round)/i, (m: string) => m.charAt(0).toUpperCase() + m.slice(1)],
    [/backed by|investors include|portfolio/i, () => "VC-backed"],
    [/bootstrapped|profitable/i, () => "Bootstrapped / Profitable"],
  ] as unknown as [RegExp, string][]

  for (const [pattern, label] of patterns as unknown as [RegExp, (m: string) => string][]) {
    const match = pattern.exec(markdown)
    if (match) {
      const sig = typeof label === "function" ? label(match[0]) : label
      if (!signals.includes(sig)) signals.push(sig)
    }
  }
  return signals.slice(0, 4)
}

export function extractHiringSignals(markdown: string): string[] {
  const signals: string[] = []
  const c = markdown.toLowerCase()

  // Look for role mentions
  const roleMatches = markdown.match(/\b(vp|head of|director|manager|engineer|designer|marketer)\b[^.\n]{5,50}/gi) ?? []
  for (const match of roleMatches.slice(0, 4)) {
    const clean = match.trim().replace(/[*_]/g, "")
    if (clean.length > 8 && clean.length < 60) signals.push(clean)
  }

  // Generic hiring signals
  if (c.includes("we're hiring") || c.includes("we are hiring")) signals.push("Actively hiring")
  if (c.includes("open position") || c.includes("open role")) signals.push("Multiple open roles")
  if (c.includes("remote") && signals.length === 0) signals.push("Remote-friendly culture")

  return [...new Set(signals)].slice(0, 5)
}

export function extractEnterpriseSignals(markdown: string): string[] {
  const signals: string[] = []
  const patterns: [RegExp, string][] = [
    [/soc\s*2/i, "SOC 2 certified"],
    [/hipaa/i, "HIPAA compliant"],
    [/gdpr/i, "GDPR compliant"],
    [/iso\s*27001/i, "ISO 27001"],
    [/saml|sso/i, "SAML / SSO support"],
    [/audit\s*log/i, "Audit logs"],
    [/fedramp/i, "FedRAMP authorized"],
    [/99\.9|uptime\s*sla/i, "SLA / uptime guarantee"],
    [/enterprise\s*plan|enterprise\s*tier/i, "Enterprise tier available"],
    [/custom\s*contract|purchase\s*order/i, "Custom contracts"],
  ]
  for (const [pattern, label] of patterns) {
    if (pattern.test(markdown)) signals.push(label)
  }
  return signals.slice(0, 5)
}

export function extractIntegrationClues(markdown: string): string[] {
  const tools = [
    "Slack", "GitHub", "GitLab", "Salesforce", "HubSpot", "Jira",
    "Notion", "Figma", "Stripe", "Zapier", "Linear", "Airtable",
    "Google Workspace", "Microsoft 365", "Zoom", "Intercom",
    "Segment", "Amplitude", "Mixpanel", "Datadog",
  ]
  return tools.filter((t) => new RegExp(t, "i").test(markdown)).slice(0, 8)
}

// ─── Main extractor ───────────────────────────────────────────────────────────

/**
 * Convert a raw extraction into a structured CompanyExtraction.
 * Used by the prospect pipeline after a company page is scraped.
 */
export function extractCompanyData(
  extraction: RawExtraction,
  nameOverride?: string
): CompanyExtraction {
  const content = extraction.markdown ?? extraction.textPreview ?? ""

  return {
    id: `cex-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    url: extraction.url,
    companyName: extractCompanyName(extraction.url, content, nameOverride),
    category: detectCategory(content),
    valueProp: extractValueProp(content),
    likelyStage: inferLikelyStage(content),
    fundingSignals: extractFundingSignals(content),
    hiringSignals: extractHiringSignals(content),
    enterpriseSignals: extractEnterpriseSignals(content),
    integrationClues: extractIntegrationClues(content),
    rawContent: content,
    extractedAt: extraction.fetchedAt,
  }
}

// ─── Mock fixture data (used in tests and mock analyze endpoint) ──────────────

export const prospectFixtures: Record<string, CompanyExtraction> = {
  "retool.com": {
    id: "cex-retool",
    url: "https://retool.com",
    companyName: "Retool",
    category: "No-code / Low-code",
    valueProp:
      "Build internal tools in minutes using pre-built UI components and connect to any database or API.",
    likelyStage: "scale",
    fundingSignals: ["Series C ($140M raised)", "VC-backed (Sequoia, a16z)"],
    hiringSignals: ["VP of Marketing", "3 open Product Manager roles", "Expanding EU sales team"],
    enterpriseSignals: ["SOC 2 certified", "SAML / SSO support", "Audit logs", "SLA / uptime guarantee"],
    integrationClues: ["Salesforce", "Stripe", "GitHub", "Slack", "Google Workspace"],
    rawContent: "Build internal tools in minutes...",
    extractedAt: "2026-05-09T10:00:00.000Z",
  },
  "coda.io": {
    id: "cex-coda",
    url: "https://coda.io",
    companyName: "Coda",
    category: "Collaboration / Docs",
    valueProp:
      "A doc that acts like an app — combines documents, spreadsheets, and workflow automation.",
    likelyStage: "scale",
    fundingSignals: ["Series C ($100M)"],
    hiringSignals: ["Head of Enterprise Partnerships", "Solutions Engineer (Enterprise)"],
    enterpriseSignals: ["SOC 2 certified", "SAML / SSO support", "Enterprise tier available"],
    integrationClues: ["Slack", "GitHub", "Salesforce", "Figma", "Zapier"],
    rawContent: "A doc that acts like an app...",
    extractedAt: "2026-05-08T11:00:00.000Z",
  },
  "hex.tech": {
    id: "cex-hex",
    url: "https://hex.tech",
    companyName: "Hex",
    category: "Data / Analytics",
    valueProp:
      "Collaborative data workspace that combines SQL, Python, and no-code for analytics teams.",
    likelyStage: "growth",
    fundingSignals: ["Series B ($52M)"],
    hiringSignals: ["Data Infrastructure Engineer", "Developer Advocate", "Sales Engineer — Data"],
    enterpriseSignals: ["SOC 2 certified", "SAML / SSO support"],
    integrationClues: ["Snowflake", "BigQuery", "GitHub", "Slack"],
    rawContent: "Collaborative data workspace...",
    extractedAt: "2026-05-07T14:00:00.000Z",
  },
  "raycast.com": {
    id: "cex-raycast",
    url: "https://www.raycast.com",
    companyName: "Raycast",
    category: "Developer Tools",
    valueProp:
      "Supercharged macOS launcher with built-in AI, extensions, and team collaboration.",
    likelyStage: "growth",
    fundingSignals: ["Seed+ ($30M raised)"],
    hiringSignals: ["Growth Engineer", "Community Manager"],
    enterpriseSignals: [],
    integrationClues: ["GitHub", "Linear", "Notion", "Slack"],
    rawContent: "Supercharged macOS launcher...",
    extractedAt: "2026-05-06T09:00:00.000Z",
  },
  "linear.app": {
    id: "cex-linear",
    url: "https://linear.app",
    companyName: "Linear",
    category: "Project Management",
    valueProp:
      "Fast, opinionated issue tracking for software teams. Built for speed and clarity.",
    likelyStage: "growth",
    fundingSignals: ["Series B ($35M)"],
    hiringSignals: ["Enterprise Account Executive", "Head of Finance", "Infrastructure Engineer"],
    enterpriseSignals: ["SOC 2 certified", "SAML / SSO support", "Audit logs"],
    integrationClues: ["GitHub", "GitLab", "Figma", "Slack", "Linear"],
    rawContent: "Fast, opinionated issue tracking...",
    extractedAt: "2026-05-05T13:00:00.000Z",
  },
}

/** Return the closest mock fixture for a URL, or generate a generic one. */
export function getFixtureForUrl(url: string): CompanyExtraction | null {
  try {
    const hostname = new URL(url).hostname.replace("www.", "")
    return prospectFixtures[hostname] ?? null
  } catch {
    return null
  }
}
