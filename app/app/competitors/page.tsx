import { CompetitorFeed } from "@/components/app/competitor-feed"
import { seedCompetitorChanges } from "@/lib/seed"

/**
 * Server component: provides seeded initial data to the CompetitorFeed client
 * component. This ensures the page renders immediately without a client-side
 * loading state on first paint, while the feed can still be refreshed via
 * the Scan button.
 */
export default function CompetitorsPage() {
  return <CompetitorFeed initialChanges={seedCompetitorChanges} />
}
