import { NextResponse } from "next/server"
import { briefService } from "@/lib/services/briefService"
import { competitorService } from "@/lib/services/competitorService"

/**
 * POST /api/dashboard/refresh
 *
 * Triggered by the user clicking "Run scan" on the dashboard.
 *
 * Behavior:
 * - If SCRAPE_PROVIDER is set to a real provider (not "mock"), the scan
 *   pipeline runs against all tracked competitor sources using the configured
 *   provider (Anakin, Jina, etc.). Results are written to the store.
 * - A 25-second ceiling timeout prevents the request from hanging indefinitely.
 *   Whatever completes within the window is stored; the rest is skipped.
 * - If the scan fails, the handler still returns the current store state as a
 *   graceful fallback — the dashboard is never left without data.
 * - In mock mode (SCRAPE_PROVIDER not set or set to "mock"), the scan pipeline
 *   is not triggered to avoid polluting the seeded demo store. The dashboard
 *   still refreshes from the current store state.
 */
export async function POST() {
  const isRealProvider =
    typeof process.env.SCRAPE_PROVIDER === "string" &&
    process.env.SCRAPE_PROVIDER !== "mock" &&
    process.env.SCRAPE_PROVIDER !== ""

  if (isRealProvider) {
    // Run the scan pipeline. Failures are non-fatal.
    try {
      await Promise.race([
        competitorService.scanAll(),
        new Promise<void>((resolve) => setTimeout(resolve, 25_000)),
      ])
    } catch {
      // Scan error is swallowed — aggregate from current store state below.
    }
  }

  try {
    const aggregate = briefService.aggregate()
    return NextResponse.json(aggregate)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Refresh failed" },
      { status: 500 }
    )
  }
}
