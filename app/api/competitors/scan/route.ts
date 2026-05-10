import { NextResponse } from "next/server"
import { competitorService } from "@/lib/services/competitorService"

export async function POST() {
  try {
    const result = await competitorService.scanAll()
    return NextResponse.json({
      scanned: result.scanned,
      detected: result.detected,
      changes: result.changes,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Scan failed" },
      { status: 500 }
    )
  }
}
