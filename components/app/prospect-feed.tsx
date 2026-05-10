"use client"

import { useState } from "react"
import { Users, Plus, Loader2, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ProspectDetailSheet } from "@/components/app/signal-detail-sheet"
import type { ProspectRecord, ProspectBrief } from "@/lib/schemas"

// ─── Fit bar ──────────────────────────────────────────────────────────────────

function FitBar({ score }: { score: number }) {
  return (
    <div className="h-1 w-16 rounded-full bg-[rgba(55,50,47,0.08)] shrink-0">
      <div className="h-1 rounded-full bg-[#37322F]" style={{ width: `${score}%` }} />
    </div>
  )
}

// ─── Analyze form ─────────────────────────────────────────────────────────────

interface AnalyzeState {
  status: "idle" | "loading" | "error"
  message?: string
}

interface AnalyzeFormProps {
  onSuccess: (prospect: ProspectRecord) => void
  onDismiss: () => void
}

function AnalyzeForm({ onSuccess, onDismiss }: AnalyzeFormProps) {
  const [url, setUrl] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [state, setState] = useState<AnalyzeState>({ status: "idle" })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return

    setState({ status: "loading" })
    try {
      const res = await fetch("/api/prospects/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), companyName: companyName.trim() || undefined }),
      })
      const data = await res.json() as { prospect?: ProspectRecord; error?: string }
      if (!res.ok) {
        setState({ status: "error", message: data.error ?? "Analysis failed" })
        return
      }
      if (data.prospect) {
        onSuccess(data.prospect)
        setUrl("")
        setCompanyName("")
        setState({ status: "idle" })
      }
    } catch {
      setState({ status: "error", message: "Network error" })
    }
  }

  return (
    <div
      data-testid="analyze-form"
      className="rounded-lg border border-[rgba(55,50,47,0.12)] bg-[rgba(55,50,47,0.015)] px-4 py-4"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-[#37322F]">Analyze a company</p>
        <button
          onClick={onDismiss}
          aria-label="Close"
          className="text-[#828387] hover:text-[#37322F] transition-colors"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <Input
          type="url"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          className="h-8 text-sm border-[rgba(55,50,47,0.15)] bg-white placeholder:text-[#828387]"
          data-testid="url-input"
        />
        <Input
          type="text"
          placeholder="Company name (optional)"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="h-8 text-sm border-[rgba(55,50,47,0.15)] bg-white placeholder:text-[#828387]"
        />
        {state.status === "error" && (
          <p className="text-xs text-red-600">{state.message}</p>
        )}
        <button
          type="submit"
          disabled={state.status === "loading" || !url.trim()}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-[rgba(55,50,47,0.15)] bg-[#37322F] px-4 text-xs font-medium text-white transition-colors hover:bg-[#49423D] disabled:opacity-60 disabled:cursor-not-allowed self-start"
        >
          {state.status === "loading" ? (
            <Loader2 className="size-3 animate-spin" />
          ) : null}
          {state.status === "loading" ? "Analyzing…" : "Analyze"}
        </button>
      </form>
    </div>
  )
}

// ─── ProspectFeed ─────────────────────────────────────────────────────────────

interface ProspectFeedProps {
  /** Pre-fetched prospects from the server (avoids client-side loading flash). */
  initialProspects: ProspectRecord[]
}

export function ProspectFeed({ initialProspects }: ProspectFeedProps) {
  const [prospects, setProspects] = useState<ProspectRecord[]>(initialProspects)
  const [selected, setSelected] = useState<ProspectRecord | null>(null)
  const [brief, setBrief] = useState<ProspectBrief | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [showAnalyzeForm, setShowAnalyzeForm] = useState(false)

  function handleSelect(prospect: ProspectRecord) {
    setSelected(prospect)
    setBrief(null) // reset brief for new selection
    setSheetOpen(true)
  }

  function handleAnalyzed(prospect: ProspectRecord) {
    setProspects((prev) => {
      // If it's a refresh of an existing prospect (same id), replace it
      const idx = prev.findIndex((p) => p.id === prospect.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = prospect
        return next.sort((a, b) => b.fitScore - a.fitScore)
      }
      return [prospect, ...prev].sort((a, b) => b.fitScore - a.fitScore)
    })
    setShowAnalyzeForm(false)
  }

  async function handleGenerateBrief(prospectId: string) {
    try {
      const res = await fetch("/api/prospects/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId }),
      })
      const data = await res.json() as { brief?: ProspectBrief }
      if (data.brief) setBrief(data.brief)
    } catch {
      // Silent fail — UI handles missing brief gracefully
    }
  }

  async function handleRefresh(prospect: ProspectRecord) {
    try {
      const res = await fetch("/api/prospects/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: prospect.website, companyName: prospect.companyName }),
      })
      const data = await res.json() as { prospect?: ProspectRecord }
      if (data.prospect) {
        handleAnalyzed(data.prospect)
        setSelected(data.prospect)
        setBrief(null)
      }
    } catch {
      // Silent fail
    }
  }

  const sorted = [...prospects].sort((a, b) => b.fitScore - a.fitScore)
  const highFit = sorted.filter((p) => p.fitScore >= 75).length

  return (
    <div data-testid="prospects-page" className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#37322F] font-sans tracking-tight">Prospects</h1>
          <p className="text-sm text-[#605A57] mt-1">
            Analyzed companies ranked by outreach fit for your startup.
          </p>
        </div>

        <button
          onClick={() => setShowAnalyzeForm((v) => !v)}
          data-testid="analyze-button"
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-[rgba(55,50,47,0.15)] bg-white px-4 text-xs font-medium text-[#37322F] transition-colors hover:bg-[rgba(55,50,47,0.04)]"
        >
          <Plus className="size-3" />
          Analyze company
        </button>
      </div>

      {/* Analyze form */}
      {showAnalyzeForm && (
        <AnalyzeForm
          onSuccess={handleAnalyzed}
          onDismiss={() => setShowAnalyzeForm(false)}
        />
      )}

      {/* Stats row */}
      <div className="flex items-center gap-4 text-sm text-[#605A57]">
        <span>
          <strong className="text-[#37322F]">{sorted.length}</strong> companies analyzed
        </span>
        <span className="text-[rgba(55,50,47,0.2)]">·</span>
        <span>
          <strong className="text-[#37322F]">{highFit}</strong> high fit
        </span>
      </div>

      {/* Prospect list */}
      <div data-testid="prospect-list" className="flex flex-col gap-2">
        {sorted.length === 0 && (
          <p className="text-sm text-[#828387]">
            No prospects yet. Click &ldquo;Analyze company&rdquo; to add the first one.
          </p>
        )}
        {sorted.map((prospect) => (
          <Card
            key={prospect.id}
            className="border-[rgba(55,50,47,0.12)] shadow-none rounded-lg py-4 gap-0 cursor-pointer hover:bg-[rgba(55,50,47,0.02)] transition-colors"
            onClick={() => handleSelect(prospect)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[#37322F]">
                      {prospect.companyName}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] border-[rgba(55,50,47,0.15)] text-[#605A57]"
                    >
                      {prospect.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <FitBar score={prospect.fitScore} />
                    <span className="text-xs tabular-nums text-[#605A57]">
                      {prospect.fitScore}% fit
                    </span>
                  </div>
                </div>
                <Users className="size-4 text-[#828387] shrink-0" />
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <p className="text-sm text-[#49423D] leading-relaxed line-clamp-2">
                {prospect.valueProp}
              </p>
              <p className="text-xs text-[#605A57] border-l-2 border-[rgba(55,50,47,0.15)] pl-2 leading-relaxed line-clamp-2">
                {prospect.recommendedAngle}
              </p>
              {prospect.hiringSignals.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {prospect.hiringSignals.slice(0, 2).map((sig, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(55,50,47,0.05)] text-[#605A57]"
                    >
                      {sig}
                    </span>
                  ))}
                  {prospect.hiringSignals.length > 2 && (
                    <span className="text-[10px] text-[#828387]">
                      +{prospect.hiringSignals.length - 2} more
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <ProspectDetailSheet
        prospect={selected}
        brief={brief}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onGenerateBrief={handleGenerateBrief}
        onRefresh={handleRefresh}
      />
    </div>
  )
}
