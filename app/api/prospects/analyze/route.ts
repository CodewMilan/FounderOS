import { NextResponse } from "next/server"
import { AnalyzeProspectSchema } from "@/lib/schemas"
import { prospectService } from "@/lib/services/prospectService"

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = AnalyzeProspectSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    )
  }

  try {
    const prospect = await prospectService.analyzeCompany(parsed.data)
    return NextResponse.json({ prospect }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 500 }
    )
  }
}
