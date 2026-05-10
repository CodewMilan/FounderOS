"use client"

import { useState, useEffect, useCallback } from "react"
import { Globe, Plus, RefreshCw, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Source } from "@/lib/schemas"

// ─── Types ────────────────────────────────────────────────────────────────────

type IngestStatus = "idle" | "loading" | "done" | "error"

interface IngestState {
  status: IngestStatus
  message?: string
  chars?: number
}

interface FormState {
  label: string
  url: string
  type: "url" | "domain" | "rss"
  module: "competitors" | "prospects" | "funding"
  tags: string
}

const DEFAULT_FORM: FormState = {
  label: "",
  url: "",
  type: "url",
  module: "competitors",
  tags: "",
}

// ─── SourceManager ────────────────────────────────────────────────────────────

export function SourceManager() {
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [ingestMap, setIngestMap] = useState<Record<string, IngestState>>({})

  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch("/api/sources")
      const data = await res.json() as { sources: Source[] }
      setSources(data.sources ?? [])
    } catch {
      // silently keep existing list on network error
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchSources()
  }, [fetchSources])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    if (!form.label.trim()) {
      setFormError("Label is required.")
      return
    }
    if (!form.url.trim()) {
      setFormError("URL is required.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: form.label.trim(),
          url: form.url.trim(),
          type: form.type,
          module: form.module,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      })

      const data = await res.json() as { source?: Source; error?: unknown }

      if (!res.ok) {
        const msg =
          typeof data.error === "string"
            ? data.error
            : "Please check your input and try again."
        setFormError(msg)
        return
      }

      if (data.source) {
        setSources((prev) => [data.source!, ...prev])
        setForm(DEFAULT_FORM)
      }
    } catch {
      setFormError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleIngest(sourceId: string) {
    setIngestMap((prev) => ({
      ...prev,
      [sourceId]: { status: "loading" },
    }))

    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId }),
      })

      const data = await res.json() as {
        extraction?: { markdown?: string; textPreview?: string }
        error?: string
      }

      if (!res.ok) {
        setIngestMap((prev) => ({
          ...prev,
          [sourceId]: { status: "error", message: data.error ?? "Ingest failed" },
        }))
        return
      }

      const chars =
        data.extraction?.markdown?.length ?? data.extraction?.textPreview?.length ?? 0

      setIngestMap((prev) => ({
        ...prev,
        [sourceId]: {
          status: "done",
          message: `Extracted ${chars.toLocaleString()} chars`,
          chars,
        },
      }))
    } catch {
      setIngestMap((prev) => ({
        ...prev,
        [sourceId]: { status: "error", message: "Network error" },
      }))
    }
  }

  const grouped = {
    competitors: sources.filter((s) => s.module === "competitors"),
    prospects: sources.filter((s) => s.module === "prospects"),
    funding: sources.filter((s) => s.module === "funding"),
  }

  return (
    <div data-testid="source-manager" className="flex flex-col gap-6">
      {/* Add source form */}
      <Card className="border-[rgba(55,50,47,0.12)] shadow-none rounded-lg py-5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Plus className="size-4 text-[#605A57]" />
            <CardTitle className="text-sm font-semibold text-[#37322F]">
              Add a source
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-[#605A57]">
            Track a public URL for competitor changes, prospect research, or funding discovery.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-[#605A57]" htmlFor="src-label">
                  Label
                </Label>
                <Input
                  id="src-label"
                  placeholder="e.g. Linear Pricing Page"
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-[#605A57]" htmlFor="src-url">
                  URL
                </Label>
                <Input
                  id="src-url"
                  placeholder="https://example.com/pricing"
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-[#605A57]">Module</Label>
                <Select
                  value={form.module}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      module: v as FormState["module"],
                    }))
                  }
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="competitors">Competitors</SelectItem>
                    <SelectItem value="prospects">Prospects</SelectItem>
                    <SelectItem value="funding">Funding</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-[#605A57]">Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, type: v as FormState["type"] }))
                  }
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="url">URL</SelectItem>
                    <SelectItem value="domain">Domain</SelectItem>
                    <SelectItem value="rss">RSS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-[#605A57]" htmlFor="src-tags">
                  Tags{" "}
                  <span className="text-[#828387] font-normal">(comma-separated)</span>
                </Label>
                <Input
                  id="src-tags"
                  placeholder="pricing, saas"
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {formError && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="size-3" />
                {formError}
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#37322F] px-5 text-xs font-medium text-white transition-colors hover:bg-[#49423D] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Plus className="size-3" />
                )}
                {submitting ? "Adding…" : "Add source"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Source list */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#37322F]">
            Monitored Sources
          </h2>
          {loading && (
            <Loader2 className="size-3.5 text-[#828387] animate-spin" />
          )}
        </div>

        {!loading && sources.length === 0 && (
          <p className="text-sm text-[#828387]">No sources yet. Add one above.</p>
        )}

        {(["competitors", "prospects", "funding"] as const).map((mod) => {
          const group = grouped[mod]
          if (group.length === 0) return null
          const label =
            mod === "competitors"
              ? "Competitor Radar"
              : mod === "prospects"
              ? "Prospects"
              : "Funding Scout"

          return (
            <SourceGroup
              key={mod}
              label={label}
              sources={group}
              ingestMap={ingestMap}
              onIngest={handleIngest}
            />
          )
        })}
      </div>
    </div>
  )
}

// ─── SourceGroup ──────────────────────────────────────────────────────────────

function SourceGroup({
  label,
  sources,
  ingestMap,
  onIngest,
}: {
  label: string
  sources: Source[]
  ingestMap: Record<string, IngestState>
  onIngest: (id: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-[#605A57]">{label}</p>
      {sources.map((source) => (
        <SourceRow
          key={source.id}
          source={source}
          ingestState={ingestMap[source.id] ?? { status: "idle" }}
          onIngest={() => onIngest(source.id)}
        />
      ))}
    </div>
  )
}

// ─── SourceRow ────────────────────────────────────────────────────────────────

function SourceRow({
  source,
  ingestState,
  onIngest,
}: {
  source: Source
  ingestState: IngestState
  onIngest: () => void
}) {
  return (
    <div
      data-testid={`source-row-${source.id}`}
      className="flex items-center justify-between rounded-lg border border-[rgba(55,50,47,0.12)] px-4 py-3"
    >
      <div className="flex items-center gap-3 min-w-0">
        <Globe className="size-3.5 text-[#828387] shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#37322F] truncate">{source.label}</p>
          <p className="text-xs text-[#828387] truncate">{source.url}</p>
          {ingestState.status === "done" && ingestState.message && (
            <p className="text-[10px] text-emerald-600 flex items-center gap-0.5 mt-0.5">
              <CheckCircle className="size-2.5" />
              {ingestState.message}
            </p>
          )}
          {ingestState.status === "error" && ingestState.message && (
            <p className="text-[10px] text-red-600 flex items-center gap-0.5 mt-0.5">
              <AlertCircle className="size-2.5" />
              {ingestState.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-3">
        {source.tags.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className="text-[10px] border-[rgba(55,50,47,0.15)] text-[#605A57] hidden sm:inline-flex"
          >
            {tag}
          </Badge>
        ))}

        <button
          onClick={onIngest}
          disabled={ingestState.status === "loading"}
          aria-label={`Ingest ${source.label}`}
          className="inline-flex size-7 items-center justify-center rounded-md border border-[rgba(55,50,47,0.12)] text-[#605A57] transition-colors hover:bg-[rgba(55,50,47,0.04)] hover:text-[#37322F] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {ingestState.status === "loading" ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <RefreshCw className="size-3" />
          )}
        </button>
      </div>
    </div>
  )
}

