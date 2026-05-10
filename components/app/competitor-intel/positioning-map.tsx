"use client"

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { EnrichedCompetitor } from "@/lib/schemas/competitor-intel"

interface Props {
  competitors: EnrichedCompetitor[]
  yourName: string
  yourX?: number
  yourY?: number
}

interface DotProps {
  cx?: number
  cy?: number
  payload?: { name: string; isYou: boolean }
}

function CustomDot({ cx = 0, cy = 0, payload }: DotProps) {
  if (!payload) return null
  const isYou = payload.isYou
  const r = isYou ? 7 : 5

  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={isYou ? "var(--chart-1)" : "var(--chart-2)"}
        opacity={isYou ? 1 : 0.7}
        stroke={isYou ? "white" : "white"}
        strokeWidth={1.5}
      />
      <text
        x={cx}
        y={cy - r - 4}
        textAnchor="middle"
        fontSize={9}
        fill={isYou ? "#37322F" : "#605A57"}
        fontWeight={isYou ? 600 : 400}
      >
        {payload.name.length > 10 ? payload.name.slice(0, 10) + "…" : payload.name}
      </text>
    </g>
  )
}

export function PositioningMap({ competitors, yourName, yourX = 5, yourY = 5 }: Props) {
  const data = [
    { name: yourName, x: yourX, y: yourY, isYou: true },
    ...competitors.map((c) => ({
      name: c.companyName,
      x: c.positioningX ?? 5,
      y: c.positioningY ?? 5,
      isYou: false,
    })),
  ]

  return (
    <Card className="border-[rgba(55,50,47,0.12)] shadow-none rounded-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-[#37322F]">Positioning map</CardTitle>
        <CardDescription className="text-xs text-[#828387]">
          Feature breadth (x) vs price level (y) · Estimated
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 24, right: 24, bottom: 24, left: 8 }}>
              <CartesianGrid stroke="rgba(55,50,47,0.07)" />
              <XAxis
                type="number"
                dataKey="x"
                domain={[0, 10]}
                tick={{ fontSize: 9, fill: "#828387" }}
                tickLine={false}
                axisLine={false}
                label={{
                  value: "← Narrow features · Broad features →",
                  position: "insideBottom",
                  offset: -12,
                  fontSize: 9,
                  fill: "#828387",
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                domain={[0, 10]}
                tick={{ fontSize: 9, fill: "#828387" }}
                tickLine={false}
                axisLine={false}
                label={{
                  value: "← Low price · High price →",
                  angle: -90,
                  position: "insideLeft",
                  offset: 16,
                  fontSize: 9,
                  fill: "#828387",
                }}
              />
              {/* Quadrant dividers */}
              <ReferenceLine x={5} stroke="rgba(55,50,47,0.1)" strokeDasharray="3 3" />
              <ReferenceLine y={5} stroke="rgba(55,50,47,0.1)" strokeDasharray="3 3" />
              <Tooltip
                cursor={false}
                contentStyle={{
                  border: "1px solid rgba(55,50,47,0.12)",
                  borderRadius: "6px",
                  fontSize: 11,
                  background: "white",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                }}
                formatter={(value: number, name: string) => [value.toFixed(1), name]}
                labelFormatter={() => ""}
              />
              <Scatter
                data={data}
                shape={CustomDot as unknown as React.ReactElement}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
