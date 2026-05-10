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
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { DashboardAggregate, RecommendedAction } from "@/lib/services/briefService"

// ─── Sub-components (visual-system preserving) ────────────────────────────────

function SeverityDot({ score }: { score: number }) {
  if (score >= 80) return <span className="inline-block size-2 rounded-full bg-red-400" />
  if (score >= 60) return <span className="inline-block size-2 rounded-full bg-amber-400" />
  return <span className="inline-block size-2 rounded-full bg-emerald-400" />
}

function FitBar({ score }: { score: number }) {
  return (
    <div className="h-1 w-full rounded-full bg-[rgba(55,50,47,0.08)]">
      <div className="h-1 rounded-full bg-[#37322F]" style={{ width: `${score}%` }} />
    </div>
  )
}

function SectionHeader({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode
  label: string
  href: string
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#37322F]">
        {icon}
        {label}
      </div>
      <Link
        href={href}
        className="text-[10px] text-[#828387] hover:text-[#37322F] transition-colors"
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
      <CardContent>
        <Skeleton className="h-3 w-20" />
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
      </CardHeader>
      <CardContent>
        <Skeleton className="h-3 w-full mb-1" />
        <Skeleton className="h-3 w-3/4" />
      </CardContent>
    </Card>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptySection({ message, href, linkLabel }: { message: string; href: string; linkLabel: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[rgba(55,50,47,0.15)] px-4 py-5 text-center">
      <p className="text-xs text-[#828387]">{message}</p>
      <Link href={href} className="mt-2 inline-flex items-center gap-0.5 text-[10px] text-[#605A57] hover:text-[#37322F] transition-colors">
        {linkLabel}
        <ChevronRight className="size-3" />
      </Link>
    </div>
  )
}

// ─── Urgency badge for recommended actions ────────────────────────────────────

function UrgencyDot({ urgency }: { urgency: RecommendedAction["urgency"] }) {
  if (urgency === "high") return <span className="inline-block size-1.5 rounded-full bg-red-400 shrink-0 mt-1" />
  if (urgency === "medium") return <span className="inline-block size-1.5 rounded-full bg-amber-400 shrink-0 mt-1" />
  return <span className="inline-block size-1.5 rounded-full bg-emerald-400 shrink-0 mt-1" />
}

// ─── Module icon mapping ──────────────────────────────────────────────────────

const MODULE_ICONS = {
  competitors: <Radar className="size-3 text-[#828387]" />,
  prospects: <Users className="size-3 text-[#828387]" />,
  funding: <Banknote className="size-3 text-[#828387]" />,
}

const MODULE_HREFS = {
  competitors: "/competitors",
  prospects: "/prospects",
  funding: "/funding",
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
      const data = await res.json() as DashboardAggregate & { error?: string }
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
  const { stats, brief, topCompetitorChanges, hotProspects, urgentFunding, recommendedActions } = aggregate

  return (
    <div data-testid="dashboard-page" className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#37322F] font-sans">Dashboard</h1>
          <p className="text-sm text-[#605A57] mt-0.5">
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

      {/* Scan done / error banners */}
      {scanStatus === "done" && (
        <div
          data-testid="scan-done-banner"
          className="rounded-lg border border-[rgba(55,50,47,0.12)] bg-[rgba(55,50,47,0.02)] px-4 py-2.5 text-xs text-[#605A57]"
        >
          Scan complete —{" "}
          <strong className="text-[#37322F]">{stats.competitorChanges}</strong> competitor change
          {stats.competitorChanges !== 1 ? "s" : ""},{"  "}
          <strong className="text-[#37322F]">{stats.topProspects}</strong> high-fit prospect
          {stats.topProspects !== 1 ? "s" : ""}, and{" "}
          <strong className="text-[#37322F]">{stats.upcomingDeadlines}</strong> upcoming funding deadline
          {stats.upcomingDeadlines !== 1 ? "s" : ""}.
        </div>
      )}
      {scanStatus === "error" && (
        <div
          data-testid="scan-error-banner"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-600"
        >
          {errorMessage}
        </div>
      )}

      {/* Summary stat cards */}
      {scanning ? (
        <div data-testid="stat-cards-skeleton" className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : (
        <div data-testid="stat-cards" className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Radar className="size-4 text-[#605A57]" />}
            label="Competitor changes"
            value={stats.competitorChanges}
            sub={`${stats.highSeverityChanges} high priority`}
            href="/competitors"
          />
          <StatCard
            icon={<AlertTriangle className="size-4 text-[#605A57]" />}
            label="High-priority signals"
            value={stats.highSeverityChanges}
            sub="This week"
            href="/competitors"
          />
          <StatCard
            icon={<Users className="size-4 text-[#605A57]" />}
            label="Top prospects"
            value={stats.topProspects}
            sub="Fit score ≥ 75"
            href="/prospects"
          />
          <StatCard
            icon={<Clock className="size-4 text-[#605A57]" />}
            label="Deadlines ≤ 60 days"
            value={stats.upcomingDeadlines}
            sub={`of ${stats.fundingOpportunities} opportunities`}
            href="/funding"
          />
        </div>
      )}

      {/* Morning brief */}
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
              <CardTitle className="text-sm font-semibold text-[#37322F]">
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

      {/* Recommended actions */}
      {!scanning && recommendedActions.length > 0 && (
        <div className="flex flex-col gap-3" data-testid="recommended-actions">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#37322F]">
            <AlertTriangle className="size-3.5" />
            Recommended actions
          </div>
          <div className="flex flex-col gap-1.5">
            {recommendedActions.map((action) => (
              <Link key={action.id} href={MODULE_HREFS[action.module]}>
                <div className="flex items-start gap-2.5 rounded-lg border border-[rgba(55,50,47,0.12)] bg-white px-3.5 py-3 text-xs text-[#49423D] leading-relaxed hover:bg-[rgba(55,50,47,0.02)] transition-colors cursor-pointer">
                  <UrgencyDot urgency={action.urgency} />
                  <span className="flex-1 min-w-0">{action.label}</span>
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

      {/* Three-column feed */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Competitor radar */}
        <div className="flex flex-col gap-3">
          <SectionHeader
            icon={<Radar className="size-3.5" />}
            label="Competitor radar"
            href="/competitors"
          />
          {scanning ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => <FeedCardSkeleton key={i} />)}
            </div>
          ) : topCompetitorChanges.length === 0 ? (
            <EmptySection
              message="No competitor changes detected yet."
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
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#37322F]">
                        {change.competitorName}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <SeverityDot score={change.significanceScore} />
                        <span className="text-xs tabular-nums text-[#605A57]">
                          {change.significanceScore}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="w-fit text-[10px] border-[rgba(55,50,47,0.15)] text-[#605A57]"
                    >
                      {change.pageType}
                    </Badge>
                  </CardHeader>
                  <CardContent className="text-xs text-[#49423D] leading-relaxed">
                    {change.summary}
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
          />
          {scanning ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => <FeedCardSkeleton key={i} />)}
            </div>
          ) : hotProspects.length === 0 ? (
            <EmptySection
              message="No high-fit prospects yet."
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
                      <span className="text-xs font-semibold text-[#37322F]">
                        {prospect.companyName}
                      </span>
                      <span className="text-xs tabular-nums text-[#605A57]">
                        {prospect.fitScore}%
                      </span>
                    </div>
                    <FitBar score={prospect.fitScore} />
                    <span className="text-[10px] text-[#828387]">{prospect.category}</span>
                  </CardHeader>
                  <CardContent className="text-xs text-[#49423D] leading-relaxed">
                    {prospect.recommendedAngle.slice(0, 100)}…
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
          />
          {scanning ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => <FeedCardSkeleton key={i} />)}
            </div>
          ) : urgentFunding.length === 0 ? (
            <EmptySection
              message="No upcoming funding deadlines in the next 60 days."
              href="/funding"
              linkLabel="View all opportunities"
            />
          ) : (
            <div className="flex flex-col gap-2">
              {urgentFunding.map((opp) => (
                <Card
                  key={opp.id}
                  className="border-[rgba(55,50,47,0.12)] shadow-none rounded-lg py-4 gap-3"
                >
                  <CardHeader className="pb-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#37322F]">
                        {opp.programName}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] border-[rgba(55,50,47,0.15)] text-[#605A57]"
                      >
                        {opp.equityType}
                      </Badge>
                    </div>
                    <span className="text-[10px] text-[#828387]">
                      Deadline: {opp.deadline}
                    </span>
                  </CardHeader>
                  <CardContent className="text-xs text-[#49423D] leading-relaxed">
                    {opp.fundingAmount} · Fit {opp.fitScore}%
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  href,
}: {
  icon: React.ReactNode
  label: string
  value: number
  sub: string
  href: string
}) {
  return (
    <Link href={href}>
      <Card className="border-[rgba(55,50,47,0.12)] shadow-none rounded-lg py-5 cursor-pointer hover:bg-[rgba(55,50,47,0.02)] transition-colors">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            {icon}
            <CardDescription className="text-xs text-[#605A57]">{label}</CardDescription>
          </div>
          <CardTitle className="text-2xl font-semibold text-[#37322F] tabular-nums">
            {value}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-[#828387]">{sub}</p>
        </CardContent>
      </Card>
    </Link>
  )
}
