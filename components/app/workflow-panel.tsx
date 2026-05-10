"use client"

import { useState } from "react"
import { Loader2, Zap, Send, Ticket, DollarSign, Users, Landmark, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type {
  FeatureGapResult,
  DevTicketResult,
  PricingResponseResult,
  ProspectEnrichmentResult,
  FundingAlertResult,
  UpdatePricingResult,
} from "@/lib/schemas/workflows"

// ─── Status helpers ───────────────────────────────────────────────────────────

type RunStatus = "idle" | "running" | "success" | "error"

function StatusBadge({ status }: { status: RunStatus }) {
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

function DeliveryBadges({
  telegramSent,
  slackSent,
}: {
  telegramSent?: boolean
  slackSent?: boolean
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {telegramSent !== undefined && (
        <Badge
          variant="outline"
          className={
            telegramSent
              ? "text-[10px] border-emerald-200 text-emerald-600 bg-emerald-50"
              : "text-[10px] border-amber-200 text-amber-600 bg-amber-50"
          }
        >
          {telegramSent ? "Sent to Telegram ✓" : "Telegram not sent"}
        </Badge>
      )}
      {slackSent !== undefined && (
        <Badge
          variant="outline"
          className={
            slackSent
              ? "text-[10px] border-emerald-200 text-emerald-600 bg-emerald-50"
              : "text-[10px] border-amber-200 text-amber-600 bg-amber-50"
          }
        >
          {slackSent ? "Posted to Slack ✓" : "Slack not sent"}
        </Badge>
      )}
    </div>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
      {message}
    </div>
  )
}

function BriefPreview({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-testid="brief-preview"
      className="flex flex-col gap-2 rounded-lg border border-[rgba(55,50,47,0.12)] bg-[rgba(55,50,47,0.015)] px-4 py-3"
    >
      {children}
    </div>
  )
}

function RunButton({
  status,
  disabled,
  onClick,
  label = "Run workflow",
  testId,
}: {
  status: RunStatus
  disabled?: boolean
  onClick: () => void
  label?: string
  testId?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={status === "running" || disabled}
      data-testid={testId ?? "run-workflow-button"}
      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[rgba(55,50,47,0.15)] bg-[#37322F] px-4 text-xs font-medium text-white transition-colors hover:bg-[#49423D] disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {status === "running" ? (
        <Loader2 className="size-3 animate-spin" />
      ) : (
        <Zap className="size-3" />
      )}
      {status === "running" ? "Running…" : label}
    </button>
  )
}

function FieldLabel({ label, optional }: { label: string; optional?: boolean }) {
  return (
    <label className="text-xs font-medium text-[#37322F]">
      {label}{" "}
      {optional && <span className="font-normal text-[#828387]">(optional)</span>}
    </label>
  )
}

function UrlInput({
  value,
  onChange,
  placeholder,
  disabled,
  testId,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  disabled?: boolean
  testId?: string
}) {
  return (
    <Input
      type="url"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      data-testid={testId}
      className="h-8 text-sm border-[rgba(55,50,47,0.15)] bg-white placeholder:text-[#828387]"
    />
  )
}

// ─── Tab 1: Feature Gap ───────────────────────────────────────────────────────

function FeatureGapTab() {
  const [competitorUrl, setCompetitorUrl] = useState("")
  const [userSiteUrl, setUserSiteUrl] = useState("")
  const [status, setStatus] = useState<RunStatus>("idle")
  const [error, setError] = useState("")
  const [result, setResult] = useState<FeatureGapResult | null>(null)

  async function run() {
    if (!competitorUrl.trim()) return
    setStatus("running")
    setError("")
    try {
      const res = await fetch("/api/workflows/feature-gap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitorUrl: competitorUrl.trim(),
          userSiteUrl: userSiteUrl.trim() || undefined,
        }),
      })
      const data = await res.json() as FeatureGapResult & { error?: string }
      if (!res.ok) { setStatus("error"); setError(data.error ?? "Workflow failed"); return }
      setResult(data)
      setStatus("success")
    } catch {
      setStatus("error")
      setError("Network error — could not reach the workflow")
    }
  }

  const b = result?.brief

  return (
    <div className="flex flex-col gap-3" data-testid="feature-gap-tab">
      <div className="flex flex-col gap-1">
        <FieldLabel label="Competitor URL" />
        <UrlInput
          value={competitorUrl}
          onChange={setCompetitorUrl}
          placeholder="https://competitor.com"
          disabled={status === "running"}
          testId="feature-gap-competitor-url"
        />
      </div>
      <div className="flex flex-col gap-1">
        <FieldLabel label="Your site URL" optional />
        <UrlInput
          value={userSiteUrl}
          onChange={setUserSiteUrl}
          placeholder="https://yoursite.com"
          disabled={status === "running"}
          testId="feature-gap-user-url"
        />
      </div>
      {status === "error" && <ErrorBox message={error} />}
      <div className="flex items-center gap-2">
        <RunButton
          status={status}
          disabled={!competitorUrl.trim()}
          onClick={run}
          testId="feature-gap-run-btn"
        />
        <StatusBadge status={status} />
      </div>
      {b && (
        <BriefPreview>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs font-semibold text-[#37322F]">Feature gap brief</p>
            <DeliveryBadges telegramSent={result?.telegramSent} slackSent={result?.slackSent} />
          </div>
          <div className="grid gap-1.5 text-xs">
            <Row label="Competitor" value={b.competitorName} />
            <Row label="Feature" value={b.featureName} />
            <Row label="What it does" value={b.whatItDoes} />
            <Row label="Your gap" value={b.gap} />
            <Row label="Why it matters" value={b.whyItMatters} />
            <Row label="Suggested action" value={b.suggestedAction} />
            <Row label="Confidence" value={b.confidence} />
          </div>
        </BriefPreview>
      )}
    </div>
  )
}

