"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import {
  INDUSTRIES,
  GEOGRAPHIES,
  TARGET_CUSTOMERS,
  FOUNDER_STAGES,
  PRICING_MODELS,
} from "@/lib/schemas/profile-constants"
import type { FounderProfile } from "@/lib/schemas/profile"

interface Props {
  initialProfile?: FounderProfile | null
  onSaved?: (profile: FounderProfile) => void
}

type FormData = {
  companyName: string
  websiteUrl: string
  description: string
  industry: string
  targetGeographies: string[]
  targetCustomer: string
  stage: string
  pricingModel: string
  pricingPageUrl: string
  knownCompetitors: string
  problemSolved: string
  keyDifferentiator: string
}

function emptyForm(profile?: FounderProfile | null): FormData {
  if (!profile) {
    return {
      companyName: "",
      websiteUrl: "",
      description: "",
      industry: "",
      targetGeographies: [],
      targetCustomer: "",
      stage: "",
      pricingModel: "",
      pricingPageUrl: "",
      knownCompetitors: "",
      problemSolved: "",
      keyDifferentiator: "",
    }
  }
  return {
    companyName: profile.companyName,
    websiteUrl: profile.websiteUrl ?? "",
    description: profile.description,
    industry: profile.industry,
    targetGeographies: profile.targetGeographies,
    targetCustomer: profile.targetCustomer,
    stage: profile.stage,
    pricingModel: profile.pricingModel,
    pricingPageUrl: profile.pricingPageUrl ?? "",
    knownCompetitors: profile.knownCompetitors ?? "",
    problemSolved: profile.problemSolved ?? "",
    keyDifferentiator: profile.keyDifferentiator ?? "",
  }
}

function completionPercent(form: FormData): number {
  const required = [
    form.companyName,
    form.description,
    form.industry,
    form.targetGeographies.length > 0 ? "filled" : "",
    form.targetCustomer,
    form.stage,
    form.pricingModel,
  ]
  const optional = [form.websiteUrl, form.problemSolved, form.keyDifferentiator]
  const requiredFilled = required.filter(Boolean).length
  const optionalFilled = optional.filter(Boolean).length
  return Math.round(((requiredFilled * 2 + optionalFilled) / (required.length * 2 + optional.length)) * 100)
}

