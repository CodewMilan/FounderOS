"use client"

import { useState, useCallback } from "react"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { MarketRadarChart } from "@/components/app/competitor-intel/market-radar-chart"
import { FeatureComparisonMatrix } from "@/components/app/competitor-intel/feature-comparison-matrix"
import { PricingLandscapeChart } from "@/components/app/competitor-intel/pricing-landscape-chart"
import { TractionScores } from "@/components/app/competitor-intel/traction-scores"
import { PositioningMap } from "@/components/app/competitor-intel/positioning-map"
import { CompetitorCards } from "@/components/app/competitor-intel/competitor-cards"
import { QuickActionBar } from "@/components/app/competitor-intel/quick-action-bar"
import type { CompetitorIntelState } from "@/lib/schemas/competitor-intel"
import { Clock, Info } from "lucide-react"

interface Props {
  initialState: CompetitorIntelState
  yourName: string
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function CompetitorIntelligencePanel({ initialState, yourName }: Props) {
  const [state, setState] = useState<CompetitorIntelState>(initialState)
  const [refreshing, setRefreshing] = useState(false)
  const [actionStatus, setActionStatus] = useState<string | null>(null)

  async function handleRefreshAll() {
    setRefreshing(true)
    setActionStatus(null)
    try {
      const res = await fetch("/api/competitors/fetch", {
        method: "POST",
        body: "{}",
        headers: { "Content-Type": "application/json" },
      })
      if (res.ok) {
        const data = await res.json() as { state: CompetitorIntelState }
        setState(data.state)
        setActionStatus("Competitors refreshed")
      }
    } catch {
      setActionStatus("Refresh failed — using existing data")
    } finally {
      setRefreshing(false)
      setTimeout(() => setActionStatus(null), 4000)
    }
  }

  async function handleEnrich(id: string, url: string) {
    try {
      const res = await fetch("/api/competitors/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitorId: id, websiteUrl: url }),
      })
      if (res.ok) {
        const data = await res.json() as { competitor: CompetitorIntelState["competitors"][0] }
        setState((prev) => ({
          ...prev,
          competitors: prev.competitors.map((c) =>
            c.id === id ? data.competitor : c
          ),
        }))
      }
    } catch {
      /* silent — enrichment is best-effort */
    }
  }

  async function handleFeatureGap() {
    setActionStatus("Running feature gap analysis…")
    try {
      await fetch("/api/workflows/feature-gap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitorUrl: state.competitors[0]?.websiteUrl ?? "" }),
      })
      setActionStatus("Feature gap analysis queued")
    } catch {
      setActionStatus("Feature gap analysis failed")
    }
    setTimeout(() => setActionStatus(null), 4000)
  }

  async function handlePricingResponse() {
    setActionStatus("Running pricing response…")
    try {
      await fetch("/api/workflows/pricing-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitorUrl: state.competitors[0]?.websiteUrl ?? "" }),
      })
      setActionStatus("Pricing response queued")
    } catch {
      setActionStatus("Pricing response failed")
    }
    setTimeout(() => setActionStatus(null), 4000)
  }

  function handleAddCompetitor(url: string, name?: string) {
    fetch("/api/competitors/enrich", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ competitorId: "", websiteUrl: url }),
    }).catch(() => null)

    // Optimistically add a placeholder
    const placeholder = {
      id: `manual-${Date.now()}`,
      companyName: name ?? new URL(url).hostname.replace("www.", ""),
      websiteUrl: url,
      description: "Manually added — enrichment pending.",
      marketPosition: "niche" as const,
      whyCompetitor: "Manually added by founder.",
      keyFeatures: [] as string[],
      notableStrengths: [] as string[],
      geographyFocus: [] as string[],
      hasFreeTier: false,
      isManuallyAdded: true,
    }
    setState((prev) => ({
      ...prev,
      competitors: [...prev.competitors, placeholder],
    }))
  }

  function handleRemoveCompetitor(id: string) {
    setState((prev) => ({
      ...prev,
      competitors: prev.competitors.filter((c) => c.id !== id),
    }))
  }

  const { competitors, yourRadarScores, yourFeatures, yourMonthlyPriceEntry, yourHasFreeTier, yourPositioningX, yourPositioningY, lastFetchedAt } = state

  const defaultRadarScores = yourRadarScores ?? {
    pricingCompetitiveness: 5,
    featureDepth: 5,
    marketPresence: 3,
    geographicReach: 4,
    targetClarity: 7,
    tractionSignals: 3,
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Quick actions */}
      <div className="flex flex-col gap-2">
        <QuickActionBar
          onRefreshAll={handleRefreshAll}
          onFeatureGap={handleFeatureGap}
          onPricingResponse={handlePricingResponse}
          onAddCompetitor={handleAddCompetitor}
          refreshing={refreshing}
        />
        {actionStatus && (
          <p className="text-xs text-[#605A57]">{actionStatus}</p>
        )}
      </div>

      {/* Data disclaimer */}
      <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-[rgba(55,50,47,0.03)] border border-[rgba(55,50,47,0.08)]">
        <Info className="size-3.5 text-[#828387] mt-0.5 shrink-0" />
        <p className="text-xs text-[#828387] leading-relaxed">
          Data estimated from public web sources via FounderOS. Not official figures.
        </p>
        {lastFetchedAt && (
          <span className="ml-auto text-[10px] text-[#828387] flex items-center gap-1 whitespace-nowrap shrink-0">
            <Clock className="size-3" />
            {timeAgo(lastFetchedAt)}
          </span>
        )}
      </div>

      {competitors.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-sm text-[#605A57]">No competitors fetched yet.</p>
          <p className="text-xs text-[#828387]">
            Save your founder profile to auto-fetch competitors, or add one manually.
          </p>
        </div>
      ) : (
        <>
          {/* Section 1: Radar chart */}
          <MarketRadarChart
            competitors={competitors}
            yourName={yourName}
            yourScores={defaultRadarScores}
          />

          {/* Section 2: Pricing landscape */}
          <PricingLandscapeChart
            competitors={competitors}
            yourName={yourName}
            yourMonthlyPriceEntry={yourMonthlyPriceEntry}
            yourHasFreeTier={yourHasFreeTier}
          />

          {/* Section 3 + 4: feature matrix + traction — side by side on wider screens */}
          <div className="grid gap-4 lg:grid-cols-2">
            <FeatureComparisonMatrix
              competitors={competitors}
              yourName={yourName}
              yourFeatures={yourFeatures ?? []}
            />
            <TractionScores competitors={competitors} yourName={yourName} />
          </div>

          {/* Section 5: Positioning map */}
          <PositioningMap
            competitors={competitors}
            yourName={yourName}
            yourX={yourPositioningX}
            yourY={yourPositioningY}
          />

          <Separator className="bg-[rgba(55,50,47,0.08)]" />

          {/* Section 6: You vs them cards */}
          <CompetitorCards
            competitors={competitors}
            yourName={yourName}
            yourFeatures={yourFeatures ?? []}
            onEnrich={handleEnrich}
            onRemove={handleRemoveCompetitor}
          />
        </>
      )}
    </div>
  )
}
