import { CompetitorFeed } from "@/components/app/competitor-feed"
import { CompetitorAlertPanel } from "@/components/app/competitor-alert-panel"
import { seedCompetitorChanges } from "@/lib/seed"

/**
 * Server component: provides seeded initial data to the CompetitorFeed client
 * component. This ensures the page renders immediately without a client-side
 * loading state on first paint, while the feed can still be refreshed via
 * the Scan button.
 */
export default function CompetitorsPage() {
  return (
    <div className="flex flex-col gap-8">
      <CompetitorAlertPanel />
      <CompetitorFeed initialChanges={seedCompetitorChanges} />
    </div>
  )
}
