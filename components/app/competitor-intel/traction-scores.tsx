"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import type { EnrichedCompetitor } from "@/lib/schemas/competitor-intel"

interface Props {
  competitors: EnrichedCompetitor[]
  yourName: string
}

const SIGNAL_LABELS: Record<string, string> = {
  hiringActivity: "Hiring activity",
  productLaunchSignals: "Product launches",
  socialProof: "Social proof",
  integrationsCount: "Integrations",
}

function ScoreRow({ label, value, maxValue = 10 }: { label: string; value: number; maxValue?: number }) {
  const pct = Math.round((value / maxValue) * 100)
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[#605A57] w-28 shrink-0">{label}</span>
      <Progress value={pct} className="h-1.5 flex-1" />
      <span className="text-xs tabular-nums text-[#49423D] w-5 text-right">{value}</span>
    </div>
  )
}

export function TractionScores({ competitors, yourName }: Props) {
  const showComps = competitors.slice(0, 4)

  return (
    <Card className="border-[rgba(55,50,47,0.12)] shadow-none rounded-lg">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold text-[#37322F]">Traction signals</CardTitle>
            <CardDescription className="text-xs text-[#828387]">
              Estimated from public signals — not official data
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] border-[rgba(55,50,47,0.2)] text-[#828387] shrink-0"
          >
            Estimated
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-5">
          {showComps.map((comp) => {
            const signals = comp.tractionSignals
            if (!signals) return null
            return (
              <div key={comp.id}>
                <p className="text-xs font-semibold text-[#37322F] mb-2">{comp.companyName}</p>
                <div className="flex flex-col gap-1.5">
                  {(Object.keys(SIGNAL_LABELS) as Array<keyof typeof signals>).map((key) => (
                    <ScoreRow
                      key={key}
                      label={SIGNAL_LABELS[key]!}
                      value={signals[key]}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