// ─── Tab 2: Dev Ticket ────────────────────────────────────────────────────────

function DevTicketTab() {
  const [featureName, setFeatureName] = useState("")
  const [competitorName, setCompetitorName] = useState("")
  const [description, setDescription] = useState("")
  const [whyNow, setWhyNow] = useState("")
  const [suggestedImpl, setSuggestedImpl] = useState("")
  const [confidence, setConfidence] = useState<"high" | "medium" | "low">("medium")
  const [sourceUrl, setSourceUrl] = useState("")
  const [status, setStatus] = useState<RunStatus>("idle")
  const [error, setError] = useState("")
  const [result, setResult] = useState<DevTicketResult | null>(null)

  async function run() {
    if (!featureName.trim() || !competitorName.trim() || !sourceUrl.trim()) return
    setStatus("running")
    setError("")
    try {
      const res = await fetch("/api/workflows/dev-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          featureName: featureName.trim(),
          competitorName: competitorName.trim(),
          description: description.trim() || "Competitor parity feature",
          whyNow: whyNow.trim() || "Detected on competitor site",
          suggestedImplementation: suggestedImpl.trim() || "Evaluate and add to roadmap",
          confidence,
          sourceUrl: sourceUrl.trim(),
        }),
      })
      const data = await res.json() as DevTicketResult & { error?: string }
      if (!res.ok) { setStatus("error"); setError(data.error ?? "Workflow failed"); return }
      setResult(data)
      setStatus("success")
    } catch {
      setStatus("error")
      setError("Network error — could not reach the workflow")
    }
  }

  const canRun = featureName.trim() && competitorName.trim() && sourceUrl.trim()

  return (
    <div className="flex flex-col gap-3" data-testid="dev-ticket-tab">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <FieldLabel label="Feature name" />
          <Input
            placeholder="AI Assistant"
            value={featureName}
            onChange={(e) => setFeatureName(e.target.value)}
            disabled={status === "running"}
            data-testid="dev-ticket-feature-name"
            className="h-8 text-sm border-[rgba(55,50,47,0.15)] bg-white placeholder:text-[#828387]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <FieldLabel label="Competitor name" />
          <Input
            placeholder="Acme Corp"
            value={competitorName}
            onChange={(e) => setCompetitorName(e.target.value)}
            disabled={status === "running"}
            data-testid="dev-ticket-competitor-name"
            className="h-8 text-sm border-[rgba(55,50,47,0.15)] bg-white placeholder:text-[#828387]"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <FieldLabel label="Description" optional />
        <Input
          placeholder="Describe the feature gap"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={status === "running"}
          className="h-8 text-sm border-[rgba(55,50,47,0.15)] bg-white placeholder:text-[#828387]"
        />
      </div>
      <div className="flex flex-col gap-1">
        <FieldLabel label="Why now" optional />
        <Input
          placeholder="Business impact of not acting"
          value={whyNow}
          onChange={(e) => setWhyNow(e.target.value)}
          disabled={status === "running"}
          className="h-8 text-sm border-[rgba(55,50,47,0.15)] bg-white placeholder:text-[#828387]"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <FieldLabel label="Source URL" />
          <UrlInput
            value={sourceUrl}
            onChange={setSourceUrl}
            placeholder="https://competitor.com"
            disabled={status === "running"}
            testId="dev-ticket-source-url"
          />
        </div>
        <div className="flex flex-col gap-1">
          <FieldLabel label="Confidence" />
          <select
            value={confidence}
            onChange={(e) => setConfidence(e.target.value as "high" | "medium" | "low")}
            disabled={status === "running"}
            data-testid="dev-ticket-confidence"
            className="h-8 w-full rounded-md border border-[rgba(55,50,47,0.15)] bg-white px-3 text-sm text-[#37322F] focus:outline-none focus:ring-1 focus:ring-[rgba(55,50,47,0.3)] disabled:opacity-60"
          >
            <option value="high">High → P1</option>
            <option value="medium">Medium → P2</option>
            <option value="low">Low → P3</option>
          </select>
        </div>
      </div>
      {status === "error" && <ErrorBox message={error} />}
      <div className="flex items-center gap-2">
        <RunButton
          status={status}
          disabled={!canRun}
          onClick={run}
          label="Post dev ticket"
          testId="dev-ticket-run-btn"
        />
        <StatusBadge status={status} />
      </div>
      {result && (
        <BriefPreview>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs font-semibold text-[#37322F]">Dev ticket posted</p>
            <DeliveryBadges slackSent={result.slackSent} />
          </div>
        </BriefPreview>
      )}
    </div>
  )
}

