"use client"

import Link from "next/link"
import { useState } from "react"
import {
  Radar,
  Users,
  Banknote,
  AlertTriangle,
  TrendingUp,
  Clock,
  RefreshCw,
  Loader2,
  ChevronRight,
  Zap,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  MiniSparkline,
  ScoreBar,
  SignalStrengthBar,
  DeltaPill,
  UrgencyPill,
  DeadlinePill,
} from "@/components/app/dashboard-metrics"
import {
  type DashboardAggregate,
  type RecommendedAction,
  daysUntilDeadline,
} from "@/lib/services/briefService"
import { cn } from "@/lib/utils"
import { PageHeading } from "@/components/app/page-heading"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  return `${days}d ago`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SeverityDot({ score }: { score: number }) {
  if (score >= 80)
    return <span className="inline-block size-2 rounded-full bg-amber-400 shrink-0" />
  if (score >= 60)
    return <span className="inline-block size-2 rounded-full bg-[rgba(55,50,47,0.35)] shrink-0" />
  return <span className="inline-block size-2 rounded-full bg-[rgba(55,50,47,0.2)] shrink-0" />
}

function SectionHeader({
  icon,
  label,
  href,
  count,
}: {
  icon: React.ReactNode
  label: string
  href: string
  count?: number
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm font-semibold text-[#37322F]">
        {icon}
        {label}
        {count !== undefined && count > 0 && (
          <span className="ml-0.5 inline-flex items-center rounded-full bg-[rgba(55,50,47,0.06)] px-1.5 py-0.5 text-xs font-medium text-[#605A57]">
            {count}
          </span>
        )}
      </div>
      <Link
        href={href}
        className="text-xs text-[#828387] hover:text-[#37322F] transition-colors"
      >
        View all →
      </Link>
    </div>
  )
}

// ─── Skeleton placeholders ────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <Card className="border-[rgba(55,50,47,0.12)] shadow-none rounded-lg py-5">
      <CardHeader className="pb-2">
        <Skeleton className="h-3 w-24 mb-2" />
        <Skeleton className="h-7 w-12" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-1 w-full" />
      </CardContent>
    </Card>
  )
}

