import { NextResponse } from "next/server"
import { FeatureGapRequestSchema } from "@/lib/schemas/workflows"
import { runFeatureGapWorkflow } from "@/lib/workflows/feature-gap"

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = FeatureGapRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    )
  }

  try {
    const result = await runFeatureGapWorkflow(parsed.data)
    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    console.error("[/api/workflows/feature-gap]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Workflow failed" },
      { status: 500 }
    )
  }
}