// ─── Tab 3: Pricing Response ──────────────────────────────────────────────────

function PricingResponseTab() {
  const [competitorUrl, setCompetitorUrl] = useState("")
  const [userPricingUrl, setUserPricingUrl] = useState("")
  const [status, setStatus] = useState<RunStatus>("idle")
  const [error, setError] = useState("")
  const [result, setResult] = useState<PricingResponseResult | null>(null)

  async function run() {
    if (!competitorUrl.trim()) return
    setStatus("running")
    setError("")
    try {
      const res = await fetch("/api/workflows/pricing-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitorUrl: competitorUrl.trim(),
          userPricingUrl: userPricingUrl.trim() || undefined,
        }),
      })
      const data = await res.json() as PricingResponseResult & { error?: string }
      if (!res.ok) { setStatus("error"); setError(data.error ?? "Workflow failed"); return }
      setResult(data)
      setStatus("success")
    } catch {
      setStatus("error")
      setError("Network error — could not reach the workflow")
    }
  }

  const b = result?.brief

  return (
    <div className="flex flex-col gap-3" data-testid="pricing-response-tab">
      <div className="flex flex-col gap-1">
        <FieldLabel label="Competitor pricing URL" />
        <UrlInput
          value={competitorUrl}
          onChange={setCompetitorUrl}
          placeholder="https://competitor.com/pricing"
          disabled={status === "running"}
          testId="pricing-response-competitor-url"
        />
      </div>
      <div className="flex flex-col gap-1">
        <FieldLabel label="Your pricing URL" optional />
        <UrlInput
          value={userPricingUrl}
          onChange={setUserPricingUrl}
          placeholder="https://yoursite.com/pricing"
          disabled={status === "running"}
          testId="pricing-response-user-url"
        />
      </div>
      {status === "error" && <ErrorBox message={error} />}
      <div className="flex items-center gap-2">
        <RunButton
          status={status}
          disabled={!competitorUrl.trim()}
          onClick={run}
          testId="pricing-response-run-btn"
        />
        <StatusBadge status={status} />
      </div>
      {b && (
        <BriefPreview>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs font-semibold text-[#37322F]">Pricing response brief</p>
            <DeliveryBadges telegramSent={result?.telegramSent} slackSent={result?.slackSent} />
          </div>
          <div className="grid gap-1.5 text-xs">
            <Row label="Competitor" value={b.competitorName} />
            <Row label="Change detected" value={b.changeDetected} />
            <Row label="Their pricing" value={b.theirPricing} />
            <Row label="Your positioning" value={b.yourPositioning} />
            <Row label="Suggested response" value={b.suggestedResponse} />
            <Row label="Urgency" value={b.urgency} />
          </div>
        </BriefPreview>
      )}
    </div>
  )
}

