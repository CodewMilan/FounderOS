"use client"

import { useState } from "react"
import { Banknote, Clock } from "lucide-react"
import { PageHeading } from "@/components/app/page-heading"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { FundingDetailSheet } from "@/components/app/signal-detail-sheet"
import { seedFundingOpportunities, seedStartupProfile } from "@/lib/seed"
import type { FundingOpportunity } from "@/lib/schemas"

function daysUntil(dateStr: string): number {
  return Math.ceil(
    (new Date(dateStr).getTime() - Date.now()) /
      (1000 * 60 * 60 * 24)
  )
}

function DeadlineBadge({ deadline }: { deadline?: string }) {
  if (!deadline) return <span className="text-[10px] text-[#828387]">Rolling deadline</span>
  const days = daysUntil(deadline)
  const urgent = days <= 30
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] ${
        urgent ? "text-red-600" : "text-[#605A57]"
      }`}
    >
      <Clock className="size-3" />
      {deadline} ({days}d)
    </span>
  )
}

export default function FundingPage() {
  const [selected, setSelected] = useState<FundingOpportunity | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  function handleSelect(opp: FundingOpportunity) {
    setSelected(opp)
    setSheetOpen(true)
  }

  const sorted = [...seedFundingOpportunities].sort((a, b) => b.fitScore - a.fitScore)

  return (
    <div data-testid="funding-page" className="flex flex-col gap-6">
      <div>
        <PageHeading>Funding Scout</PageHeading>
        <p className="text-sm text-[#605A57] mt-1">
          Programs and grants ranked by fit for{" "}
          <strong className="text-[#37322F]">{seedStartupProfile.startupName}</strong>{" "}
          ({seedStartupProfile.stage} · {seedStartupProfile.sector}).
        </p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-[#605A57]">
        <span>
          <strong className="text-[#37322F]">{sorted.length}</strong> opportunities
        </span>
        <span className="text-[rgba(55,50,47,0.2)]">·</span>
        <span>
          <strong className="text-[#37322F]">
            {sorted.filter((f) => f.equityType === "non-dilutive").length}
          </strong>{" "}
          non-dilutive
        </span>
        <span className="text-[rgba(55,50,47,0.2)]">·</span>
        <span>
          <strong className="text-[#37322F]">
            {
              sorted.filter((f) => {
                if (!f.deadline) return false
                return daysUntil(f.deadline) <= 60
              }).length
            }
          </strong>{" "}
          deadlines ≤ 60 days
        </span>
      </div>

      {/* Opportunity list */}
      <div data-testid="funding-list" className="flex flex-col gap-2">
        {sorted.map((opp) => (
          <Card
            key={opp.id}
            className="border-[rgba(55,50,47,0.12)] shadow-none rounded-lg py-4 gap-0 cursor-pointer hover:bg-[rgba(55,50,47,0.02)] transition-colors"
            onClick={() => handleSelect(opp)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[#37322F]">
                      {opp.programName}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] border-[rgba(55,50,47,0.15)] text-[#605A57]"
                    >
                      {opp.opportunityType}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[10px] border-[rgba(55,50,47,0.15)] text-[#605A57]"
                    >
                      {opp.equityType}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#828387]">
                    <span>{opp.provider}</span>
                    <span className="text-[rgba(55,50,47,0.2)]">·</span>
                    <DeadlineBadge deadline={opp.deadline} />
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0 gap-0.5">
                  <span className="text-sm font-semibold tabular-nums text-[#37322F]">
                    {opp.fitScore}%
                  </span>
                  <Banknote className="size-3.5 text-[#828387]" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-1.5">
              {opp.fundingAmount && (
                <p className="text-xs font-medium text-[#49423D]">{opp.fundingAmount}</p>
              )}
              <p className="text-sm text-[#49423D] leading-relaxed line-clamp-2">
                {opp.fitReason}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <FundingDetailSheet
        opportunity={selected}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}
