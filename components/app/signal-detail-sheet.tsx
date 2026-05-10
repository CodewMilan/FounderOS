"use client"

import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, RefreshCw, Clipboard, ClipboardCheck, FileText } from "lucide-react"
import type { CompetitorChange, ProspectRecord, ProspectBrief, FundingOpportunity } from "@/lib/schemas"

// ─── Competitor change detail ─────────────────────────────────────────────────

interface CompetitorDetailSheetProps {
  change: CompetitorChange | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CompetitorDetailSheet({
  change,
  open,
  onOpenChange,
}: CompetitorDetailSheetProps) {
  if (!change) return null

  const severityColor =
    change.significanceScore >= 80
      ? "text-red-600 bg-red-50 border-red-200"
      : change.significanceScore >= 60
      ? "text-amber-600 bg-amber-50 border-amber-200"
      : "text-emerald-600 bg-emerald-50 border-emerald-200"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full sm:max-w-md border-l border-[rgba(55,50,47,0.12)]"
        side="right"
      >
        <SheetHeader className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className="border-[rgba(55,50,47,0.15)] text-[#605A57] text-[10px]"
            >
              {change.pageType}
            </Badge>
            <Badge
              className={`text-[10px] border ${severityColor}`}
              variant="outline"
            >
              Score {change.significanceScore}
            </Badge>
          </div>
          <SheetTitle className="text-[#37322F] font-semibold leading-snug">
            {change.competitorName}
          </SheetTitle>
          <SheetDescription className="text-[#605A57] text-sm leading-relaxed">
            {change.summary}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Before / After comparison — shown when a previous snapshot exists */}
          {change.previousSnapshot ? (
            <>
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#828387]">
                  Before
                </p>
                <div className="rounded-md border border-[rgba(55,50,47,0.12)] bg-[rgba(55,50,47,0.02)] px-3 py-2.5 max-h-36 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-xs text-[#605A57] font-sans leading-relaxed">
                    {change.previousSnapshot}
                  </pre>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#828387]">
                  After
                </p>
                <div className="rounded-md border border-[rgba(55,50,47,0.12)] bg-[rgba(55,50,47,0.02)] px-3 py-2.5 max-h-36 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-xs text-[#49423D] font-sans leading-relaxed">
                    {change.currentSnapshot}
                  </pre>
                </div>
              </div>
            </>
          ) : (
            <DetailSection label="What changed">
              <p className="text-sm text-[#49423D] leading-relaxed">
                {change.currentSnapshot}
              </p>
            </DetailSection>
          )}

          <Separator className="bg-[rgba(55,50,47,0.08)]" />

          <DetailSection label="Suggested action">
            <p className="text-sm text-[#49423D] leading-relaxed">
              {change.suggestedAction}
            </p>
          </DetailSection>

          <Separator className="bg-[rgba(55,50,47,0.08)]" />

