"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Minus, X, HelpCircle } from "lucide-react"
import type { EnrichedCompetitor } from "@/lib/schemas/competitor-intel"

interface Props {
  competitors: EnrichedCompetitor[]
  yourName: string
  yourFeatures: string[]
}

type CellValue = "yes" | "partial" | "no" | "unknown"

function computeMatrix(
  competitors: EnrichedCompetitor[],
  yourFeatures: string[]
): { features: string[]; rows: Array<Record<string, CellValue>> } {
  const allFeatures = Array.from(
    new Set([
      ...yourFeatures,
      ...competitors.flatMap((c) => c.keyFeatures),
    ])
  ).slice(0, 12)

  const rows = allFeatures.map((feature) => {
    const row: Record<string, CellValue> = {}
    const featureLow = feature.toLowerCase()

    row["__you__"] = yourFeatures.some((f) => f.toLowerCase() === featureLow)
      ? "yes"
      : yourFeatures.some((f) => featureLow.includes(f.toLowerCase().split(" ")[0]!))
      ? "partial"
      : "no"

    for (const comp of competitors) {
      const has = comp.keyFeatures.some((f) => f.toLowerCase() === featureLow)
      const partial = !has && comp.keyFeatures.some((f) =>
        featureLow.includes(f.toLowerCase().split(" ")[0]!)
      )
      row[comp.id] = has ? "yes" : partial ? "partial" : "unknown"
    }

    return row
  })

  return { features: allFeatures, rows }
}

function CellIcon({ value, isYou }: { value: CellValue; isYou?: boolean }) {
  if (value === "yes") {
    return (
      <div className="flex items-center justify-center">
        <Check className={`size-3.5 ${isYou ? "text-[#37322F]" : "text-[#605A57]"}`} />
      </div>
    )
  }
  if (value === "partial") {
    return (
      <div className="flex items-center justify-center">
        <Minus className="size-3.5 text-[#828387]" />
      </div>
    )
  }
  if (value === "no") {
    return (
      <div className="flex items-center justify-center">
        <X className="size-3.5 text-[rgba(55,50,47,0.2)]" />
      </div>
    )
  }
  return (
    <div className="flex items-center justify-center">
      <HelpCircle className="size-3 text-[rgba(55,50,47,0.15)]" />
    </div>
  )
}

export function FeatureComparisonMatrix({ competitors, yourName, yourFeatures }: Props) {
  const { features, rows } = computeMatrix(competitors, yourFeatures)
  const gaps = rows.filter((r) => r["__you__"] !== "yes").length

  return (
    <Card className="border-[rgba(55,50,47,0.12)] shadow-none rounded-lg">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold text-[#37322F]">Feature comparison</CardTitle>
            <CardDescription className="text-xs text-[#828387]">
              Features detected across all tracked competitors
            </CardDescription>
          </div>
          {gaps > 0 && (
            <Badge
              variant="outline"
              className="text-[10px] border-[rgba(55,50,47,0.2)] text-[#605A57] shrink-0"
            >
              {gaps} gap{gaps !== 1 ? "s" : ""} detected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto -mx-2">
          <table className="w-full min-w-[520px] text-xs">
            <thead>
              <tr className="border-b border-[rgba(55,50,47,0.08)]">
                <th className="text-left px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#828387] w-40">
                  Feature
                </th>
                <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#37322F] text-center min-w-[72px]">
                  {yourName}
                </th>
                {competitors.map((c) => (
                  <th
                    key={c.id}
                    className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#828387] text-center min-w-[72px] truncate max-w-[88px]"
                  >
                    {c.companyName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((feature, i) => {
                const row = rows[i]!
                const youHaveIt = row["__you__"] === "yes"
                return (
                  <tr
                    key={feature}
                    className={[
                      "border-b border-[rgba(55,50,47,0.06)]",
                      !youHaveIt ? "bg-[rgba(55,50,47,0.015)]" : "",
                    ].join(" ")}
                  >
                    <td className="px-2 py-2 text-[#49423D] font-medium leading-tight">
                      <span className="flex items-center gap-1.5">
                        {feature}
                        {!youHaveIt && (
                          <Badge
                            variant="outline"
                            className="text-[8px] px-1 py-0 h-3.5 border-[rgba(55,50,47,0.2)] text-[#828387]"
                          >
                            gap
                          </Badge>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <CellIcon value={row["__you__"]!} isYou />
                    </td>
                    {competitors.map((c) => (
                      <td key={c.id} className="px-3 py-2 text-center">
                        <CellIcon value={row[c.id]!} />
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[rgba(55,50,47,0.08)]">
          {[
            { icon: <Check className="size-3 text-[#605A57]" />, label: "Confirmed" },
            { icon: <Minus className="size-3 text-[#828387]" />, label: "Partial" },
            { icon: <X className="size-3 text-[rgba(55,50,47,0.25)]" />, label: "Missing" },
            { icon: <HelpCircle className="size-3 text-[rgba(55,50,47,0.2)]" />, label: "Unknown" },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-1">
              {icon}
              <span className="text-[10px] text-[#828387]">{label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
