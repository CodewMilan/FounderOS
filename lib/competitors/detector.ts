import type { PageCategory, ChangeType, CompetitorChange, CompetitorSnapshot } from "@/lib/schemas"

// ─── Diff computation ─────────────────────────────────────────────────────────

export interface DiffResult {
  hasChanges: boolean
  addedLines: string[]
  removedLines: string[]
  /** Fraction of lines that changed, 0–1. */
  changeRatio: number
}

/**
 * Compute a line-level diff between two text snapshots.
 * Returns the added/removed lines and a change ratio.
 */
export function computeDiff(previous: string, current: string): DiffResult {
  const prevLines = new Set(
    previous
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
  )
  const currLines = new Set(
    current
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
  )

  const addedLines = [...currLines].filter((l) => !prevLines.has(l))
  const removedLines = [...prevLines].filter((l) => !currLines.has(l))

  const totalUnique = new Set([...prevLines, ...currLines]).size
  const changedCount = addedLines.length + removedLines.length
  const changeRatio = totalUnique > 0 ? changedCount / totalUnique : 0

  return {
    hasChanges: changedCount > 0,
    addedLines,
    removedLines,
    changeRatio: Math.min(1, changeRatio),
  }
}

// ─── Change classification ────────────────────────────────────────────────────

/**
 * Map a page category and diff to the closest ChangeType.
 * Page category drives the primary classification; diff content may override.
 */
export function classifyChange(pageCategory: PageCategory, diff: DiffResult): ChangeType {
  switch (pageCategory) {
    case "pricing":
      return "pricing"
    case "careers":
      return "hiring"
    case "changelog":
      return "product"
    case "blog": {
      const allChanged = [...diff.addedLines, ...diff.removedLines].join(" ").toLowerCase()
      if (/series|raised|funding|invest/i.test(allChanged)) return "announcement"
      if (/feature|launch|release|ship/i.test(allChanged)) return "product"
      return "announcement"
    }
    case "homepage": {
      const allChanged = [...diff.addedLines, ...diff.removedLines].join(" ").toLowerCase()
      if (/\$\d|pricing|plan|seat/i.test(allChanged)) return "pricing"
      if (/feature|launch|release|ship/i.test(allChanged)) return "product"
      return "other"
    }
  }
}

// ─── Significance scoring ─────────────────────────────────────────────────────

/**
 * Score the significance of a detected change from 0–100.
 *
 * Base scores by category:
 *   pricing  → 65
 *   changelog → 55
 *   blog     → 50
 *   homepage  → 45
 *   careers  → 35
 *
 * Modifiers are additive and capped at 100.
 */
export function scoreSignificance(pageCategory: PageCategory, diff: DiffResult): number {
  const bases: Record<PageCategory, number> = {
    pricing: 65,
    changelog: 55,
    blog: 50,
    homepage: 45,
    careers: 35,
  }

  let score = bases[pageCategory]

  // Volume of change bonus (up to +25)
  score += Math.round(diff.changeRatio * 25)

  const allChanged = [...diff.addedLines, ...diff.removedLines].join(" ").toLowerCase()

  // Pricing signals
  if (/raise|increase|higher|more expensive|no longer free/.test(allChanged)) score += 12
  if (/enterprise|sso|saml|audit log/.test(allChanged)) score += 8
  if (/bundl|includ|free on all/.test(allChanged)) score += 6

  // Product signals
  if (/ai |machine learning|automation/.test(allChanged)) score += 10
  if (/launch|ship|announc|release/.test(allChanged)) score += 6
  if (/figma|stripe|github|slack/.test(allChanged)) score += 4

  // Hiring signals (senior / leadership role boost)
  if (/\bhead of\b|vp |chief|c-level|director|staff/.test(allChanged)) score += 14
  if (diff.addedLines.filter((l) => l.startsWith("-")).length >= 5) score += 8
  if (diff.addedLines.filter((l) => l.startsWith("-")).length >= 10) score += 6

  // Blog / announcement signals
  if (/series [a-e]|raised \$|million|billion/.test(allChanged)) score += 15
  if (/acqui|merger|partner/.test(allChanged)) score += 12

  return Math.min(100, Math.max(0, Math.round(score)))
}

// ─── Summary and action generation ───────────────────────────────────────────

function titleCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Generate a human-readable summary of what changed.
 * Template-based; each category has targeted patterns.
 */
