import { NextResponse } from "next/server"
import { competitorService } from "@/lib/services/competitorService"

export async function GET() {
  const changes = competitorService.listChanges()
  return NextResponse.json({ changes })
}