          <DetailSection label="Source">
            <a
              href={change.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#37322F] underline underline-offset-2 hover:text-[#605A57] break-all"
            >
              {change.sourceUrl}
            </a>
            <p className="text-xs text-[#828387] mt-1">
              Detected:{" "}
              {new Date(change.detectedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </DetailSection>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Prospect detail ──────────────────────────────────────────────────────────

interface ProspectDetailSheetProps {
  prospect: ProspectRecord | null
  brief?: ProspectBrief | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onGenerateBrief?: (prospectId: string) => Promise<void>
  onRefresh?: (prospect: ProspectRecord) => Promise<void>
}

export function ProspectDetailSheet({
  prospect,
  brief,
  open,
  onOpenChange,
  onGenerateBrief,
  onRefresh,
}: ProspectDetailSheetProps) {
  const [briefLoading, setBriefLoading] = useState(false)
  const [refreshLoading, setRefreshLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!prospect) return null

  async function handleGenerateBrief() {
    if (!onGenerateBrief) return
    setBriefLoading(true)
    await onGenerateBrief(prospect!.id)
    setBriefLoading(false)
  }

  async function handleRefresh() {
    if (!onRefresh) return
    setRefreshLoading(true)
    await onRefresh(prospect!)
    setRefreshLoading(false)
  }

  function handleCopy() {
    if (!brief) return
    const text = [
      brief.headline,
      "",
      brief.openingLine,
      "",
      "Key points:",
      ...brief.keyPoints.map((p) => `• ${p}`),
      "",
      "Next step:",
      brief.callToAction,
    ].join("\n")
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full sm:max-w-md border-l border-[rgba(55,50,47,0.12)] overflow-y-auto"
        side="right"
      >
        <SheetHeader className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className="border-[rgba(55,50,47,0.15)] text-[#605A57] text-[10px]"
            >
              {prospect.category}
            </Badge>
            <Badge
              variant="outline"
              className="border-[rgba(55,50,47,0.15)] text-[#605A57] text-[10px]"
            >
              Fit {prospect.fitScore}%
            </Badge>
          </div>
          <SheetTitle className="text-[#37322F] font-semibold">
            {prospect.companyName}
          </SheetTitle>
          <SheetDescription className="text-[#605A57] text-sm leading-relaxed">
            {prospect.valueProp}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4">
          <div className="h-1.5 w-full rounded-full bg-[rgba(55,50,47,0.08)]">
            <div
              className="h-1.5 rounded-full bg-[#37322F]"
              style={{ width: `${prospect.fitScore}%` }}
            />
          </div>
          <p className="text-xs text-[#828387] mt-1">Fit score: {prospect.fitScore} / 100</p>
        </div>

        {/* Action row */}
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          {onGenerateBrief && (
            <button
              onClick={handleGenerateBrief}
              disabled={briefLoading}
              data-testid="generate-brief-button"
              className="inline-flex h-7 items-center gap-1.5 rounded-full border border-[rgba(55,50,47,0.15)] bg-white px-3 text-[11px] font-medium text-[#37322F] transition-colors hover:bg-[rgba(55,50,47,0.04)] disabled:opacity-60"
            >
              {briefLoading ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <FileText className="size-3" />
              )}
              {briefLoading ? "Generating…" : brief ? "Regenerate brief" : "Generate brief"}
            </button>
          )}
          {onRefresh && (
            <button
              onClick={handleRefresh}
              disabled={refreshLoading}
              data-testid="refresh-button"
              className="inline-flex h-7 items-center gap-1.5 rounded-full border border-[rgba(55,50,47,0.15)] bg-white px-3 text-[11px] font-medium text-[#37322F] transition-colors hover:bg-[rgba(55,50,47,0.04)] disabled:opacity-60"
            >
              {refreshLoading ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <RefreshCw className="size-3" />
              )}
              {refreshLoading ? "Refreshing…" : "Refresh analysis"}
            </button>
          )}
          {brief && (
            <button
              onClick={handleCopy}
              data-testid="copy-button"
              className="inline-flex h-7 items-center gap-1.5 rounded-full border border-[rgba(55,50,47,0.15)] bg-white px-3 text-[11px] font-medium text-[#37322F] transition-colors hover:bg-[rgba(55,50,47,0.04)]"
            >
              {copied ? (
                <ClipboardCheck className="size-3 text-emerald-600" />
              ) : (
                <Clipboard className="size-3" />
              )}
              {copied ? "Copied!" : "Copy summary"}
            </button>
          )}
        </div>

        <div className="mt-6 space-y-5">
          {/* Prospect Brief — shown when generated */}
          {brief && (
            <>
              <div
                data-testid="prospect-brief"
                className="rounded-lg border border-[rgba(55,50,47,0.12)] bg-[rgba(55,50,47,0.015)] p-4 space-y-3"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#828387]">
                  Outreach brief
                </p>
                <p className="text-sm font-medium text-[#37322F] leading-snug">{brief.headline}</p>
                <p className="text-sm text-[#49423D] leading-relaxed">{brief.openingLine}</p>

                <div className="space-y-1.5 pt-1">
                  {brief.keyPoints.map((point, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-[#605A57]">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-[rgba(55,50,47,0.4)]" />
                      {point}
                    </div>
                  ))}
                </div>

                <div className="pt-1 border-t border-[rgba(55,50,47,0.08)]">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#828387] mb-1">
                    Next step
                  </p>
                  <p className="text-xs text-[#49423D] leading-relaxed">{brief.callToAction}</p>
                </div>
              </div>

              <Separator className="bg-[rgba(55,50,47,0.08)]" />
            </>
          )}

          <DetailSection label="Recommended angle">
            <p className="text-sm text-[#49423D] leading-relaxed">
              {prospect.recommendedAngle}
            </p>
          </DetailSection>

          <Separator className="bg-[rgba(55,50,47,0.08)]" />

          <DetailSection label="Maturity signals">
            <ul className="space-y-1.5">
              {prospect.maturitySignals.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#49423D]">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#37322F]" />
                  {s}
                </li>
              ))}
            </ul>
          </DetailSection>

          <Separator className="bg-[rgba(55,50,47,0.08)]" />

          <DetailSection label="Hiring signals">
            <ul className="space-y-1.5">
              {prospect.hiringSignals.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#49423D]">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[rgba(55,50,47,0.4)]" />
                  {s}
                </li>
              ))}
            </ul>
          </DetailSection>

