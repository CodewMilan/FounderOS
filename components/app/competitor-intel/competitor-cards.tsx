"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Clock, RefreshCw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { EnrichedCompetitor } from "@/lib/schemas/competitor-intel"

interface Props {
  competitors: EnrichedCompetitor[]
  yourName: string
  yourFeatures: string[]
  onEnrich: (id: string, url: string) => void
  onRemove: (id: string) => void
}

const POSITION_LABELS: Record<string, string> = {
  leader: "Leader",
  challenger: "Challenger",
  niche: "Niche",
  emerging: "Emerging",
}

const POSITION_COLORS: Record<string, string> = {
  leader: "bg-[rgba(55,50,47,0.08)] text-[#37322F]",
  challenger: "bg-[rgba(55,50,47,0.05)] text-[#49423D]",
  niche: "bg-[rgba(55,50,47,0.04)] text-[#605A57]",
  emerging: "bg-[rgba(55,50,47,0.04)] text-[#605A57]",
}

function gap(yourFeatures: string[], theirFeatures: string[]): string[] {
  const theirLow = theirFeatures.map((f) => f.toLowerCase())
  return yourFeatures.filter(
    (f) => !theirLow.some((tf) => tf.includes(f.toLowerCase().split(" ")[0]!))
  )
}

function theirGaps(yourFeatures: string[], theirFeatures: string[]): string[] {
  const yourLow = yourFeatures.map((f) => f.toLowerCase())
  return theirFeatures.filter(
    (f) => !yourLow.some((yf) => yf.includes(f.toLowerCase().split(" ")[0]!))
  )
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return "just now"
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function CompetitorCards({ competitors, yourName, yourFeatures, onEnrich, onRemove }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#37322F]">You vs. them</h3>
        <span className="text-xs text-[#828387]">{competitors.length} competitors tracked</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {competitors.map((comp) => {
          const initials = comp.companyName
            .split(" ")
            .slice(0, 2)
            .map((w) => w[0])
            .join("")
            .toUpperCase()

          const yourGapItems = gap(yourFeatures, comp.keyFeatures).slice(0, 3)
          const theirGapItems = theirGaps(yourFeatures, comp.keyFeatures).slice(0, 3)

          return (
            <Card
              key={comp.id}
              className="border-[rgba(55,50,47,0.12)] shadow-none rounded-lg"
            >
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="size-7 rounded-md shrink-0">
                      <AvatarFallback className="text-[10px] font-semibold bg-[rgba(55,50,47,0.08)] text-[#37322F] rounded-md">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#37322F] truncate">
                        {comp.companyName}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`inline-flex items-center text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${POSITION_COLORS[comp.marketPosition]}`}
                        >
                          {POSITION_LABELS[comp.marketPosition]}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 text-[#828387] hover:text-[#37322F] hover:bg-[rgba(55,50,47,0.05)]"
                      onClick={() => onEnrich(comp.id, comp.websiteUrl)}
                      title="Re-enrich"
                      aria-label="Re-enrich competitor data"
                    >
                      <RefreshCw className="size-3" />
                    </Button>
                    {comp.isManuallyAdded && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 text-[#828387] hover:text-red-600 hover:bg-red-50"
                        onClick={() => onRemove(comp.id)}
                        title="Remove competitor"
                        aria-label="Remove competitor"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 flex flex-col gap-3">
                <p className="text-xs text-[#605A57] leading-relaxed line-clamp-2">
                  {comp.whyCompetitor}
                </p>
                <Separator className="bg-[rgba(55,50,47,0.08)]" />
                {/* Your gaps vs them */}
                {yourGapItems.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#828387] mb-1">
                      Your gaps vs them
                    </p>
                    <ul className="flex flex-col gap-0.5">
                      {yourGapItems.map((g) => (
                        <li key={g} className="text-xs text-[#49423D] flex items-center gap-1">
                          <span className="text-red-400">−</span> {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* Their gaps vs you */}
                {theirGapItems.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#828387] mb-1">
                      Their gaps vs you
                    </p>
                    <ul className="flex flex-col gap-0.5">
                      {theirGapItems.map((g) => (
                        <li key={g} className="text-xs text-[#49423D] flex items-center gap-1">
                          <span className="text-[#605A57]">+</span> {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {comp.enrichedAt && (
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="size-3 text-[#828387]" />
                    <span className="text-[10px] text-[#828387]">
                      Enriched {timeAgo(comp.enrichedAt)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
