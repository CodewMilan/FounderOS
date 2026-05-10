import { CompetitorFeed } from "@/components/app/competitor-feed"
import { CompetitorAlertPanel } from "@/components/app/competitor-alert-panel"
import { CompetitorIntelligencePanel } from "@/components/app/competitor-intel/competitor-intelligence-panel"
import { seedCompetitorChanges } from "@/lib/seed"
import { profileService } from "@/lib/services/profileService"
import { competitorIntelService } from "@/lib/services/competitorIntelService"
import { mockCompetitorIntelState } from "@/lib/mocks/competitor-intel-mocks"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Radar, BarChart2, User } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

/**
 * Server component: provides seeded initial data to the client components.
 * - Change Radar tab: existing competitor feed (unchanged)
 * - Intelligence tab: new visual competitive analysis
 *
 * If no founder profile is set, the Intelligence tab shows a CTA
 * to complete the profile first.
 *
 * Kept synchronous so existing tests continue to work — all service
 * calls are in-memory and return synchronously.
 */
export default function CompetitorsPage() {
  const profile = profileService.get()

  // Load intel state from store, fall back to mock if no profile
  const intelState = competitorIntelService.getState() ?? (profile ? mockCompetitorIntelState : null)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[#37322F] tracking-tight">Competitors</h1>
        <p className="text-sm text-[#605A57] mt-1">
          Track changes and analyse your competitive landscape.
        </p>
      </div>

      <Tabs defaultValue="radar" className="flex flex-col gap-0">
        <TabsList className="h-8 bg-[rgba(55,50,47,0.04)] border border-[rgba(55,50,47,0.1)] rounded-lg p-0.5 w-fit gap-0.5">
          <TabsTrigger
            value="radar"
            className="h-7 px-3 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#37322F] text-[#605A57] rounded-md"
          >
            <Radar className="size-3 mr-1.5" />
            Change Radar
          </TabsTrigger>
          <TabsTrigger
            value="intelligence"
            className="h-7 px-3 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#37322F] text-[#605A57] rounded-md"
          >
            <BarChart2 className="size-3 mr-1.5" />
            Intelligence
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Existing change radar — unchanged */}
        <TabsContent value="radar" className="mt-6">
          <div className="flex flex-col gap-8">
            <CompetitorAlertPanel />
            <CompetitorFeed initialChanges={seedCompetitorChanges} />
          </div>
        </TabsContent>

        {/* Tab 2: New intelligence view */}
        <TabsContent value="intelligence" className="mt-6">
          {!profile ? (
            /* Profile gate */
            <div className="flex flex-col items-center gap-4 py-20 text-center max-w-sm mx-auto">
              <div className="size-10 rounded-full bg-[rgba(55,50,47,0.06)] flex items-center justify-center">
                <User className="size-4 text-[#605A57]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#37322F]">Set up your founder profile first</p>
                <p className="text-xs text-[#828387] mt-1 leading-relaxed">
                  FounderOS needs to know about your startup to auto-fetch competitors and generate
                  competitive intelligence.
                </p>
              </div>
              <Button
                asChild
                className="bg-[#37322F] hover:bg-[#49423D] text-white text-sm h-8 px-4"
              >
                <Link href="/app/profile">Complete your profile</Link>
              </Button>
            </div>
          ) : intelState ? (
            <CompetitorIntelligencePanel
              initialState={intelState}
              yourName={profile.companyName}
            />
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}
