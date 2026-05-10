import { NextResponse } from "next/server"
import { ProspectEnrichmentRequestSchema } from "@/lib/schemas/workflows"
import { runProspectEnrichmentWorkflow } from "@/lib/workflows/prospect-enrichment"

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = ProspectEnrichmentRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    )
  }

  try {
    const result = await runProspectEnrichmentWorkflow(parsed.data)
    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    console.error("[/api/workflows/prospect-enrichment]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Workflow failed" },
      { status: 500 }
    )
  }
}
