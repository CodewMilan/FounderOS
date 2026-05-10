import { NextResponse } from "next/server"
import { ingestionService } from "@/lib/services/ingestionService"
import { IngestRequestSchema } from "@/lib/schemas"

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    )
  }

  const parsed = IngestRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const result = await ingestionService.ingest(parsed.data.sourceId)

  if (!result) {
    return NextResponse.json(
      { error: `Source not found: ${parsed.data.sourceId}` },
      { status: 404 }
    )
  }

  return NextResponse.json({
    extraction: result.extraction,
    provider: result.provider,
  })
}
