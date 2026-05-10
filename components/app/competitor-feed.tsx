"use client"

import { useState } from "react"
import { Radar, RefreshCw, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { CompetitorDetailSheet } from "@/components/app/signal-detail-sheet"
import type { CompetitorChange } from "@/lib/schemas"

// ─── Severity badge ───────────────────────────────────────────────────────────

function SeverityBadge({ score }: { score: number }) {
  if (score >= 80)
    return (
      <Badge variant="outline" className="text-[10px] border-red-200 text-red-600 bg-red-50">
        High
      </Badge>
    )
  if (score >= 60)
    return (
      <Badge variant="outline" className="text-[10px] border-amber-200 text-amber-600 bg-amber-50">
        Medium
      </Badge>
    )
  return (
    <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-600 bg-emerald-50">
      Low
    </Badge>
  )
}

// ─── Scan status banner ───────────────────────────────────────────────────────

type ScanStatus = "idle" | "scanning" | "done" | "error"

interface ScanState {
  status: ScanStatus
  scanned?: number
  detected?: number
  message?: string
}

// ─── CompetitorFeed ───────────────────────────────────────────────────────────

interface CompetitorFeedProps {
  /** Pre-fetched changes from the server (avoids client-side fetch on initial load). */
  initialChanges: CompetitorChange[]
}

export function CompetitorFeed({ initialChanges }: CompetitorFeedProps) {
  const [changes, setChanges] = useState<CompetitorChange[]>(initialChanges)
  const [selected, setSelected] = useState<CompetitorChange | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [scanState, setScanState] = useState<ScanState>({ status: "idle" })

  function handleSelect(change: CompetitorChange) {
    setSelected(change)
    setSheetOpen(true)
  }

  async function handleScan() {
    setScanState({ status: "scanning" })
    try {
      const res = await fetch("/api/competitors/scan", { method: "POST" })
      const data = await res.json() as {
        scanned?: number
        detected?: number
        changes?: CompetitorChange[]
        error?: string
      }

      if (!res.ok) {
        setScanState({ status: "error", message: data.error ?? "Scan failed" })
        return
      }

      // Merge new changes with existing ones, newest first
      if (data.changes && data.changes.length > 0) {
        setChanges((prev) => {
          const existingIds = new Set(prev.map((c) => c.id))
          const newOnes = data.changes!.filter((c) => !existingIds.has(c.id))
          return [...newOnes, ...prev]
        })
      }

      // Also refresh the full list from the API to pick up all stored changes
      const listRes = await fetch("/api/competitors")
      const listData = await listRes.json() as { changes?: CompetitorChange[] }
      if (listData.changes) {
        setChanges(
          listData.changes.sort(
            (a, b) => b.significanceScore - a.significanceScore
          )
        )
      }

      setScanState({
        status: "done",
        scanned: data.scanned,
        detected: data.detected,
      })
    } catch {
      setScanState({ status: "error", message: "Network error during scan" })
    }
  }

  const sorted = [...changes].sort((a, b) => b.significanceScore - a.significanceScore)
  const highPriority = sorted.filter((c) => c.significanceScore >= 80).length

  return (
    <div data-testid="competitors-page" className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#37322F] font-sans">Competitor Radar</h1>
          <p className="text-sm text-[#605A57] mt-0.5">
            Tracked changes across competitor pricing, product, and hiring pages.
          </p>
        </div>

        <button
          onClick={handleScan}
          disabled={scanState.status === "scanning"}
          data-testid="scan-button"
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-[rgba(55,50,47,0.15)] bg-white px-4 text-xs font-medium text-[#37322F] transition-colors hover:bg-[rgba(55,50,47,0.04)] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {scanState.status === "scanning" ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <RefreshCw className="size-3" />
          )}
          {scanState.status === "scanning" ? "Scanning…" : "Scan now"}
        </button>
      </div>

      {/* Scan result banner */}
      {scanState.status === "done" && (
        <div className="rounded-lg border border-[rgba(55,50,47,0.12)] bg-[rgba(55,50,47,0.02)] px-4 py-2.5 text-xs text-[#605A57]">
          Scanned{" "}
          <strong className="text-[#37322F]">{scanState.scanned}</strong> source
          {scanState.scanned !== 1 ? "s" : ""} —{" "}
          <strong className="text-[#37322F]">{scanState.detected}</strong> new change
          {scanState.detected !== 1 ? "s" : ""} detected.
        </div>
      )}
      {scanState.status === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-600">
          {scanState.message}
        </div>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-4 text-sm text-[#605A57]">
        <span>
          <strong className="text-[#37322F]">{sorted.length}</strong> changes detected
        </span>
        <span className="text-[rgba(55,50,47,0.2)]">·</span>
        <span>
          <strong className="text-[#37322F]">{highPriority}</strong> high priority
        </span>
      </div>

      {/* Change feed */}
      <div data-testid="competitor-list" className="flex flex-col gap-2">
        {sorted.length === 0 && (
          <p className="text-sm text-[#828387]">No changes detected yet. Click &ldquo;Scan now&rdquo; to run a scan.</p>
        )}
        {sorted.map((change) => (
          <Card
            key={change.id}
            className="border-[rgba(55,50,47,0.12)] shadow-none rounded-lg py-4 gap-0 cursor-pointer hover:bg-[rgba(55,50,47,0.02)] transition-colors"
            onClick={() => handleSelect(change)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[#37322F]">
                      {change.competitorName}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] border-[rgba(55,50,47,0.15)] text-[#605A57]"
                    >
                      {change.pageType}
                    </Badge>
                    <SeverityBadge score={change.significanceScore} />
                  </div>
                  <p className="text-xs text-[#828387]">
                    {new Date(change.detectedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Radar className="size-3 text-[#828387]" />
                  <span className="text-xs tabular-nums font-medium text-[#37322F]">
                    {change.significanceScore}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-[#49423D] leading-relaxed">{change.summary}</p>
              <p className="mt-2 text-xs text-[#605A57] border-l-2 border-[rgba(55,50,47,0.15)] pl-2 leading-relaxed">
                {change.suggestedAction}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <CompetitorDetailSheet
        change={selected}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}