function FeedCardSkeleton() {
  return (
    <Card className="border-[rgba(55,50,47,0.12)] shadow-none rounded-lg py-4 gap-3">
      <CardHeader className="pb-0">
        <Skeleton className="h-3 w-28 mb-1" />
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="h-1 w-full mt-1" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-3 w-full mb-1" />
        <Skeleton className="h-3 w-3/4" />
      </CardContent>
    </Card>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptySection({
  message,
  href,
  linkLabel,
}: {
  message: string
  href: string
  linkLabel: string
}) {
  return (
    <div className="rounded-lg border border-dashed border-[rgba(55,50,47,0.15)] px-4 py-6 text-center">
      <p className="text-sm text-[#828387]">{message}</p>
      <Link
        href={href}
        className="mt-2 inline-flex items-center gap-0.5 text-xs text-[#605A57] hover:text-[#37322F] transition-colors"
      >
        {linkLabel}
        <ChevronRight className="size-3" />
      </Link>
    </div>
  )
}

// ─── Module icon/href mapping ─────────────────────────────────────────────────

const MODULE_ICONS: Record<RecommendedAction["module"], React.ReactNode> = {
  competitors: <Radar className="size-3 text-[#828387]" />,
  prospects: <Users className="size-3 text-[#828387]" />,
  funding: <Banknote className="size-3 text-[#828387]" />,
}

const MODULE_HREFS: Record<RecommendedAction["module"], string> = {
  competitors: "/competitors",
  prospects: "/prospects",
  funding: "/funding",
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  icon,
  label,
  value,
  sub,
  href,
  sparkline,
  scoreBar,
  pill,
}: {
  icon: React.ReactNode
  label: string
  value: number
  sub: string
  href: string
  sparkline?: number[]
  scoreBar?: number
  pill?: React.ReactNode
}) {
  return (
    <Link href={href}>
      <Card className="border-[rgba(55,50,47,0.12)] shadow-none rounded-lg py-5 cursor-pointer hover:bg-[rgba(55,50,47,0.02)] transition-colors h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {icon}
              <CardDescription className="text-sm text-[#605A57]">{label}</CardDescription>
            </div>
            {sparkline && (
              <span className="text-[#605A57]">
                <MiniSparkline data={sparkline} />
              </span>
            )}
          </div>
          <div className="flex items-end justify-between gap-2 mt-0.5">
            <CardTitle className="text-3xl font-bold text-[#37322F] tabular-nums">
              {value}
            </CardTitle>
            {pill}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-[#828387]">{sub}</p>
          {scoreBar !== undefined && <ScoreBar score={scoreBar} />}
        </CardContent>
      </Card>
    </Link>
  )
}

// ─── DashboardClient ──────────────────────────────────────────────────────────

type ScanStatus = "idle" | "scanning" | "done" | "error"

interface DashboardClientProps {
  initialAggregate: DashboardAggregate
}

export function DashboardClient({ initialAggregate }: DashboardClientProps) {
  const [aggregate, setAggregate] = useState<DashboardAggregate>(initialAggregate)
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle")
  const [errorMessage, setErrorMessage] = useState<string | undefined>()

  async function handleRefresh() {
    setScanStatus("scanning")
    setErrorMessage(undefined)
    try {
      const res = await fetch("/api/dashboard/refresh", { method: "POST" })
      const data = (await res.json()) as DashboardAggregate & { error?: string }
      if (!res.ok) {
        setScanStatus("error")
        setErrorMessage(data.error ?? "Refresh failed")
        return
      }
      setAggregate(data)
      setScanStatus("done")
    } catch {
      setScanStatus("error")
      setErrorMessage("Network error — could not refresh")
    }
  }

  const scanning = scanStatus === "scanning"
  const {
    stats,
    brief,
    topCompetitorChanges,
    hotProspects,
    urgentFunding,
    recommendedActions,
    trends,
  } = aggregate

  const highPriorityActions = recommendedActions.filter((a) => a.urgency === "high").length

  return (
    <div data-testid="dashboard-page" className="flex flex-col gap-6">
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <PageHeading>Dashboard</PageHeading>
          <p className="text-sm text-[#605A57] mt-1">
            Your founder intelligence brief for today.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={scanning}
          data-testid="refresh-button"
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-[rgba(55,50,47,0.15)] bg-white px-4 text-xs font-medium text-[#37322F] transition-colors hover:bg-[rgba(55,50,47,0.04)] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {scanning ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <RefreshCw className="size-3" />
          )}
          {scanning ? "Scanning…" : "Run scan"}
        </button>
      </div>

      {/* ── Scan done / error banners ────────────────────────────────────────── */}
      {scanStatus === "done" && (
        <div
          data-testid="scan-done-banner"
          className="rounded-lg border border-[rgba(55,50,47,0.12)] bg-[rgba(55,50,47,0.02)] px-4 py-2.5 text-xs text-[#605A57]"
        >
          Scan complete —{" "}
          <strong className="text-[#37322F]">{stats.competitorChanges}</strong> competitor change
          {stats.competitorChanges !== 1 ? "s" : ""},{" "}
          <strong className="text-[#37322F]">{stats.topProspects}</strong> high-fit prospect
          {stats.topProspects !== 1 ? "s" : ""}, and{" "}
          <strong className="text-[#37322F]">{stats.upcomingDeadlines}</strong> upcoming funding
          deadline{stats.upcomingDeadlines !== 1 ? "s" : ""}.
        </div>
      )}
      {scanStatus === "error" && (
        <div
          data-testid="scan-error-banner"
          className="rounded-lg border border-[rgba(55,50,47,0.15)] bg-[rgba(55,50,47,0.03)] px-4 py-2.5 text-xs text-[#605A57]"
        >
          {errorMessage}
        </div>
      )}

      {/* ── Row 1: KPI stat cards ────────────────────────────────────────────── */}
      {scanning ? (
        <div
          data-testid="stat-cards-skeleton"
          className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div
          data-testid="stat-cards"
          className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <KpiCard
            icon={<Radar className="size-4 text-[#605A57]" />}
            label="Competitor changes"
            value={stats.competitorChanges}
            sub={`${stats.highSeverityChanges} high priority`}
            href="/competitors"
            sparkline={trends.weeklyCompetitorCounts}
            pill={
              trends.weeklyCompetitorTotal > 0 ? (
                <DeltaPill delta={trends.weeklyCompetitorTotal} suffix="this wk" />
              ) : undefined
            }
          />
          <KpiCard
            icon={<AlertTriangle className="size-4 text-[#605A57]" />}
            label="High-priority signals"
            value={stats.highSeverityChanges}
            sub="Significance ≥ 80"
            href="/competitors"
            scoreBar={
              stats.competitorChanges > 0
                ? Math.round((stats.highSeverityChanges / stats.competitorChanges) * 100)
                : 0
            }
          />
          <KpiCard
            icon={<Users className="size-4 text-[#605A57]" />}
            label="Top prospects"
            value={stats.topProspects}
            sub={`Avg fit ${trends.avgProspectFitScore}%`}
            href="/prospects"
            scoreBar={trends.avgProspectFitScore}
          />
          <KpiCard
            icon={<Clock className="size-4 text-[#605A57]" />}
            label="Deadlines ≤ 60 days"
            value={stats.upcomingDeadlines}
            sub={`of ${stats.fundingOpportunities} opportunities`}
            href="/funding"
            pill={
              trends.nonDilutiveFundingCount > 0 ? (
                <span className="inline-flex items-center rounded-full border border-[rgba(55,50,47,0.12)] bg-[rgba(55,50,47,0.04)] px-1.5 py-0.5 text-[10px] font-medium text-[#605A57]">
                  {trends.nonDilutiveFundingCount} non-dilutive
                </span>
              ) : undefined
            }
          />
        </div>
      )}

      {/* ── Row 2: Morning brief ─────────────────────────────────────────────── */}
      {scanning ? (
        <Card className="border-[rgba(55,50,47,0.12)] shadow-none rounded-lg py-5">
          <CardHeader className="pb-3">
            <Skeleton className="h-4 w-56 mb-2" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </CardHeader>
          <CardContent className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card
          data-testid="morning-brief"
          className="border-[rgba(55,50,47,0.12)] shadow-none rounded-lg py-5"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-[#605A57]" />
              <CardTitle className="text-base font-semibold text-[#37322F]">
                {brief.title}
              </CardTitle>
            </div>
            <CardDescription className="text-[#605A57] text-sm leading-relaxed">
              {brief.summary}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {brief.bullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#49423D]">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#37322F]" />
                  {bullet}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ── Row 3: Recommended actions ───────────────────────────────────────── */}
      {!scanning && recommendedActions.length > 0 && (
        <div className="flex flex-col gap-3" data-testid="recommended-actions">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#37322F]">
            <Zap className="size-4" />
            Recommended actions
            {highPriorityActions > 0 && (
              <span className="ml-auto inline-flex items-center rounded-full border border-[rgba(55,50,47,0.12)] bg-[rgba(55,50,47,0.04)] px-1.5 py-0.5 text-xs font-medium text-[#605A57]">
                {highPriorityActions} high priority
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            {recommendedActions.map((action) => (
              <Link key={action.id} href={MODULE_HREFS[action.module]}>
                <div className="flex items-center gap-2.5 rounded-lg border border-[rgba(55,50,47,0.12)] bg-white px-3.5 py-3 text-sm text-[#49423D] leading-relaxed hover:bg-[rgba(55,50,47,0.02)] transition-colors cursor-pointer">
                  <UrgencyPill urgency={action.urgency} />
                  <span className="flex-1 min-w-0 leading-snug">{action.label}</span>
                  <div className="flex items-center gap-1 shrink-0 text-[#828387]">
                    {MODULE_ICONS[action.module]}
                    <ChevronRight className="size-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Row 4: Three-column insight feed ────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Competitor radar */}
        <div className="flex flex-col gap-3">
          <SectionHeader
            icon={<Radar className="size-3.5" />}
            label="Competitor radar"
            href="/competitors"
            count={topCompetitorChanges.length}
          />
          {scanning ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <FeedCardSkeleton key={i} />
              ))}
            </div>
          ) : topCompetitorChanges.length === 0 ? (
            <EmptySection
              message="No competitor changes detected yet. Add competitor sources to get started."
              href="/competitors"
              linkLabel="Add competitor sources"
            />
          ) : (
            <div className="flex flex-col gap-2">
              {topCompetitorChanges.map((change) => (
                <Card
                  key={change.id}
                  className="border-[rgba(55,50,47,0.12)] shadow-none rounded-lg py-4 gap-3"
                >
                  <CardHeader className="pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold text-[#37322F] leading-tight">
                        {change.competitorName}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <SeverityDot score={change.significanceScore} />
                        <span className="text-[10px] tabular-nums text-[#605A57]">
                          {change.significanceScore}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge
                        variant="outline"
                        className="text-[10px] border-[rgba(55,50,47,0.15)] text-[#605A57]"
                      >
                        {change.pageType}
                      </Badge>
                      <span className="ml-auto text-[10px] text-[#828387]">
                        {formatRelativeTime(change.detectedAt)}
                      </span>
                    </div>
                    <SignalStrengthBar score={change.significanceScore} className="mt-1.5" />
                  </CardHeader>
                  <CardContent className="space-y-1.5">
                    <p className="text-xs text-[#49423D] leading-relaxed">{change.summary}</p>
                    <p className="text-[11px] text-[#828387] leading-snug">
                      →{" "}
                      {change.suggestedAction.length > 80
                        ? `${change.suggestedAction.slice(0, 80)}…`
                        : change.suggestedAction}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Hot prospects */}
        <div className="flex flex-col gap-3">
          <SectionHeader
            icon={<Users className="size-3.5" />}
            label="Top prospects"
            href="/prospects"
            count={hotProspects.length}
          />
          {scanning ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <FeedCardSkeleton key={i} />
              ))}
            </div>
          ) : hotProspects.length === 0 ? (
            <EmptySection
              message="No high-fit prospects yet. Analyze companies to find buying signals."
              href="/prospects"
              linkLabel="Analyze a company"
            />
          ) : (
            <div className="flex flex-col gap-2">
              {hotProspects.map((prospect) => (
                <Card
                  key={prospect.id}
                  className="border-[rgba(55,50,47,0.12)] shadow-none rounded-lg py-4 gap-3"
                >
                  <CardHeader className="pb-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#37322F]">
                        {prospect.companyName}
                      </span>
                      <span className="text-xs font-medium tabular-nums text-[#605A57]">
                        {prospect.fitScore}%
                      </span>
                    </div>
                    <ScoreBar score={prospect.fitScore} />
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] text-[#828387] truncate">
                        {prospect.category}
                      </span>
                      {prospect.hiringSignals.length > 0 && (
                        <span className="ml-auto shrink-0 inline-flex items-center gap-0.5 rounded-full border border-[rgba(55,50,47,0.1)] bg-[rgba(55,50,47,0.03)] px-1.5 py-0.5 text-[10px] text-[#828387]">
                          {prospect.hiringSignals.length} hiring signals
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="text-xs text-[#49423D] leading-relaxed">
                    {prospect.recommendedAngle.length > 95
                      ? `${prospect.recommendedAngle.slice(0, 95)}…`
                      : prospect.recommendedAngle}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Urgent funding */}
        <div className="flex flex-col gap-3">
          <SectionHeader
            icon={<Banknote className="size-3.5" />}
            label="Funding deadlines"
            href="/funding"
            count={urgentFunding.length}
          />
          {scanning ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <FeedCardSkeleton key={i} />
              ))}
            </div>
          ) : urgentFunding.length === 0 ? (
            <EmptySection
              message="No upcoming funding deadlines in the next 60 days."
              href="/funding"
              linkLabel="View all opportunities"
            />
          ) : (
            <div className="flex flex-col gap-2">
              {urgentFunding.map((opp) => {
                const days = opp.deadline ? daysUntilDeadline(opp.deadline) : null
                return (
                  <Card
                    key={opp.id}
                    className="border-[rgba(55,50,47,0.12)] shadow-none rounded-lg py-4 gap-3"
                  >
                    <CardHeader className="pb-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-[#37322F] leading-tight">
                          {opp.programName}
                        </span>
                        {days !== null && <DeadlinePill days={days} />}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge
                          variant="outline"
                          className="text-[10px] border-[rgba(55,50,47,0.15)] text-[#605A57]"
                        >
                          {opp.equityType}
                        </Badge>
                        <span className="text-[10px] text-[#828387]">Fit {opp.fitScore}%</span>
                        <ScoreBar score={opp.fitScore} className="w-10 ml-auto" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <p className="text-xs font-medium text-[#37322F]">
                        {opp.fundingAmount}{" "}
                        <span className="font-normal text-[#828387]">by {opp.provider}</span>
                      </p>
                      <p className="text-xs text-[#49423D] leading-relaxed">
                        {opp.fitReason.length > 90
                          ? `${opp.fitReason.slice(0, 90)}…`
                          : opp.fitReason}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Source health footer ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[rgba(55,50,47,0.08)] bg-[rgba(55,50,47,0.015)] px-4 py-3">
        <span className="text-xs text-[#605A57]">
          Tracking {trends.trackedSourceCount} sources
        </span>
        <div className="flex items-center gap-4">
          <span className="text-xs text-[#828387]">
            {trends.trackedSourcesByModule.competitors} competitor
          </span>
          <span className="text-xs text-[#828387]">
            {trends.trackedSourcesByModule.prospects} prospect
          </span>
          <span className="text-xs text-[#828387]">
            {trends.trackedSourcesByModule.funding} funding
          </span>
          <Link
            href="/settings"
            className="text-xs text-[#828387] hover:text-[#37322F] transition-colors"
          >
            Manage →
          </Link>
        </div>
      </div>
    </div>
  )
}
