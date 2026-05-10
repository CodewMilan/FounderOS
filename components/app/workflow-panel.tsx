"use client"

import { useState, useEffect, useRef } from "react"
import {
  Loader2,
  Zap,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Ticket,
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { UnifiedRunResult, UrlType } from "@/lib/schemas/workflows"

// ─── Types ────────────────────────────────────────────────────────────────────

type RunStatus = "idle" | "running" | "success" | "error"

interface StepState {
  label: string
  status: "pending" | "active" | "done" | "error"
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_STEPS: string[] = [
  "Scraping URL",
  "Analyzing content",
  "Detecting workflow type",
  "Generating brief",
  "Sending to Telegram",
  "Posting to Slack",
]

const TYPE_LABELS: Record<UrlType, string> = {
  competitor: "Competitor",
  prospect: "Sales Prospect",
  funding: "Funding / Grant",
  unknown: "General Intel",
}

const STEP_INTERVAL_MS = 900

// ─── Small helpers ────────────────────────────────────────────────────────────

function DeliveryBadge({ sent, label, error }: { sent: boolean; label: string; error?: string }) {
  if (sent) {
    return (
      <Badge
        variant="outline"
        className="text-[10px] border-emerald-200 text-emerald-600 bg-emerald-50"
      >
        {label} ✓
      </Badge>
    )
  }
  return (
    <Badge
      variant="outline"
      className="text-[10px] border-amber-200 text-amber-600 bg-amber-50"
      title={error}
    >
      {label} —
    </Badge>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[#605A57] font-medium text-[11px]">{label}</span>
      <span className="text-[#37322F] text-xs leading-relaxed">{value}</span>
    </div>
  )
}

// ─── LiveSteps ────────────────────────────────────────────────────────────────

function LiveSteps({
  steps,
  detectedType,
}: {
  steps: StepState[]
  detectedType?: UrlType
}) {
  return (
    <ul data-testid="status-steps" className="flex flex-col gap-1.5 py-1">
      {steps.map((step, i) => {
        const isActive = step.status === "active"
        const isDone = step.status === "done"
        const isError = step.status === "error"
        const isPending = step.status === "pending"

        let label = step.label
        if (step.label === "Detecting workflow type" && detectedType && isDone) {
          label = `Detecting workflow type: ${TYPE_LABELS[detectedType]}`
        }

        return (
          <li
            key={i}
            data-testid={`step-${i}`}
            className={[
              "flex items-center gap-2 text-xs transition-colors",
              isDone ? "text-[#828387]" : "",
              isActive ? "text-[#37322F] font-medium" : "",
              isPending ? "text-[rgba(55,50,47,0.3)]" : "",
              isError ? "text-red-600" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {isActive && <Loader2 className="size-3 shrink-0 animate-spin text-[#37322F]" />}
            {isDone && <CheckCircle2 className="size-3 shrink-0 text-emerald-500" />}
            {isError && <AlertCircle className="size-3 shrink-0 text-red-500" />}
            {isPending && <span className="size-3 shrink-0 block rounded-full border border-[rgba(55,50,47,0.15)]" />}
            {label}
          </li>
        )
      })}
    </ul>
  )
}

// ─── ResultCard ───────────────────────────────────────────────────────────────

function ResultCard({
  result,
  onCreateDevTicket,
  devTicketStatus,
}: {
  result: UnifiedRunResult
  onCreateDevTicket: () => void
  devTicketStatus: "idle" | "running" | "success" | "error"
}) {
  const { detectedType, briefs, deliveries, devTicketAvailable } = result
  const brief = briefs[0] as Record<string, unknown> | undefined
  const pricingBrief = detectedType === "competitor" ? (briefs[1] as Record<string, unknown> | undefined) : undefined

  return (
    <div data-testid="result-card" className="flex flex-col gap-3">
      <Separator className="bg-[rgba(55,50,47,0.08)]" />

      <div className="flex flex-col gap-3 rounded-lg border border-[rgba(55,50,47,0.12)] bg-[rgba(55,50,47,0.015)] px-4 py-3">
        {/* Header row */}
        <div className="flex items-start justify-between flex-wrap gap-2">
          <Badge
            data-testid="detected-type-badge"
            variant="outline"
            className="text-[10px] border-[rgba(55,50,47,0.2)] text-[#605A57]"
          >
            Detected: {TYPE_LABELS[detectedType]}
          </Badge>
          <div className="flex items-center gap-1.5 flex-wrap">
            <DeliveryBadge
              sent={deliveries.telegram.sent}
              label={
                deliveries.telegram.sent && deliveries.telegram.timestamp
                  ? `Telegram ${new Date(deliveries.telegram.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                  : "Telegram"
              }
              error={deliveries.telegram.error}
            />
            <DeliveryBadge
              sent={deliveries.slack.sent}
              label={
                deliveries.slack.sent && deliveries.slack.channel
                  ? `Slack ${deliveries.slack.channel}`
                  : "Slack"
              }
              error={deliveries.slack.error}
            />
          </div>
        </div>

        {/* Brief content */}
        {brief && (
          <div className="flex flex-col gap-2">
            {detectedType === "competitor" && (
              <>
                <p className="text-[11px] font-semibold text-[#37322F] uppercase tracking-wide">
                  Feature Gap
                </p>
                <div className="grid gap-1.5">
                  {!!brief.competitorName && <Row label="Competitor" value={brief.competitorName as string} />}
                  {!!brief.featureName && <Row label="Feature" value={brief.featureName as string} />}
                  {!!brief.whatItDoes && <Row label="What it does" value={brief.whatItDoes as string} />}
                  {!!brief.gap && <Row label="Your gap" value={brief.gap as string} />}
                  {!!brief.whyItMatters && <Row label="Why it matters" value={brief.whyItMatters as string} />}
                  {!!brief.suggestedAction && <Row label="Suggested action" value={brief.suggestedAction as string} />}
                  {!!brief.confidence && <Row label="Confidence" value={brief.confidence as string} />}
                </div>
                {pricingBrief && (
                  <>
                    <Separator className="my-1 bg-[rgba(55,50,47,0.08)]" />
                    <p className="text-[11px] font-semibold text-[#37322F] uppercase tracking-wide">
                      Pricing Response
                    </p>
                    <div className="grid gap-1.5">
                      {!!pricingBrief.changeDetected && <Row label="Change detected" value={pricingBrief.changeDetected as string} />}
                      {!!pricingBrief.theirPricing && <Row label="Their pricing" value={pricingBrief.theirPricing as string} />}
                      {!!pricingBrief.suggestedResponse && <Row label="Suggested response" value={pricingBrief.suggestedResponse as string} />}
                      {!!pricingBrief.urgency && <Row label="Urgency" value={pricingBrief.urgency as string} />}
                    </div>
                  </>
                )}
              </>
            )}

            {(detectedType === "prospect" || detectedType === "unknown") && (
              <>
                <p className="text-[11px] font-semibold text-[#37322F] uppercase tracking-wide">
                  Prospect Brief
                </p>
                <div className="grid gap-1.5">
                  {!!brief.companyName && <Row label="Company" value={brief.companyName as string} />}
                  {!!brief.description && <Row label="Description" value={brief.description as string} />}
                  {!!brief.icpFit && <Row label="ICP fit" value={brief.icpFit as string} />}
                  {Array.isArray(brief.keySignals) && brief.keySignals.length > 0 && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[#605A57] font-medium text-[11px]">Key signals</span>
                      <ul className="list-disc list-inside text-xs text-[#37322F] space-y-0.5">
                        {(brief.keySignals as string[]).map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {!!brief.outreachAngle && <Row label="Outreach angle" value={brief.outreachAngle as string} />}
                  {!!brief.confidence && <Row label="Confidence" value={brief.confidence as string} />}
                </div>
              </>
            )}

            {detectedType === "funding" && (
              <>
                <p className="text-[11px] font-semibold text-[#37322F] uppercase tracking-wide">
                  Funding Opportunity
                </p>
                <div className="grid gap-1.5">
                  {!!brief.programName && <Row label="Program" value={brief.programName as string} />}
                  {!!brief.provider && <Row label="Provider" value={brief.provider as string} />}
                  {!!brief.deadline && (
                    <Row
                      label="Deadline"
                      value={`${brief.deadline as string}${brief.isUrgent ? " ⚠️" : ""}`}
                    />
                  )}
                  {!!brief.eligibility && <Row label="Eligibility" value={brief.eligibility as string} />}
                  {!!brief.fitReason && <Row label="Fit" value={brief.fitReason as string} />}
                </div>
              </>
            )}
          </div>
        )}

        {/* Dev ticket action */}
        {devTicketAvailable && (
          <>
            <Separator className="bg-[rgba(55,50,47,0.08)]" />
            <div className="flex items-center gap-2">
              <button
                onClick={onCreateDevTicket}
                disabled={devTicketStatus === "running" || devTicketStatus === "success"}
                data-testid="create-dev-ticket-btn"
                className="inline-flex h-7 items-center gap-1.5 rounded-full border border-[rgba(55,50,47,0.15)] bg-white px-3 text-[11px] font-medium text-[#37322F] transition-colors hover:bg-[rgba(55,50,47,0.04)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {devTicketStatus === "running" ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Ticket className="size-3" />
                )}
                {devTicketStatus === "success"
                  ? "Dev ticket posted ✓"
                  : devTicketStatus === "running"
                  ? "Posting…"
                  : "Create Dev Ticket → Slack"}
              </button>
              {devTicketStatus === "error" && (
                <span className="text-[11px] text-red-600">Failed to post ticket</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── WorkflowPanel ────────────────────────────────────────────────────────────

export function WorkflowPanel() {
  const [url, setUrl] = useState("")
  const [userSiteUrl, setUserSiteUrl] = useState("")
  const [showUserSite, setShowUserSite] = useState(false)
  const [runStatus, setRunStatus] = useState<RunStatus>("idle")
  const [error, setError] = useState("")
  const [steps, setSteps] = useState<StepState[]>([])
  const [result, setResult] = useState<UnifiedRunResult | null>(null)
  const [devTicketStatus, setDevTicketStatus] = useState<"idle" | "running" | "success" | "error">("idle")

  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const activeStepRef = useRef(0)

  function initSteps(): StepState[] {
    return BASE_STEPS.map((label, i) => ({
      label,
      status: i === 0 ? "active" : "pending",
    }))
  }

  function advanceStep(stepsArr: StepState[], toIndex: number): StepState[] {
    return stepsArr.map((s, i) => {
      if (i < toIndex) return { ...s, status: "done" }
      if (i === toIndex) return { ...s, status: "active" }
      return s
    })
  }

  function completeAllSteps(stepsArr: StepState[], errorAt?: number): StepState[] {
    return stepsArr.map((s, i) => {
      if (errorAt !== undefined && i === errorAt) return { ...s, status: "error" }
      return { ...s, status: "done" }
    })
  }

  function startStepTimer(initial: StepState[]) {
    let current = 0
    activeStepRef.current = 0
    setSteps(initial)

    const timer = setInterval(() => {
      current++
      if (current >= BASE_STEPS.length - 1) {
        clearInterval(timer)
        return
      }
      activeStepRef.current = current
      setSteps((prev) => advanceStep(prev, current))
    }, STEP_INTERVAL_MS)

    stepTimerRef.current = timer
  }

  function stopStepTimer() {
    if (stepTimerRef.current) {
      clearInterval(stepTimerRef.current)
      stepTimerRef.current = null
    }
  }

  useEffect(() => {
    return () => stopStepTimer()
  }, [])

  async function run() {
    if (!url.trim()) return

    setRunStatus("running")
    setError("")
    setResult(null)
    setDevTicketStatus("idle")

    const initial = initSteps()
    startStepTimer(initial)

    try {
      const res = await fetch("/api/workflows/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          userSiteUrl: userSiteUrl.trim() || undefined,
        }),
      })

      stopStepTimer()
      const data = (await res.json()) as UnifiedRunResult & { error?: string }

      if (!res.ok) {
        setSteps((prev) => completeAllSteps(prev, activeStepRef.current))
        setRunStatus("error")
        setError(data.error ?? "Workflow failed")
        return
      }

      setSteps((prev) => completeAllSteps(prev))
      setResult(data)
      setRunStatus("success")
    } catch {
      stopStepTimer()
      setSteps((prev) => completeAllSteps(prev, activeStepRef.current))
      setRunStatus("error")
      setError("Network error — could not reach the workflow")
    }
  }

  async function createDevTicket() {
    if (!result?.devTicketData) return
    setDevTicketStatus("running")
    try {
      const res = await fetch("/api/workflows/dev-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.devTicketData),
      })
      if (!res.ok) {
        setDevTicketStatus("error")
        return
      }
      setDevTicketStatus("success")
    } catch {
      setDevTicketStatus("error")
    }
  }

  const canRun = url.trim().length > 0 && runStatus !== "running"

  return (
    <Card
      data-testid="workflow-panel"
      className="border-[rgba(55,50,47,0.12)] shadow-none rounded-lg"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <Zap className="size-3.5 text-[#37322F]" />
              <span className="text-sm font-semibold text-[#37322F]">Analyze & Run</span>
            </div>
            <p className="text-xs text-[#605A57]">
              Paste any URL. FounderOS detects the type and runs the right workflow automatically.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-3">
          {/* Main URL input */}
          <Input
            type="url"
            data-testid="main-url-input"
            placeholder="Paste any URL — competitor, prospect, grant, or pricing page"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={runStatus === "running"}
            className="h-9 text-sm border-[rgba(55,50,47,0.15)] bg-white placeholder:text-[#828387]"
            onKeyDown={(e) => {
              if (e.key === "Enter" && canRun) run()
            }}
          />

          {/* Optional user site URL */}
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              data-testid="toggle-user-site"
              onClick={() => setShowUserSite((v) => !v)}
              className="flex items-center gap-1 text-[11px] text-[#828387] hover:text-[#605A57] transition-colors w-fit"
            >
              {showUserSite ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              Your site URL{showUserSite ? "" : " (optional — used for comparison)"}
            </button>
            {showUserSite && (
              <Input
                type="url"
                data-testid="user-site-url-input"
                placeholder="https://yoursite.com"
                value={userSiteUrl}
                onChange={(e) => setUserSiteUrl(e.target.value)}
                disabled={runStatus === "running"}
                className="h-8 text-sm border-[rgba(55,50,47,0.15)] bg-white placeholder:text-[#828387]"
              />
            )}
          </div>

          {/* Run button */}
          <div className="flex items-center gap-2">
            <button
              onClick={run}
              disabled={!canRun}
              data-testid="run-button"
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[rgba(55,50,47,0.15)] bg-[#37322F] px-5 text-xs font-medium text-white transition-colors hover:bg-[#49423D] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {runStatus === "running" ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Zap className="size-3" />
              )}
              {runStatus === "running" ? "Running…" : "Analyze & Run"}
            </button>
          </div>

          {/* Error message */}
          {runStatus === "error" && error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </div>
          )}

          {/* Live status steps */}
          {steps.length > 0 && (
            <LiveSteps steps={steps} detectedType={result?.detectedType} />
          )}

          {/* Result card */}
          {result && runStatus === "success" && (
            <ResultCard
              result={result}
              onCreateDevTicket={createDevTicket}
              devTicketStatus={devTicketStatus}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
