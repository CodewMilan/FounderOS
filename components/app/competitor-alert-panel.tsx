"use client"

import { useState } from "react"
import { Send, Loader2, Play, Radar } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import type { CompetitorAlertResult, WorkflowType } from "@/lib/schemas/competitor-alert"

// ─── Types ────────────────────────────────────────────────────────────────────

type PanelStatus = "idle" | "running" | "success" | "error"

interface PanelState {
  status: PanelStatus
  message?: string
  result?: CompetitorAlertResult
}

// ─── Workflow type label map ───────────────────────────────────────────────────

const WORKFLOW_LABELS: Record<WorkflowType, string> = {
  auto: "Auto-detect",
  feature_gap: "Feature Gap",
  pricing_response: "Pricing Response",
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PanelStatus }) {
  if (status === "idle") return null
  if (status === "running")
    return (
      <Badge variant="outline" className="text-[10px] border-[rgba(55,50,47,0.15)] text-[#605A57]">
        Running…
      </Badge>
    )
  if (status === "success")
    return (
      <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-600 bg-emerald-50">
        Done
      </Badge>
    )
  return (
    <Badge variant="outline" className="text-[10px] border-red-200 text-red-600 bg-red-50">
      Error
    </Badge>
  )
}

// ─── CompetitorAlertPanel ─────────────────────────────────────────────────────

export function CompetitorAlertPanel() {
  const [competitorUrl, setCompetitorUrl] = useState("")
  const [userSiteUrl, setUserSiteUrl] = useState("")
  const [workflowType, setWorkflowType] = useState<WorkflowType>("auto")
  const [state, setState] = useState<PanelState>({ status: "idle" })

  async function handleRunWorkflow() {
    if (!competitorUrl.trim()) return

    setState({ status: "running" })

    try {
      const res = await fetch("/api/workflows/competitor-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitorUrl: competitorUrl.trim(),
          userSiteUrl: userSiteUrl.trim() || undefined,
          workflowType,
        }),
      })

      const data = await res.json() as CompetitorAlertResult & { error?: string }

      if (!res.ok) {
        setState({ status: "error", message: data.error ?? "Workflow failed" })
        return
      }

      setState({ status: "success", result: data })
    } catch {
      setState({ status: "error", message: "Network error — could not reach the workflow" })
    }
  }

  async function handleSendToTelegram() {
    if (!state.result?.brief) return

    setState((prev) => ({ ...prev, status: "running" }))

    try {
      const res = await fetch("/api/workflows/competitor-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitorUrl: competitorUrl.trim(),
          userSiteUrl: userSiteUrl.trim() || undefined,
          workflowType,
        }),
      })
      const data = await res.json() as CompetitorAlertResult & { error?: string }

      if (!res.ok) {
        setState((prev) => ({ ...prev, status: "error", message: data.error ?? "Send failed" }))
        return
      }

      setState({ status: "success", result: data })
    } catch {
      setState((prev) => ({ ...prev, status: "error", message: "Network error during send" }))
    }
  }

  const result = state.result

  return (
    <Card
      data-testid="competitor-alert-panel"
      className="border-[rgba(55,50,47,0.12)] shadow-none rounded-lg"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Radar className="size-4 text-[#37322F]" />
              <span className="text-base font-semibold text-[#37322F]">
                Competitor Intelligence Alert
              </span>
              <StatusBadge status={state.status} />
            </div>
            <p className="text-sm text-[#605A57]">
              Scrape a competitor site, analyze it with AI, and send a brief to Telegram.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {/* Competitor URL */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#37322F]">Competitor URL</label>
          <Input
            type="url"
            placeholder="https://competitor.com"
            value={competitorUrl}
            onChange={(e) => setCompetitorUrl(e.target.value)}
            disabled={state.status === "running"}
            className="h-8 text-sm border-[rgba(55,50,47,0.15)] bg-white placeholder:text-[#828387]"
            data-testid="competitor-url-input"
          />
        </div>

        {/* Your site URL */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#37322F]">
            Your site URL{" "}
            <span className="font-normal text-[#828387]">(optional — used for comparison)</span>
          </label>
          <Input
            type="url"
            placeholder="https://yoursite.com"
            value={userSiteUrl}
            onChange={(e) => setUserSiteUrl(e.target.value)}
            disabled={state.status === "running"}
            className="h-8 text-sm border-[rgba(55,50,47,0.15)] bg-white placeholder:text-[#828387]"
            data-testid="user-site-url-input"
          />
        </div>

        {/* Workflow type */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#37322F]">Alert type</label>
          <select
            value={workflowType}
            onChange={(e) => setWorkflowType(e.target.value as WorkflowType)}
            disabled={state.status === "running"}
            data-testid="workflow-type-select"
            className="h-8 w-full rounded-md border border-[rgba(55,50,47,0.15)] bg-white px-3 text-sm text-[#37322F] focus:outline-none focus:ring-1 focus:ring-[rgba(55,50,47,0.3)] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {(Object.keys(WORKFLOW_LABELS) as WorkflowType[]).map((key) => (
              <option key={key} value={key}>
                {WORKFLOW_LABELS[key]}
              </option>
            ))}
          </select>
        </div>

        {/* Error message */}
        {state.status === "error" && state.message && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {state.message}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunWorkflow}
            disabled={state.status === "running" || !competitorUrl.trim()}
            data-testid="run-workflow-button"
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[rgba(55,50,47,0.15)] bg-[#37322F] px-4 text-xs font-medium text-white transition-colors hover:bg-[#49423D] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {state.status === "running" ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Play className="size-3" />
            )}
            {state.status === "running" ? "Running…" : "Run workflow"}
          </button>

          {result && (
            <button
              onClick={handleSendToTelegram}
              disabled={state.status === "running"}
              data-testid="send-telegram-button"
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[rgba(55,50,47,0.15)] bg-white px-4 text-xs font-medium text-[#37322F] transition-colors hover:bg-[rgba(55,50,47,0.04)] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Send className="size-3" />
              {result.telegramSent ? "Sent ✓" : "Send to Telegram"}
            </button>
          )}
        </div>

        {/* Brief preview */}
        {result && (
          <div
            data-testid="brief-preview"
            className="flex flex-col gap-2 rounded-lg border border-[rgba(55,50,47,0.12)] bg-[rgba(55,50,47,0.015)] px-4 py-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#37322F]">Generated brief</p>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-[10px] border-[rgba(55,50,47,0.15)] text-[#605A57]"
                >
                  {result.workflowType === "feature_gap" ? "Feature Gap" : "Pricing Response"}
                </Badge>
                {result.telegramSent && (
                  <Badge
                    variant="outline"
                    className="text-[10px] border-emerald-200 text-emerald-600 bg-emerald-50"
                  >
                    Sent to Telegram
                  </Badge>
                )}
                {result.telegramError && (
                  <Badge
                    variant="outline"
                    className="text-[10px] border-amber-200 text-amber-600 bg-amber-50"
                  >
                    Not sent
                  </Badge>
                )}
              </div>
            </div>
            <pre className="whitespace-pre-wrap text-xs text-[#49423D] leading-relaxed font-sans">
              {result.brief}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
