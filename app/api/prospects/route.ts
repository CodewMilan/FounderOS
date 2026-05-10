import { NextResponse } from "next/server"
import { prospectService } from "@/lib/services/prospectService"

export async function GET() {
  const prospects = prospectService.listProspects()
  return NextResponse.json({ prospects })
}
