import { Settings } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { SourceManager } from "@/components/app/source-manager"
import { seedStartupProfile } from "@/lib/seed"

export default function SettingsPage() {
  return (
    <div data-testid="settings-page" className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-[#37322F] font-sans">Settings</h1>
        <p className="text-sm text-[#605A57] mt-0.5">
          Manage your sources and startup profile.
        </p>
      </div>

      <Card className="border-[rgba(55,50,47,0.12)] shadow-none rounded-lg py-5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Settings className="size-4 text-[#605A57]" />
            <CardTitle className="text-sm font-semibold text-[#37322F]">
              Startup Profile
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-[#605A57]">
            Used to rank funding opportunities and personalize signals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
            <ProfileField label="Name" value={seedStartupProfile.startupName} />
            <ProfileField label="Sector" value={seedStartupProfile.sector} />
            <ProfileField label="Stage" value={seedStartupProfile.stage} />
            <ProfileField label="Geography" value={seedStartupProfile.geography} />
            <ProfileField label="Team size" value={String(seedStartupProfile.teamSize)} />
            <ProfileField
              label="Business model"
              value={seedStartupProfile.businessModel.toUpperCase()}
            />
            <ProfileField
              label="Fundraising"
              value={seedStartupProfile.fundraisingPreference}
            />
          </div>
        </CardContent>
      </Card>

      {/* Interactive source manager — fetches from /api/sources */}
      <SourceManager />
    </div>
  )
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#828387]">
        {label}
      </p>
      <p className="text-sm text-[#49423D]">{value}</p>
    </div>
  )
}