export function FounderProfileForm({ initialProfile, onSaved }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<FormData>(() => emptyForm(initialProfile))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  const completion = completionPercent(form)

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function toggleGeo(geo: string) {
    setForm((prev) => {
      const already = prev.targetGeographies.includes(geo)
      return {
        ...prev,
        targetGeographies: already
          ? prev.targetGeographies.filter((g) => g !== geo)
          : [...prev.targetGeographies, geo],
      }
    })
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof FormData, string>> = {}
    if (!form.companyName.trim()) errs.companyName = "Required"
    if (!form.description.trim()) errs.description = "Required"
    if (!form.industry) errs.industry = "Required"
    if (form.targetGeographies.length === 0) errs.targetGeographies = "Select at least one"
    if (!form.targetCustomer) errs.targetCustomer = "Required"
    if (!form.stage) errs.stage = "Required"
    if (!form.pricingModel) errs.pricingModel = "Required"
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    setError(null)

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          websiteUrl: form.websiteUrl || undefined,
          pricingPageUrl: form.pricingPageUrl || undefined,
          knownCompetitors: form.knownCompetitors || undefined,
          problemSolved: form.problemSolved || undefined,
          keyDifferentiator: form.keyDifferentiator || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? "Save failed")
      }

      const data = await res.json() as { profile: FounderProfile }

      // Trigger competitor auto-fetch in background — don't await
      fetch("/api/competitors/fetch", { method: "POST", body: "{}" }).catch(() => null)

      onSaved?.(data.profile)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      {/* Completion progress */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#605A57]">Profile completion</span>
          <span className="text-xs tabular-nums text-[#605A57]">{completion}%</span>
        </div>
        <Progress value={completion} className="h-1.5" />
      </div>

      {/* Section 1: About your startup */}
      <Card className="border-[rgba(55,50,47,0.12)] shadow-none rounded-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#37322F]">About your startup</CardTitle>
          <CardDescription className="text-xs text-[#828387]">
            Basic identity and what you build.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="companyName" className="text-xs font-medium text-[#37322F]">
                Company name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="companyName"
                value={form.companyName}
                onChange={(e) => set("companyName", e.target.value)}
                placeholder="e.g. FounderOS"
                className="h-8 text-sm border-[rgba(55,50,47,0.2)]"
                autoComplete="organization"
              />
              {fieldErrors.companyName && (
                <p className="text-xs text-red-500">{fieldErrors.companyName}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="websiteUrl" className="text-xs font-medium text-[#37322F]">
                Website URL
              </Label>
              <Input
                id="websiteUrl"
                type="url"
                value={form.websiteUrl}
                onChange={(e) => set("websiteUrl", e.target.value)}
                placeholder="https://yoursite.com"
                className="h-8 text-sm border-[rgba(55,50,47,0.2)]"
                autoComplete="url"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description" className="text-xs font-medium text-[#37322F]">
              One-line description <span className="text-red-500">*</span>
            </Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What do you build? (one sentence)"
              className="h-8 text-sm border-[rgba(55,50,47,0.2)]"
              maxLength={200}
            />
            <p className="text-[10px] text-[#828387] text-right">
              {form.description.length}/200
            </p>
            {fieldErrors.description && (
              <p className="text-xs text-red-500">{fieldErrors.description}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Your market */}
      <Card className="border-[rgba(55,50,47,0.12)] shadow-none rounded-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#37322F]">Your market</CardTitle>
          <CardDescription className="text-xs text-[#828387]">
            Industry, geography, and who you sell to.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="industry" className="text-xs font-medium text-[#37322F]">
                Industry <span className="text-red-500">*</span>
              </Label>
              <Select value={form.industry} onValueChange={(v) => set("industry", v)}>
                <SelectTrigger id="industry" className="h-8 text-sm border-[rgba(55,50,47,0.2)]">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((i) => (
                    <SelectItem key={i} value={i} className="text-sm">
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.industry && (
                <p className="text-xs text-red-500">{fieldErrors.industry}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="targetCustomer" className="text-xs font-medium text-[#37322F]">
                Target customer <span className="text-red-500">*</span>
              </Label>
              <Select value={form.targetCustomer} onValueChange={(v) => set("targetCustomer", v)}>
                <SelectTrigger id="targetCustomer" className="h-8 text-sm border-[rgba(55,50,47,0.2)]">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {TARGET_CUSTOMERS.map((c) => (
                    <SelectItem key={c} value={c} className="text-sm">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.targetCustomer && (
                <p className="text-xs text-red-500">{fieldErrors.targetCustomer}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="stage" className="text-xs font-medium text-[#37322F]">
                Stage <span className="text-red-500">*</span>
              </Label>
              <Select value={form.stage} onValueChange={(v) => set("stage", v)}>
                <SelectTrigger id="stage" className="h-8 text-sm border-[rgba(55,50,47,0.2)]">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {FOUNDER_STAGES.map((s) => (
                    <SelectItem key={s} value={s} className="text-sm">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.stage && (
                <p className="text-xs text-red-500">{fieldErrors.stage}</p>
              )}
            </div>
          </div>

          {/* Geography multi-select */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-[#37322F]">
              Target geography <span className="text-red-500">*</span>
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {GEOGRAPHIES.map((geo) => {
                const selected = form.targetGeographies.includes(geo)
                return (
                  <button
                    key={geo}
                    type="button"
                    onClick={() => toggleGeo(geo)}
                    className={[
                      "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border transition-colors",
                      selected
                        ? "bg-[#37322F] text-white border-[#37322F]"
                        : "bg-transparent text-[#605A57] border-[rgba(55,50,47,0.2)] hover:border-[#37322F]",
                    ].join(" ")}
                    aria-pressed={selected}
                  >
                    {geo}
                  </button>
                )
              })}
            </div>
            {fieldErrors.targetGeographies && (
              <p className="text-xs text-red-500">{fieldErrors.targetGeographies}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Your product & pricing */}
      <Card className="border-[rgba(55,50,47,0.12)] shadow-none rounded-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#37322F]">Product & pricing</CardTitle>
          <CardDescription className="text-xs text-[#828387]">
            Pricing model and page — used for competitor pricing comparison.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pricingModel" className="text-xs font-medium text-[#37322F]">
                Pricing model <span className="text-red-500">*</span>
              </Label>
              <Select value={form.pricingModel} onValueChange={(v) => set("pricingModel", v)}>
                <SelectTrigger id="pricingModel" className="h-8 text-sm border-[rgba(55,50,47,0.2)]">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {PRICING_MODELS.map((p) => (
                    <SelectItem key={p} value={p} className="text-sm">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.pricingModel && (
                <p className="text-xs text-red-500">{fieldErrors.pricingModel}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pricingPageUrl" className="text-xs font-medium text-[#37322F]">
                Pricing page URL
              </Label>
              <Input
                id="pricingPageUrl"
                type="url"
                value={form.pricingPageUrl}
                onChange={(e) => set("pricingPageUrl", e.target.value)}
                placeholder="https://yoursite.com/pricing"
                className="h-8 text-sm border-[rgba(55,50,47,0.2)]"
                autoComplete="url"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Optional context */}
      <Card className="border-[rgba(55,50,47,0.12)] shadow-none rounded-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#37322F]">Optional context</CardTitle>
          <CardDescription className="text-xs text-[#828387]">
            Helps FounderOS give you more accurate competitor intelligence.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="knownCompetitors" className="text-xs font-medium text-[#37322F]">
              Known competitors
            </Label>
            <Input
              id="knownCompetitors"
              value={form.knownCompetitors}
              onChange={(e) => set("knownCompetitors", e.target.value)}
              placeholder="e.g. notion.so, coda.io, craft.do (comma-separated)"
              className="h-8 text-sm border-[rgba(55,50,47,0.2)]"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="problemSolved" className="text-xs font-medium text-[#37322F]">
                Problem being solved
              </Label>
              <Textarea
                id="problemSolved"
                value={form.problemSolved}
                onChange={(e) => set("problemSolved", e.target.value)}
                placeholder="What pain do you solve?"
                className="text-sm border-[rgba(55,50,47,0.2)] resize-none"
                rows={3}
                maxLength={400}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="keyDifferentiator" className="text-xs font-medium text-[#37322F]">
                Key differentiator
              </Label>
              <Textarea
                id="keyDifferentiator"
                value={form.keyDifferentiator}
                onChange={(e) => set("keyDifferentiator", e.target.value)}
                placeholder="What makes you different?"
                className="text-sm border-[rgba(55,50,47,0.2)] resize-none"
                rows={3}
                maxLength={400}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-red-600 rounded-md border border-red-200 bg-red-50 px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-[#828387]">
          Fields marked <span className="text-red-500">*</span> are required
        </p>
        <Button
          type="submit"
          disabled={saving}
          className="bg-[#37322F] hover:bg-[#49423D] text-white text-sm h-8 px-4"
        >
          {saving ? "Saving…" : initialProfile ? "Update profile" : "Save profile"}
        </Button>
      </div>
    </form>
  )
}
