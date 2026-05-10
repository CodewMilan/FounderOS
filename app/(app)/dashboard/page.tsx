import { briefService } from "@/lib/services/briefService"
import { DashboardClient } from "@/components/app/dashboard-client"

/**
 * Server component: pre-computes the DashboardAggregate from the live store
 * so the initial render is instant. The DashboardClient handles interactive
 * refresh, loading/empty/error states, and the "Run scan" action.
 */
export default function DashboardPage() {
  const aggregate = briefService.aggregate()
  return <DashboardClient initialAggregate={aggregate} />
}
