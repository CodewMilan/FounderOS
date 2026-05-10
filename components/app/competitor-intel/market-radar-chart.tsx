"use client"

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { EnrichedCompetitor } from "@/lib/schemas/competitor-intel"

interface Props {
  competitors: EnrichedCompetitor[]
  yourName: string
  yourScores: {
    pricingCompetitiveness: number
    featureDepth: number
    marketPresence: number
    geographicReach: number
    targetClarity: number
    tractionSignals: number
  }
}

const AXES = [
  { key: "pricingCompetitiveness", label: "Pricing" },
  { key: "featureDepth", label: "Features" },
  { key: "marketPresence", label: "Market" },
  { key: "geographicReach", label: "Geography" },
  { key: "targetClarity", label: "Clarity" },
  { key: "tractionSignals", label: "Traction" },
] as const

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

export function MarketRadarChart({ competitors, yourName, yourScores }: Props) {
  const top = competitors.slice(0, 3)

  const data = AXES.map(({ key, label }) => {
    const row: Record<string, number | string> = { axis: label }
    row[yourName] = yourScores[key]
    for (const comp of top) {
      row[comp.companyName] = comp.radarScores?.[key] ?? 5
    }
    return row
  })

  const allNames = [yourName, ...top.map((c) => c.companyName)]

  return (
    <Card className="border-[rgba(55,50,47,0.12)] shadow-none rounded-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-[#37322F]">Market position</CardTitle>
        <CardDescription className="text-xs text-[#828387]">
          Estimated scores across 6 competitive dimensions · 1–10 scale
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} margin={{ top: 16, right: 32, bottom: 16, left: 32 }}>
              <PolarGrid stroke="rgba(55,50,47,0.1)" />
              <PolarAngleAxis
                dataKey="axis"
                tick={{ fontSize: 11, fill: "#605A57" }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 10]}
                tick={{ fontSize: 9, fill: "#828387" }}
                tickCount={4}
              />
              {allNames.map((name, i) => (
                <Radar
                  key={name}
                  name={name}
                  dataKey={name}
                  stroke={COLORS[i % COLORS.length]}
                  fill={COLORS[i % COLORS.length]}
                  fillOpacity={i === 0 ? 0.25 : 0.08}
                  strokeWidth={i === 0 ? 2 : 1.5}
                />
              ))}
              <Tooltip
                contentStyle={{
                  border: "1px solid rgba(55,50,47,0.12)",
                  borderRadius: "6px",
                  fontSize: 11,
                  background: "white",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, color: "#605A57", paddingTop: 8 }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
