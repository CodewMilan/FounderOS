import { NextResponse } from "next/server"
import { competitorIntelService } from "@/lib/services/competitorIntelService"
import { EnrichCompetitorRequestSchema } from "@/lib/schemas/competitor-intel"

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json()
    const parsed = EnrichCompetitorRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      )
    }

    const enriched = await competitorIntelService.enrichCompetitor(
      parsed.data.competitorId,
      parsed.data.websiteUrl
    )

    if (!enriched) {
      return NextResponse.json(
        { error: "Competitor not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ competitor: enriched })
  } catch (err) {
    console.error("[POST /api/competitors/enrich]", err)
    return NextResponse.json(
      { error: "Failed to enrich competitor" },
      { status: 500 }
    )
  }
}