          <Separator className="bg-[rgba(55,50,47,0.08)]" />

          <DetailSection label="Website">
            <a
              href={prospect.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#37322F] underline underline-offset-2 hover:text-[#605A57]"
            >
              {prospect.website}
            </a>
          </DetailSection>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Funding detail ───────────────────────────────────────────────────────────

interface FundingDetailSheetProps {
  opportunity: FundingOpportunity | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FundingDetailSheet({
  opportunity,
  open,
  onOpenChange,
}: FundingDetailSheetProps) {
  if (!opportunity) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full sm:max-w-md border-l border-[rgba(55,50,47,0.12)]"
        side="right"
      >
        <SheetHeader className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className="border-[rgba(55,50,47,0.15)] text-[#605A57] text-[10px]"
            >
              {opportunity.opportunityType}
            </Badge>
            <Badge
              variant="outline"
              className="border-[rgba(55,50,47,0.15)] text-[#605A57] text-[10px]"
            >
              {opportunity.equityType}
            </Badge>
          </div>
          <SheetTitle className="text-[#37322F] font-semibold">
            {opportunity.programName}
          </SheetTitle>
          <SheetDescription className="text-[#605A57] text-sm">
            by {opportunity.provider}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4">
          <div className="h-1.5 w-full rounded-full bg-[rgba(55,50,47,0.08)]">
            <div
              className="h-1.5 rounded-full bg-[#37322F]"
              style={{ width: `${opportunity.fitScore}%` }}
            />
          </div>
          <p className="text-xs text-[#828387] mt-1">Match score: {opportunity.fitScore} / 100</p>
        </div>

        <div className="mt-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <MetaItem label="Funding" value={opportunity.fundingAmount ?? "—"} />
            <MetaItem label="Deadline" value={opportunity.deadline ?? "Rolling"} />
            <MetaItem label="Geography" value={opportunity.geography.join(", ")} />
            <MetaItem label="Sectors" value={opportunity.sectorFocus.slice(0, 2).join(", ")} />
          </div>

          <Separator className="bg-[rgba(55,50,47,0.08)]" />

          <DetailSection label="Why this matches you">
            <p className="text-sm text-[#49423D] leading-relaxed">
              {opportunity.fitReason}
            </p>
          </DetailSection>

          <Separator className="bg-[rgba(55,50,47,0.08)]" />

          <DetailSection label="Eligibility">
            <p className="text-sm text-[#49423D] leading-relaxed">
              {opportunity.eligibilityNotes}
            </p>
          </DetailSection>

          {opportunity.applyUrl && (
            <>
              <Separator className="bg-[rgba(55,50,47,0.08)]" />
              <a
                href={opportunity.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center justify-center rounded-full bg-[#37322F] px-6 text-sm font-medium text-white hover:bg-[#49423D] transition-colors"
              >
                Apply now →
              </a>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function DetailSection({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#828387]">
        {label}
      </p>
      {children}
    </div>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#828387]">
        {label}
      </p>
      <p className="text-sm text-[#49423D]">{value}</p>
    </div>
  )
}
