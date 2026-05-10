import { NextResponse } from "next/server"
import { z } from "zod"
import { prospectService } from "@/lib/services/prospectService"

const GenerateBriefSchema = z.object({
  prospectId: z.string().min(1, "prospectId is required"),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = GenerateBriefSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    )
  }

  try {
    const brief = prospectService.generateBrief(parsed.data.prospectId)
    return NextResponse.json({ brief }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Brief generation failed" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const prospectId = searchParams.get("prospectId")

  if (!prospectId) {
    return NextResponse.json({ error: "prospectId query param required" }, { status: 400 })
  }

  const brief = prospectService.getBrief(prospectId)
  if (!brief) {
    return NextResponse.json({ brief: null })
  }
  return NextResponse.json({ brief })
}
