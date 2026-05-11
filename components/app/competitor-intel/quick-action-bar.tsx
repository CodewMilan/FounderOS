"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { RefreshCw, DollarSign, PlusCircle, GitFork } from "lucide-react"
import { AddCompetitorManuallySchema } from "@/lib/schemas/competitor-intel"

interface Props {
  onRefreshAll: () => void
  onFeatureGap: () => void
  onPricingResponse: () => void
  onAddCompetitor: (url: string, name?: string) => void
  refreshing?: boolean
}

export function QuickActionBar({ onRefreshAll, onFeatureGap, onPricingResponse, onAddCompetitor, refreshing }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [url, setUrl] = useState("")
  const [name, setName] = useState("")
  const [urlError, setUrlError] = useState("")

  function handleAdd() {
    const result = AddCompetitorManuallySchema.safeParse({ websiteUrl: url, companyName: name || undefined })
    if (!result.success) {
      setUrlError(result.error.issues[0]?.message ?? "Invalid URL")
      return
    }
    onAddCompetitor(url, name || undefined)
    setUrl("")
    setName("")
    setUrlError("")
    setDrawerOpen(false)
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs border-[rgba(55,50,47,0.2)] text-[#605A57] hover:text-[#37322F] hover:bg-[rgba(55,50,47,0.04)]"
          onClick={onFeatureGap}
        >
          <GitFork className="size-3 mr-1.5" />
          Feature gap analysis
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs border-[rgba(55,50,47,0.2)] text-[#605A57] hover:text-[#37322F] hover:bg-[rgba(55,50,47,0.04)]"
          onClick={onPricingResponse}
        >
          <DollarSign className="size-3 mr-1.5" />
          Pricing response
        </Button>
        <Separator orientation="vertical" className="h-5 bg-[rgba(55,50,47,0.12)]" />
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs border-[rgba(55,50,47,0.2)] text-[#605A57] hover:text-[#37322F] hover:bg-[rgba(55,50,47,0.04)]"
          onClick={onRefreshAll}
          disabled={refreshing}
        >
          <RefreshCw className={`size-3 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing…" : "Refresh all"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs border-[rgba(55,50,47,0.2)] text-[#605A57] hover:text-[#37322F] hover:bg-[rgba(55,50,47,0.04)]"
          onClick={() => setDrawerOpen(true)}
        >
          <PlusCircle className="size-3 mr-1.5" />
          Add competitor
        </Button>
      </div>

      {/* Add competitor drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-80">
          <SheetHeader>
            <SheetTitle className="text-base font-semibold text-[#37322F]">Add competitor</SheetTitle>
            <SheetDescription className="text-xs text-[#828387]">
              Enter a competitor URL and FounderOS will enrich it automatically.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 mt-6">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="comp-url" className="text-xs font-medium text-[#37322F]">
                Website URL <span className="text-red-500">*</span>
              </Label>
              <Input
                id="comp-url"
                type="url"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setUrlError("") }}
                placeholder="https://competitor.com"
                className="h-8 text-sm border-[rgba(55,50,47,0.2)]"
                autoComplete="url"
              />
              {urlError && <p className="text-xs text-red-500">{urlError}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="comp-name" className="text-xs font-medium text-[#37322F]">
                Company name (optional)
              </Label>
              <Input
                id="comp-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Notion"
                className="h-8 text-sm border-[rgba(55,50,47,0.2)]"
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-[#37322F] hover:bg-[#49423D] text-white text-sm h-8"
                onClick={handleAdd}
              >
                <PlusCircle className="size-3 mr-1.5" />
                Add
              </Button>
              <Button
                variant="outline"
                className="h-8 text-sm border-[rgba(55,50,47,0.2)] text-[#605A57]"
                onClick={() => setDrawerOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
