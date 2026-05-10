"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Pencil, ExternalLink } from "lucide-react"
import type { FounderProfile } from "@/lib/schemas/profile"

interface Props {
  profile: FounderProfile
  onEdit: () => void
}

function Field({ label, value }: { label: string; value: string | undefined }) {
  if (!value) return null
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#828387]">{label}</p>
      <p className="text-sm font-medium text-[#49423D]">{value}</p>
    </div>
  )
}

export function FounderProfileView({ profile, onEdit }: Props) {
  const lastUpdated = new Date(profile.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#37322F] tracking-tight">{profile.companyName}</h2>
          <p className="text-sm text-[#605A57] mt-0.5">{profile.description}</p>
          {profile.websiteUrl && (
            <a
              href={profile.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#605A57] hover:text-[#37322F] mt-1 transition-colors"
            >
              <ExternalLink className="size-3" />
              {profile.websiteUrl.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="border-[rgba(55,50,47,0.2)] text-[#605A57] hover:text-[#37322F] hover:bg-[rgba(55,50,47,0.04)] h-8"
        >
          <Pencil className="size-3 mr-1.5" />
          Edit
        </Button>
      </div>

      {/* Market */}
      <Card className="border-[rgba(55,50,47,0.12)] shadow-none rounded-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[#828387]">
            Market
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-x-6 gap-y-3 sm:grid-cols-3">
          <Field label="Industry" value={profile.industry} />
          <Field label="Target customer" value={profile.targetCustomer} />
          <Field label="Stage" value={profile.stage} />
          <div className="col-span-full space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#828387]">Geographies</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.targetGeographies.map((geo) => (
                <Badge
                  key={geo}
                  variant="outline"
                  className="text-[10px] border-[rgba(55,50,47,0.15)] text-[#605A57]"
                >
                  {geo}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product & Pricing */}
      <Card className="border-[rgba(55,50,47,0.12)] shadow-none rounded-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[#828387]">
            Product & pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <Field label="Pricing model" value={profile.pricingModel} />
          {profile.pricingPageUrl && (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#828387]">Pricing page</p>
              <a
                href={profile.pricingPageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-[#605A57] hover:text-[#37322F] transition-colors font-medium"
              >
                <ExternalLink className="size-3" />
                {profile.pricingPageUrl.replace(/^https?:\/\//, "")}
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Optional context */}
      {(profile.knownCompetitors || profile.problemSolved || profile.keyDifferentiator) && (
        <Card className="border-[rgba(55,50,47,0.12)] shadow-none rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[#828387]">
              Context
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {profile.problemSolved && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#828387]">Problem solved</p>
                <p className="text-sm text-[#49423D] leading-relaxed">{profile.problemSolved}</p>
              </div>
            )}
            {profile.keyDifferentiator && (
              <>
                <Separator className="bg-[rgba(55,50,47,0.08)]" />
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#828387]">Key differentiator</p>
                  <p className="text-sm text-[#49423D] leading-relaxed">{profile.keyDifferentiator}</p>
                </div>
              </>
            )}
            {profile.knownCompetitors && (
              <>
                <Separator className="bg-[rgba(55,50,47,0.08)]" />
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#828387]">Known competitors</p>
                  <p className="text-sm text-[#49423D]">{profile.knownCompetitors}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-[#828387]">Last updated {lastUpdated}</p>
    </div>
  )
}
