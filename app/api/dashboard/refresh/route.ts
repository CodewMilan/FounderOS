import { NextResponse } from "next/server"
import { briefService } from "@/lib/services/briefService"

/**
 * POST /api/dashboard/refresh
 *
 * Aggregates fresh intelligence across all three modules and returns a
 * DashboardAggregate. In mock mode, the store is pre-seeded so this always
 * returns believable demo data without any external credentials.
 *
 * The client calls this when the user clicks "Run scan" on the dashboard.
 */
export async function POST() {
  try {
    // Small simulated latency to make the demo feel like a real scan
    await new Promise((resolve) => setTimeout(resolve, 600))

    const aggregate = briefService.aggregate()

    return NextResponse.json(aggregate)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Refresh failed" },
      { status: 500 }
    )
  }
}
