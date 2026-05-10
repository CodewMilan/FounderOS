import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { sourceService } from "@/lib/services/sourceService"
import { CreateSourceSchema } from "@/lib/schemas"

export async function GET() {
  const sources = sourceService.list()
  return NextResponse.json({ sources })
}

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

  const parsed = CreateSourceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    const source = sourceService.create(parsed.data)
    return NextResponse.json({ source }, { status: 201 })
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: err.flatten() },
        { status: 422 }
      )
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
