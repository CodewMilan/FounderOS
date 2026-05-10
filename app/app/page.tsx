import { briefService } from "@/lib/services/briefService"
import { DashboardClient } from "@/components/app/dashboard-client"

/**
 * Force dynamic rendering — the dashboard reads from an in-memory store that
 * is updated on every scan, so Next.js must not cache the server output.
 */
export const dynamic = "force-dynamic"

/**
 * Server component: reads the current DashboardAggregate from the live store.
 * Initial data reflects the store state (seeded or post-scan).
 * The DashboardClient handles interactive refresh, loading, error, and scan states.
 */
export default function DashboardPage() {
  const aggregate = briefService.aggregate()
  return <DashboardClient initialAggregate={aggregate} />
}