export function generateSummary(
  competitor: string,
  pageCategory: PageCategory,
  diff: DiffResult
): string {
  const added = diff.addedLines.filter((l) => l.length > 10)
  const removed = diff.removedLines.filter((l) => l.length > 10)
  const allChanged = [...added, ...removed].join(" ").toLowerCase()

  switch (pageCategory) {
    case "pricing": {
      if (/no longer free|free tier removed|free plan removed/.test(allChanged)) {
        return `${competitor} removed their free tier — pricing now starts at a paid plan.`
      }
      if (/sso|saml|audit/.test(allChanged) && /bundl|includ/.test(allChanged)) {
        return `${competitor} bundled SSO and enterprise features into lower-tier plans — repositioning upmarket.`
      }
      if (removed.some((l) => /\$\d/.test(l)) && added.some((l) => /\$\d/.test(l))) {
        return `${competitor} updated their pricing structure — plan prices and features have changed.`
      }
      return `${competitor} made changes to their pricing page. Review the current plan structure.`
    }

    case "careers": {
      const roleCount = diff.addedLines.filter((l) => l.startsWith("-")).length
      const hasLeadership = /\bhead of\b|vp |director|staff/.test(allChanged)
      if (roleCount > 0 && hasLeadership) {
        return `${competitor} added ${roleCount} new role${roleCount > 1 ? "s" : ""} including senior/leadership positions — scaling their team aggressively.`
      }
      if (roleCount > 0) {
        return `${competitor} is actively hiring with ${roleCount} new role${roleCount > 1 ? "s" : ""} posted.`
      }
      return `${competitor} updated their careers page — headcount may be changing.`
    }

    case "changelog": {
      const firstAdded = added.find((l) => l.length > 15 && !l.startsWith("#"))
      if (firstAdded) {
        const snippet = firstAdded.slice(0, 80)
        return `${competitor} shipped new updates — ${titleCase(snippet)}${firstAdded.length > 80 ? "…" : ""}`
      }
      return `${competitor} added new entries to their changelog — review recent updates.`
    }

    case "blog": {
      if (/series|raised|million|billion/.test(allChanged)) {
        return `${competitor} announced a funding round — signals aggressive growth ahead.`
      }
      if (/acqui/.test(allChanged)) {
        return `${competitor} announced an acquisition — this could significantly change their product scope.`
      }
      const firstAdded = added.find((l) => l.length > 20)
      if (firstAdded) {
        return `${competitor} published a new announcement — ${firstAdded.slice(0, 80).trim()}`
      }
      return `${competitor} published new content — may indicate a product direction change.`
    }

    case "homepage": {
      const firstAdded = added.find((l) => l.length > 20 && !l.startsWith("#"))
      if (firstAdded) {
        return `${competitor} updated their homepage messaging — "${firstAdded.slice(0, 60).trim()}"`
      }
      return `${competitor} changed their homepage — review their current positioning.`
    }
  }
}

/**
 * Generate a recommended action for the FounderOS user given the detected change.
 */
export function generateSuggestedAction(
  competitor: string,
  pageCategory: PageCategory,
  changeType: ChangeType,
  diff: DiffResult
): string {
  const allChanged = [...diff.addedLines, ...diff.removedLines].join(" ").toLowerCase()

  switch (changeType) {
    case "pricing":
      if (/sso|saml|audit/.test(allChanged)) {
        return `Update your competitive deck. Highlight that your SSO/security features are available at a lower tier.`
      }
      if (/raise|increase/.test(allChanged)) {
        return `Opportunity: ${competitor}'s price increase may push cost-sensitive buyers to evaluate alternatives. Prioritize competitive outreach.`
      }
      return `Review how ${competitor}'s new pricing compares to yours. Update the competitive pricing section in your sales materials.`

    case "hiring":
      if (/enterprise|account executive|sales/.test(allChanged)) {
        return `${competitor} is investing in enterprise sales. Expect more competitive pressure in mid-market accounts. Accelerate your enterprise pipeline.`
      }
      if (/\bhead of\b|vp |director/.test(allChanged)) {
        return `${competitor} is hiring senior leadership. This signals a strategic shift. Monitor announcements over the next 60 days.`
      }
      return `Monitor ${competitor}'s hiring trajectory. New hires often signal upcoming product or market expansions.`

    case "product":
      if (/ai /.test(allChanged)) {
        return `${competitor} is shipping AI features. Prepare a differentiation narrative on your AI depth vs. theirs.`
      }
      return `Review ${competitor}'s latest updates. Prepare a comparison doc addressing any feature overlap with your roadmap.`

    case "announcement":
      return `Read the full announcement from ${competitor}. Assess whether this changes your competitive positioning or partner ecosystem.`

    default:
      return `Review the changes on ${competitor}'s page and assess whether any update to your positioning or sales materials is needed.`
  }
}

// ─── Main change detector ─────────────────────────────────────────────────────

function makeId(): string {
  return `cc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

/**
 * Compare two snapshots and produce a CompetitorChange if content differs.
 * Returns null if the snapshots are identical or near-identical.
 */
export function detectChanges(
  previous: CompetitorSnapshot,
  current: CompetitorSnapshot
): CompetitorChange | null {
  const diff = computeDiff(previous.content, current.content)

  if (!diff.hasChanges) return null

  const changeType = classifyChange(current.pageCategory, diff)
  const score = scoreSignificance(current.pageCategory, diff)
  const summary = generateSummary(current.competitorName, current.pageCategory, diff)
  const suggestedAction = generateSuggestedAction(
    current.competitorName,
    current.pageCategory,
    changeType,
    diff
  )

  return {
    id: makeId(),
    competitorName: current.competitorName,
    pageType: changeType,
    previousSnapshot: previous.content,
    currentSnapshot: current.content,
    changeType,
    significanceScore: score,
    summary,
    suggestedAction,
    detectedAt: current.capturedAt,
    sourceUrl: current.url,
  }
}