// ─── Tab 4: Prospect Brief ────────────────────────────────────────────────────

function ProspectBriefTab() {
  const [prospectUrl, setProspectUrl] = useState("")
  const [status, setStatus] = useState<RunStatus>("idle")
  const [error, setError] = useState("")
  const [result, setResult] = useState<ProspectEnrichmentResult | null>(null)

  async function run() {
    if (!prospectUrl.trim()) return
    setStatus("running")
    setError("")
    try {
      const res = await fetch("/api/workflows/prospect-enrichment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectUrl: prospectUrl.trim() }),
      })
      const data = await res.json() as ProspectEnrichmentResult & { error?: string }
      if (!res.ok) { setStatus("error"); setError(data.error ?? "Workflow failed"); return }
      setResult(data)
      setStatus("success")
    } catch {
      setStatus("error")
      setError("Network error — could not reach the workflow")
    }
  }

  const b = result?.brief

  return (
    <div className="flex flex-col gap-3" data-testid="prospect-brief-tab">
      <div className="flex flex-col gap-1">
        <FieldLabel label="Prospect company URL" />
        <UrlInput
          value={prospectUrl}
          onChange={setProspectUrl}
          placeholder="https://prospectcompany.com"
          disabled={status === "running"}
          testId="prospect-brief-url"
        />
      </div>
      {status === "error" && <ErrorBox message={error} />}
      <div className="flex items-center gap-2">
        <RunButton
          status={status}
          disabled={!prospectUrl.trim()}
          onClick={run}
          testId="prospect-brief-run-btn"
        />
        <StatusBadge status={status} />
      </div>
      {b && (
        <BriefPreview>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs font-semibold text-[#37322F]">Prospect brief</p>
            <DeliveryBadges telegramSent={result?.telegramSent} slackSent={result?.slackSent} />
          </div>
          <div className="grid gap-1.5 text-xs">
            <Row label="Company" value={b.companyName} />
            <Row label="Description" value={b.description} />
            <Row label="ICP fit" value={b.icpFit} />
            <div className="flex flex-col gap-0.5">
              <span className="text-[#605A57] font-medium">Key signals</span>
              <ul className="list-disc list-inside text-[#37322F] space-y-0.5">
                {b.keySignals.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
            <Row label="Outreach angle" value={b.outreachAngle} />
            <Row label="Confidence" value={b.confidence} />
          </div>
        </BriefPreview>
      )}
    </div>
  )
}

// ─── Tab 5: Funding Alert ─────────────────────────────────────────────────────

function FundingAlertTab() {
  const [fundingUrl, setFundingUrl] = useState("")
  const [status, setStatus] = useState<RunStatus>("idle")
  const [error, setError] = useState("")
  const [result, setResult] = useState<FundingAlertResult | null>(null)

  async function run() {
    if (!fundingUrl.trim()) return
    setStatus("running")
    setError("")
    try {
      const res = await fetch("/api/workflows/funding-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fundingUrl: fundingUrl.trim() }),
      })
      const data = await res.json() as FundingAlertResult & { error?: string }
      if (!res.ok) { setStatus("error"); setError(data.error ?? "Workflow failed"); return }
      setResult(data)
      setStatus("success")
    } catch {
      setStatus("error")
      setError("Network error — could not reach the workflow")
    }
  }

  const b = result?.brief

  return (
    <div className="flex flex-col gap-3" data-testid="funding-alert-tab">
      <div className="flex flex-col gap-1">
        <FieldLabel label="Funding opportunity URL" />
        <UrlInput
          value={fundingUrl}
          onChange={setFundingUrl}
          placeholder="https://grants.example.com/startup-fund"
          disabled={status === "running"}
          testId="funding-alert-url"
        />
      </div>
      {status === "error" && <ErrorBox message={error} />}
      <div className="flex items-center gap-2">
        <RunButton
          status={status}
          disabled={!fundingUrl.trim()}
          onClick={run}
          testId="funding-alert-run-btn"
        />
        <StatusBadge status={status} />
      </div>
      {b && (
        <BriefPreview>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs font-semibold text-[#37322F]">Funding opportunity</p>
            <div className="flex items-center gap-1.5">
              {b.isUrgent && (
                <Badge variant="outline" className="text-[10px] border-red-200 text-red-600 bg-red-50 flex items-center gap-1">
                  <AlertTriangle className="size-2.5" />
                  Urgent
                </Badge>
              )}
              <DeliveryBadges telegramSent={result?.telegramSent} />
            </div>
          </div>
          <div className="grid gap-1.5 text-xs">
            <Row label="Program" value={b.programName} />
            <Row label="Provider" value={b.provider} />
            <Row label="Deadline" value={`${b.deadline}${b.isUrgent ? " ⚠️" : ""}`} />
            <Row label="Eligibility" value={b.eligibility} />
            <Row label="Fit" value={b.fitReason} />
          </div>
        </BriefPreview>
      )}
    </div>
  )
}

// ─── Tab 6: Pricing Update ────────────────────────────────────────────────────

function PricingUpdateTab() {
  const [newPrice, setNewPrice] = useState("")
  const [reason, setReason] = useState("")
  const [status, setStatus] = useState<RunStatus>("idle")
  const [error, setError] = useState("")
  const [preview, setPreview] = useState<UpdatePricingResult | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  async function fetchPreview() {
    const cents = Math.round(parseFloat(newPrice) * 100)
    if (!cents || isNaN(cents) || cents <= 0) return
    setStatus("running")
    setError("")
    setPreview(null)
    setConfirmed(false)
    try {
      const res = await fetch("/api/workflows/update-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPriceCents: cents, reason: reason.trim() || "Manual update", approved: false }),
      })
      const data = await res.json() as UpdatePricingResult & { error?: string }
      if (!res.ok) { setStatus("error"); setError(data.error ?? "Preview failed"); return }
      setPreview(data)
      setStatus("success")
    } catch {
      setStatus("error")
      setError("Network error — could not reach the workflow")
    }
  }

  async function confirmUpdate() {
    if (!preview) return
    setStatus("running")
    setError("")
    try {
      const res = await fetch("/api/workflows/update-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPriceCents: preview.newPriceCents,
          reason: reason.trim() || "Manual update",
          approved: true,
        }),
      })
      const data = await res.json() as UpdatePricingResult & { error?: string }
      if (!res.ok) { setStatus("error"); setError(data.error ?? "Update failed"); return }
      setPreview(data)
      setConfirmed(true)
      setStatus("success")
    } catch {
      setStatus("error")
      setError("Network error — could not reach the workflow")
    }
  }

  const canPreview = newPrice.trim() && parseFloat(newPrice) > 0

  return (
    <div className="flex flex-col gap-3" data-testid="pricing-update-tab">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
        This workflow requires explicit approval before executing. Preview first, then confirm.
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <FieldLabel label="New price (USD)" />
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="49.00"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            disabled={status === "running"}
            data-testid="pricing-update-price"
            className="h-8 text-sm border-[rgba(55,50,47,0.15)] bg-white placeholder:text-[#828387]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <FieldLabel label="Reason" optional />
          <Input
            placeholder="Competitor reduced price"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={status === "running"}
            data-testid="pricing-update-reason"
            className="h-8 text-sm border-[rgba(55,50,47,0.15)] bg-white placeholder:text-[#828387]"
          />
        </div>
      </div>
      {status === "error" && <ErrorBox message={error} />}
      <div className="flex items-center gap-2">
        <RunButton
          status={status}
          disabled={!canPreview || confirmed}
          onClick={fetchPreview}
          label="Preview change"
          testId="pricing-update-preview-btn"
        />
        {preview && !confirmed && (
          <button
            onClick={confirmUpdate}
            disabled={status === "running"}
            data-testid="pricing-update-confirm-btn"
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-red-200 bg-red-600 px-4 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Send className="size-3" />
            Confirm & Execute
          </button>
        )}
        <StatusBadge status={status} />
      </div>
      {preview && (
        <BriefPreview>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs font-semibold text-[#37322F]">
              {confirmed && preview.applied ? "Price updated ✓" : "Preview — not yet applied"}
            </p>
            {confirmed && preview.applied && (
              <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-600 bg-emerald-50">
                Applied to Lemon Squeezy ✓
              </Badge>
            )}
            {preview.previewOnly && !confirmed && (
              <Badge variant="outline" className="text-[10px] border-amber-200 text-amber-600 bg-amber-50">
                Preview only
              </Badge>
            )}
          </div>
          <div className="grid gap-1.5 text-xs">
            <Row label="Variant ID" value={preview.variantId} />
            <Row label="Current price" value={`$${(preview.oldPriceCents / 100).toFixed(2)}`} />
            <Row label="New price" value={`$${(preview.newPriceCents / 100).toFixed(2)}`} />
            <Row label="Reason" value={preview.reason} />
          </div>
        </BriefPreview>
      )}
    </div>
  )
}

