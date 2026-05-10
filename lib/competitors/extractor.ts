import type {
  RawExtraction,
  PageCategory,
  CompetitorPageExtraction,
  PricingPlan,
  HiringRole,
} from "@/lib/schemas"

// ─── Page category detection ──────────────────────────────────────────────────

/**
 * Infer which category of page this is from the URL and, if needed, content.
 * URL patterns take precedence over content signals.
 */
export function detectPageCategory(url: string, content: string): PageCategory {
  const u = url.toLowerCase()
  const c = content.toLowerCase()

  // URL-based (most reliable)
  if (u.includes("/pricing") || u.includes("/plans")) return "pricing"
  if (u.includes("/careers") || u.includes("/jobs") || u.includes("/hiring")) return "careers"
  if (
    u.includes("/changelog") ||
    u.includes("/releases") ||
    u.includes("/release-notes") ||
    u.includes("/whats-new")
  )
    return "changelog"
  if (u.includes("/blog") || u.includes("/news") || u.includes("/announcement")) return "blog"

  // Content-based fallback
  if (
    /\$\d/.test(c) &&
    /\/month|per month|\/year|per year|\/seat|per seat|per user/.test(c)
  )
    return "pricing"
  if (c.includes("open role") || c.includes("we are hiring") || c.includes("join our team"))
    return "careers"
  if (c.includes("what's new") || c.includes("changelog") || c.includes("release notes"))
    return "changelog"
  if (c.includes("announcing") || c.includes("today we're thrilled")) return "blog"

  return "homepage"
}

// ─── Competitor name extraction ───────────────────────────────────────────────

/**
 * Best-effort competitor name from the page title or URL hostname.
 * Uses the provided override first when a source has a human-readable label.
 */
export function extractCompetitorName(url: string, title?: string): string {
  if (title) {
    // Title is often "Company — Page title", take the first segment
    const segment = title.split(/[|\-—]/)[0].trim()
    if (segment.length > 0 && segment.length < 60) return segment
  }

  try {
    const hostname = new URL(url).hostname.replace("www.", "")
    const parts = hostname.split(".")
    const name = parts[0]
    return name.charAt(0).toUpperCase() + name.slice(1)
  } catch {
    return "Unknown"
  }
}

// ─── Structured field extraction ──────────────────────────────────────────────

/**
 * Extract pricing plans from a pricing-page markdown block.
 * Looks for `## Plan Name` headings followed by price lines and feature lists.
 */
export function extractPricingPlans(markdown: string): PricingPlan[] {
  const plans: PricingPlan[] = []
  // Split by ## headings (plan sections)
  const sections = markdown.split(/\n(?=##\s)/g).slice(1)

  for (const section of sections) {
    const lines = section.split("\n").map((l) => l.trim()).filter(Boolean)
    if (lines.length === 0) continue

    const name = lines[0].replace(/^##\s+/, "").trim()
    if (!name || name === "#") continue

    // Find price (anything that looks like $N or $N/month)
    const priceLine = lines.find((l) => /\$[\d,]+/.test(l))
    const price = priceLine ? priceLine.match(/\$[\d,.]+(?:[\w/ ]*)?/)?.[0] ?? undefined : undefined

    // Features are bullet-point lines
    const features = lines
      .filter((l) => l.startsWith("-") || l.startsWith("*") || l.startsWith("•"))
      .map((l) => l.replace(/^[-*•]\s*/, "").trim())
      .filter(Boolean)

    plans.push({ name, price, features })
  }

  return plans
}

/**
 * Extract open job roles from a careers-page markdown block.
 * Looks for `## Open Roles`, `## Engineering`, etc. headings and their list items.
 */
export function extractOpenRoles(markdown: string): HiringRole[] {
  const roles: HiringRole[] = []
  const lines = markdown.split("\n")

  // Matches both `## Engineering` (H2) and `**Engineering**` (bold label)
  const deptHeadingRe =
    /^(?:#{1,3}\s+|\*\*)(Engineering|Go-to-Market|Sales|Marketing|Product|Design|Finance|Operations|Data|Research|Support)\b[*]*/i
  let currentDept: string | undefined

  for (const rawLine of lines) {
    const line = rawLine.trim()

    // Track department headings
    const deptMatch = deptHeadingRe.exec(line)
    if (deptMatch) {
      currentDept = deptMatch[1]
      continue
    }

    // Role entries are markdown list items
    if ((line.startsWith("-") || line.startsWith("*")) && line.length > 3) {
      const title = line
        .replace(/^[-*]\s*/, "")
        .replace(/\*\*/g, "")
        .trim()

      // Extract location from parentheses, e.g. "(Remote)" or "(New York)"
      const locationMatch = title.match(/\(([^)]+)\)\s*$/)
      const location = locationMatch?.[1]
      const cleanTitle = location
        ? title.slice(0, title.lastIndexOf("(")).trim()
        : title

      if (cleanTitle.length > 2) {
        roles.push({ title: cleanTitle, department: currentDept, location })
      }
    }
  }

  return roles
}

/** Extract the top-level H1 heading as the page headline. */
export function extractHeadline(markdown: string): string | undefined {
  const match = /^#\s+(.+?)$/m.exec(markdown)
  return match?.[1]?.trim()
}

/**
 * Extract key messages from a homepage by collecting H2 section headings
 * and the first sentence after each.
 */
export function extractKeyMessages(markdown: string): string[] {
  const messages: string[] = []
  const sections = markdown.split(/\n(?=##\s)/g).slice(1)

  for (const section of sections) {
    const lines = section.split("\n").filter((l) => l.trim())
    if (lines.length < 2) continue
    const heading = lines[0].replace(/^##\s+/, "").trim()
    // Take the heading as the key message
    if (heading && heading.length < 80) {
      messages.push(heading)
    }
  }

  return messages.slice(0, 5)
}

// ─── Main extractor ───────────────────────────────────────────────────────────

/**
 * Convert a raw provider extraction into a structured competitor page extraction.
 *
 * @param extraction   The raw extraction from the ingestion pipeline.
 * @param competitorName  Optional override; falls back to URL/title heuristic.
 */
export function extractCompetitorPage(
  extraction: RawExtraction,
  competitorName?: string
): CompetitorPageExtraction {
  const content = extraction.markdown ?? extraction.textPreview ?? ""
  const url = extraction.url
  const category = detectPageCategory(url, content)
  const name = competitorName ?? extractCompetitorName(url, extraction.title)

  return {
    id: `cpe-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sourceId: extraction.sourceId,
    competitorName: name,
    pageCategory: category,
    url,
    rawContent: content,
    normalizedContent: content.trim(),
    extractedAt: extraction.fetchedAt,
    plans: category === "pricing" ? extractPricingPlans(content) : undefined,
    openRoles: category === "careers" ? extractOpenRoles(content) : undefined,
    headline: extractHeadline(content),
    keyMessages: category === "homepage" ? extractKeyMessages(content) : undefined,
  }
}
