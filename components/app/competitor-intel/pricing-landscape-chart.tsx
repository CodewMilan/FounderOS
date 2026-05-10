"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LabelList,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { EnrichedCompetitor } from "@/lib/schemas/competitor-intel"

interface Props {
  competitors: EnrichedCompetitor[]
  yourName: string
  yourMonthlyPriceEntry?: number
  yourHasFreeTier?: boolean
}

export function PricingLandscapeChart({
  competitors,
  yourName,
  yourMonthlyPriceEntry,
  yourHasFreeTier,
}: Props) {
  const yourEntry = yourMonthlyPriceEntry ?? 0

  const data = [
    {
      name: yourName,
      price: yourEntry,
      hasFreeTier: yourHasFreeTier ?? yourEntry === 0,
      isYou: true,
    },
    ...competitors.map((c) => ({
      name: c.companyName,
      price: c.estimatedMonthlyPriceEntry ?? 0,
      hasFreeTier: c.hasFreeTier,
      isYou: false,
    })),
  ].sort((a, b) => a.price - b.price)

  const maxPrice = Math.max(...data.map((d) => d.price), 50)

  return (
    <Card className="border-[rgba(55,50,47,0.12)] shadow-none rounded-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-[#37322F]">Pricing landscape</CardTitle>
        <CardDescription className="text-xs text-[#828387]">
          Estimated lowest monthly plan entry point · USD
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 48, bottom: 0, left: 0 }}
              barCategoryGap="30%"
            >
              <CartesianGrid
                horizontal={false}
                stroke="rgba(55,50,47,0.08)"
              />
              <XAxis
                type="number"
                domain={[0, maxPrice + 10]}
                tick={{ fontSize: 10, fill: "#828387" }}
                tickFormatter={(v: number) => (v === 0 ? "Free" : `$${v}`)}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={70}
                tick={{ fontSize: 11, fill: "#49423D" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value: number) =>
                  value === 0 ? ["Free tier", "Entry price"] : [`$${value}/mo`, "Entry price"]
                }
                contentStyle={{
                  border: "1px solid rgba(55,50,47,0.12)",
                  borderRadius: "6px",
                  fontSize: 11,
                  background: "white",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                }}
              />
              <Bar dataKey="price" radius={[0, 3, 3, 0]} maxBarSize={16}>
                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={entry.isYou ? "var(--chart-1)" : "var(--chart-2)"}
                    opacity={entry.isYou ? 1 : 0.65}
                  />
                ))}
                <LabelList
                  dataKey="price"
                  position="right"
                  formatter={(v: number) => (v === 0 ? "Free" : `$${v}/mo`)}
                  style={{ fontSize: 10, fill: "#605A57" }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Free tier indicators */}
        {data.some((d) => d.hasFreeTier) && (
          <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-[rgba(55,50,47,0.08)]">
            <span className="text-[10px] text-[#828387]">Free tier available:</span>
            {data
              .filter((d) => d.hasFreeTier)
              .map((d) => (
                <span
                  key={d.name}
                  className="text-[10px] font-medium text-[#605A57] bg-[rgba(55,50,47,0.05)] px-1.5 py-0.5 rounded"
                >
                  {d.name}
                </span>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