// ─── Row helper ───────────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[#605A57] font-medium">{label}</span>
      <span className="text-[#37322F]">{value}</span>
    </div>
  )
}

// ─── WorkflowPanel ────────────────────────────────────────────────────────────

const TABS = [
  { id: "feature-gap", label: "Feature Gap", icon: Zap },
  { id: "dev-ticket", label: "Dev Ticket", icon: Ticket },
  { id: "pricing-response", label: "Pricing Response", icon: DollarSign },
  { id: "prospect-brief", label: "Prospect Brief", icon: Users },
  { id: "funding-alert", label: "Funding Alert", icon: Landmark },
  { id: "pricing-update", label: "Pricing Update", icon: AlertTriangle },
]

export function WorkflowPanel() {
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
              <span className="text-sm font-semibold text-[#37322F]">Workflow Actions</span>
            </div>
            <p className="text-xs text-[#605A57]">
              Scrape, analyze, and deliver automated briefs to Telegram and Slack.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="feature-gap">
          <TabsList className="h-auto flex flex-wrap gap-1 bg-transparent p-0 mb-4">
            {TABS.map(({ id, label, icon: Icon }) => (
              <TabsTrigger
                key={id}
                value={id}
                className="h-7 rounded-full border border-[rgba(55,50,47,0.15)] px-3 text-[10px] font-medium text-[#605A57] data-[state=active]:bg-[#37322F] data-[state=active]:text-white data-[state=active]:border-[#37322F] bg-white transition-colors flex items-center gap-1.5"
              >
                <Icon className="size-2.5" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="feature-gap" forceMount><FeatureGapTab /></TabsContent>
          <TabsContent value="dev-ticket" forceMount><DevTicketTab /></TabsContent>
          <TabsContent value="pricing-response" forceMount><PricingResponseTab /></TabsContent>
          <TabsContent value="prospect-brief" forceMount><ProspectBriefTab /></TabsContent>
          <TabsContent value="funding-alert" forceMount><FundingAlertTab /></TabsContent>
          <TabsContent value="pricing-update" forceMount><PricingUpdateTab /></TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
