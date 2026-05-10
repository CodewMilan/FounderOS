import { NextResponse } from "next/server"
import { profileService } from "@/lib/services/profileService"
import { SaveFounderProfileSchema } from "@/lib/schemas/profile"

export async function GET() {
  try {
    const profile = profileService.get()
    return NextResponse.json({ profile: profile ?? null })
  } catch (err) {
    console.error("[GET /api/profile]", err)
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json()
    const parsed = SaveFounderProfileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      )
    }

    const profile = profileService.save(parsed.data)
    return NextResponse.json({ profile })
  } catch (err) {
    console.error("[POST /api/profile]", err)
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 })
  }
}
