import { store } from "@/lib/store"
import { seedFundingOpportunities } from "@/lib/seed"
import type { CompetitorChange, ProspectRecord, FundingOpportunity, Brief } from "@/lib/schemas"

// ─── View-level types ─────────────────────────────────────────────────────────

export interface DashboardStats {
  competitorChanges: number
  highSeverityChanges: number
  topProspects: number
  fundingOpportunities: number
  upcomingDeadlines: number
}

export interface RecommendedAction {
  id: string
  label: string
  module: "competitors" | "prospects" | "funding"
  urgency: "high" | "medium" | "low"
}

export interface DashboardAggregate {
  topCompetitorChanges: CompetitorChange[]
  hotProspects: ProspectRecord[]
  urgentFunding: FundingOpportunity[]
  recommendedActions: RecommendedAction[]
  stats: DashboardStats
  brief: Brief
  generatedAt: string
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

/**
 * The anchor date used for deadline calculations.
 * Matches the seed data so tests and the demo render consistently.
 */
export const SEED_REF_DATE = new Date("2026-05-10")

export function daysUntilDeadline(dateStr: string, refDate: Date = SEED_REF_DATE): number {
  return Math.ceil(
    (new Date(dateStr).getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24)
  )
}

// ─── Brief service ────────────────────────────────────────────────────────────

export const briefService = {
  /**
   * Aggregate top signals from all three modules.
   *
   * - Competitors: live store data, sorted by significance
   * - Prospects:   live store data, sorted by fit score
   * - Funding:     static seed (no ingestion pipeline yet), filtered by deadline
   */
  aggregate(refDate: Date = SEED_REF_DATE): DashboardAggregate {
    // ── Competitors ──────────────────────────────────────────────────────────
    const allChanges = store.changes
      .list()
      .sort((a, b) => b.significanceScore - a.significanceScore)
    const topCompetitorChanges = allChanges.slice(0, 3)

    // ── Prospects ────────────────────────────────────────────────────────────
    const allProspects = store.prospects
      .list()
      .sort((a, b) => b.fitScore - a.fitScore)
    const hotProspects = allProspects.filter((p) => p.fitScore >= 60).slice(0, 3)

    // ── Funding ──────────────────────────────────────────────────────────────
    const urgentFunding = seedFundingOpportunities
      .filter((f) => {
        if (!f.deadline) return false
        return daysUntilDeadline(f.deadline, refDate) <= 60
      })
      .sort((a, b) => b.fitScore - a.fitScore)
      .slice(0, 3)

    // ── Stats ────────────────────────────────────────────────────────────────
    const stats: DashboardStats = {
      competitorChanges: allChanges.length,
      highSeverityChanges: allChanges.filter((c) => c.significanceScore >= 75).length,
      topProspects: allProspects.filter((p) => p.fitScore >= 75).length,
      fundingOpportunities: seedFundingOpportunities.length,
      upcomingDeadlines: seedFundingOpportunities.filter((f) => {
        if (!f.deadline) return false
        return daysUntilDeadline(f.deadline, refDate) <= 60
      }).length,
    }

    // ── Recommended actions ──────────────────────────────────────────────────
    const recommendedActions: RecommendedAction[] = []

    for (const change of topCompetitorChanges) {
      if (change.significanceScore >= 80) {
        recommendedActions.push({
          id: `action-cc-${change.id}`,
          label: change.suggestedAction,
          module: "competitors",
          urgency: "high",
        })
      }
    }

    for (const prospect of hotProspects.slice(0, 2)) {
      if (prospect.fitScore >= 75) {
        const angle = prospect.recommendedAngle.length > 80
          ? `${prospect.recommendedAngle.slice(0, 80)}…`
          : prospect.recommendedAngle
        recommendedActions.push({
          id: `action-pr-${prospect.id}`,
          label: `Reach out to ${prospect.companyName} — ${angle}`,
          module: "prospects",
          urgency: "medium",
        })
      }
    }

    for (const opp of urgentFunding.slice(0, 2)) {
      const days = opp.deadline ? daysUntilDeadline(opp.deadline, refDate) : null
      const daysStr = days !== null && days <= 30 ? ` — ${days} days left` : ""
      recommendedActions.push({
        id: `action-fo-${opp.id}`,
        label: `Apply to ${opp.programName}${daysStr}`,
        module: "funding",
        urgency: days !== null && days <= 30 ? "high" : "medium",
      })
    }

    // ── Brief ────────────────────────────────────────────────────────────────
    const brief = briefService.composeBrief({
      topCompetitorChanges,
      hotProspects,
      urgentFunding,
      stats,
      refDate,
    })

    return {
      topCompetitorChanges,
      hotProspects,
      urgentFunding,
      recommendedActions,
      stats,
      brief,
      generatedAt: new Date().toISOString(),
    }
  },

  /**
   * Compose a human-readable morning brief from aggregated cross-module data.
   * Returns a Brief object ready for rendering.
   */
  composeBrief(data: {
    topCompetitorChanges: CompetitorChange[]
    hotProspects: ProspectRecord[]
    urgentFunding: FundingOpportunity[]
    stats: DashboardStats
    refDate?: Date
  }): Brief {
    const refDate = data.refDate ?? SEED_REF_DATE
    const bullets: string[] = []

    // Competitor bullets — high-significance changes only
    for (const change of data.topCompetitorChanges.slice(0, 2)) {
      if (change.significanceScore >= 75) {
        bullets.push(`${change.competitorName}: ${change.summary}`)
      }
    }

    // Prospect bullets — top fit only
    for (const prospect of data.hotProspects.slice(0, 2)) {
      if (prospect.fitScore >= 75) {
        const angle = prospect.recommendedAngle.length > 80
          ? `${prospect.recommendedAngle.slice(0, 80)}…`
          : prospect.recommendedAngle
        bullets.push(`${prospect.companyName} (fit ${prospect.fitScore}%) — ${angle}`)
      }
    }

    // Funding bullets — deadline-critical
    for (const opp of data.urgentFunding.slice(0, 2)) {
      const days = opp.deadline ? daysUntilDeadline(opp.deadline, refDate) : null
      const daysStr = days !== null ? `, ${days} days left` : ""
      const reason = opp.fitReason.length > 80
        ? `${opp.fitReason.slice(0, 80)}…`
        : opp.fitReason
      bullets.push(`${opp.programName}${daysStr}: ${reason}`)
    }

    if (bullets.length === 0) {
      bullets.push("No signals yet. Add sources and run a scan to get started.")
    }

    // Summary sentence
    const parts: string[] = []
    if (data.stats.highSeverityChanges > 0) {
      parts.push(
        `${data.stats.highSeverityChanges} high-priority competitor signal${data.stats.highSeverityChanges !== 1 ? "s" : ""} detected`
      )
    }
    if (data.hotProspects.length > 0) {
      parts.push(`top prospect: ${data.hotProspects[0].companyName} (fit ${data.hotProspects[0].fitScore}%)`)
    }
    if (data.urgentFunding.length > 0) {
      parts.push(`${data.urgentFunding[0].programName} deadline approaching`)
    }

    const summary =
      parts.length > 0
        ? `${parts.join(", ")}.`
        : "Nothing new today. Add more sources to get started."

    const today = refDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })

    return {
      id: `brief-live-${Date.now()}`,
      module: "dashboard" as const,
      title: `Today's Founder Brief — ${today}`,
      summary,
      bullets,
      relatedIds: [
        ...data.topCompetitorChanges.map((c) => c.id),
        ...data.hotProspects.map((p) => p.id),
        ...data.urgentFunding.map((f) => f.id),
      ],
      createdAt: new Date().toISOString(),
    }
  },
}
