import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { SaveUserPersonalProfileSchema, UserPersonalProfileSchema } from "@/lib/schemas/user-personal-profile"

function toUtcIso(value: unknown): string {
  return new Date(String(value)).toISOString()
}

export async function GET() {
  const supabase = await createSupabaseServerClient()
  if (!supabase) {
    return NextResponse.json({ profile: null, authConfigured: false })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase.from("user_profiles").select("*").eq("id", user.id).maybeSingle()

  if (error) {
    console.error("[GET /api/user-profile]", error.message)
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 })
  }

  if (!data) {
    const { error: upsertErr } = await supabase.from("user_profiles").upsert({ id: user.id }, { onConflict: "id" })
    if (upsertErr) {
      console.error("[GET /api/user-profile] upsert", upsertErr.message)
      return NextResponse.json({ error: "Failed to ensure profile row" }, { status: 500 })
    }

    const { data: row, error: readErr } = await supabase.from("user_profiles").select("*").eq("id", user.id).single()
    if (readErr || !row) {
      console.error("[GET /api/user-profile] reload", readErr?.message)
      return NextResponse.json({ error: "Failed to load profile" }, { status: 500 })
    }

    const profile = UserPersonalProfileSchema.parse({
      id: row.id,
      fullName: row.full_name ?? null,
      phone: row.phone ?? null,
      jobTitle: row.job_title ?? null,
      createdAt: toUtcIso(row.created_at),
      updatedAt: toUtcIso(row.updated_at),
    })
    return NextResponse.json({ profile, authConfigured: true })
  }

  const profile = UserPersonalProfileSchema.parse({
    id: data.id,
    fullName: data.full_name ?? null,
    phone: data.phone ?? null,
    jobTitle: data.job_title ?? null,
    createdAt: toUtcIso(data.created_at),
    updatedAt: toUtcIso(data.updated_at),
  })

  return NextResponse.json({ profile, authConfigured: true })
}

export async function PATCH(request: Request) {
  const supabase = await createSupabaseServerClient()
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = SaveUserPersonalProfileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 })
  }

  const patch: Record<string, string | null> = {}
  if (parsed.data.fullName !== undefined) patch.full_name = parsed.data.fullName
  if (parsed.data.phone !== undefined) patch.phone = parsed.data.phone
  if (parsed.data.jobTitle !== undefined) patch.job_title = parsed.data.jobTitle

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 })
  }

  const { data, error } = await supabase.from("user_profiles").update(patch).eq("id", user.id).select("*").single()

  if (error) {
    console.error("[PATCH /api/user-profile]", error.message)
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 })
  }

  const profile = UserPersonalProfileSchema.parse({
    id: data.id,
    fullName: data.full_name ?? null,
    phone: data.phone ?? null,
    jobTitle: data.job_title ?? null,
    createdAt: toUtcIso(data.created_at),
    updatedAt: toUtcIso(data.updated_at),
  })

  return NextResponse.json({ profile })
}
