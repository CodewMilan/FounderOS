/**
 * url-detector
 *
 * Classifies a URL into one of four workflow types so the unified
 * /api/workflows/run endpoint can route automatically without user input.
 *
 * Three-layer cascade — all layers are mock-safe:
 * 1. Known competitor hostname match (synchronous, no I/O)
 * 2. URL keyword heuristic (synchronous, no I/O)
 * 3. Scrape + OpenAI classify (async, mocked when no OPENAI_API_KEY)
 */

import { scrapeUrl } from "@/lib/services/anakinService"
import { classifyPageType, type PageType } from "@/lib/services/openaiService"
import type { UrlType } from "@/lib/schemas/workflows"

// ─── Layer 1: known competitor hostnames ──────────────────────────────────────

const KNOWN_COMPETITOR_HOSTNAMES = [
  "linear.app",
  "notion.so",
  "clickup.com",
  "asana.com",
  "monday.com",
  "trello.com",
  "basecamp.com",
  "jira.atlassian.com",
  "atlassian.com",
  "airtable.com",
  "todoist.com",
  "height.app",
  "craft.do",
  "coda.io",
  "fibery.io",
  "productboard.com",
  "intercom.com",
  "hubspot.com",
  "salesforce.com",
  "pipedrive.com",
  "zendesk.com",
  "freshworks.com",
  "close.com",
  "loom.com",
  "miro.com",
  "figma.com",
  "canva.com",
  "slack.com",
  "discord.com",
  "zoom.us",
  "typeform.com",
  "webflow.com",
  "bubble.io",
  "retool.com",
  "vercel.com",
  "netlify.com",
]

function isKnownCompetitor(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "")
    return KNOWN_COMPETITOR_HOSTNAMES.some((known) => hostname === known || hostname.endsWith(`.${known}`))
  } catch {
    return false
  }
}

// ─── Layer 2: URL keyword heuristic ──────────────────────────────────────────

function heuristicUrlType(url: string): UrlType | null {
  const lower = url.toLowerCase()

  // Funding signals in URL
  if (
    lower.includes("grant") ||
    lower.includes("fellowship") ||
    lower.includes("accelerator") ||
    lower.includes("incubator") ||
    lower.includes("ycombinator") ||
    lower.includes("techstars") ||
    lower.includes("antler") ||
    lower.includes("fund") ||
    lower.includes("investor") ||
    lower.includes("venture") ||
    lower.includes("dpiit") ||
    lower.includes("startup-india") ||
    lower.includes("solana.org/grants") ||
    lower.includes("grants.gov")
  ) {
    return "funding"
  }

  // Strong competitor signals in URL path
  const path = (() => {
    try { return new URL(url).pathname.toLowerCase() }
    catch { return "" }
  })()

  if (
    path.includes("/pricing") ||
    path.includes("/features") ||
    path.includes("/changelog") ||
    path.includes("/vs-") ||
    path.includes("/compare") ||
    path.includes("/plans")
  ) {
    return "competitor"
  }

  return null
}

// ─── Main detector ────────────────────────────────────────────────────────────

export async function detectUrlType(url: string): Promise<UrlType> {
  // Layer 1 — known competitor
  if (isKnownCompetitor(url)) {
    return "competitor"
  }

  // Layer 2 — heuristic
  const heuristic = heuristicUrlType(url)
  if (heuristic !== null) {
    return heuristic
  }

  // Layer 3 — scrape + classify
  try {
    const scrape = await scrapeUrl(url)
    const pageType: PageType = await classifyPageType(scrape.markdown, url)
    return pageType as UrlType
  } catch (err) {
    console.warn("[url-detector] classify failed — defaulting to unknown", err)
    return "unknown"
  }
}

// Export for tests
export { isKnownCompetitor, heuristicUrlType }
