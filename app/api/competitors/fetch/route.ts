import { NextResponse } from "next/server"
import { profileService } from "@/lib/services/profileService"
import { competitorIntelService } from "@/lib/services/competitorIntelService"
import { FetchCompetitorsRequestSchema } from "@/lib/schemas/competitor-intel"

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => ({}))
    const _parsed = FetchCompetitorsRequestSchema.safeParse(body)

    const profile = profileService.get()
    if (!profile) {
      return NextResponse.json(
        { error: "No founder profile found. Complete your profile first." },
        { status: 400 }
      )
    }

    const state = await competitorIntelService.fetchForProfile(profile)
    return NextResponse.json({ state })
  } catch (err) {
    console.error("[POST /api/competitors/fetch]", err)
    return NextResponse.json(
      { error: "Failed to fetch competitors" },
      { status: 500 }
    )
  }
}
