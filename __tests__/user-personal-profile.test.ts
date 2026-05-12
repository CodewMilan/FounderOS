import { describe, it, expect } from "vitest"
import { SaveUserPersonalProfileSchema, UserPersonalProfileSchema } from "@/lib/schemas/user-personal-profile"

describe("UserPersonalProfileSchema", () => {
  it("parses a valid row", () => {
    const now = new Date().toISOString()
    const r = UserPersonalProfileSchema.safeParse({
      id: "00000000-0000-0000-0000-000000000001",
      fullName: "Ada",
      phone: null,
      jobTitle: "Founder",
      createdAt: now,
      updatedAt: now,
    })
    expect(r.success).toBe(true)
  })
})

describe("SaveUserPersonalProfileSchema", () => {
  it("accepts partial updates", () => {
    const r = SaveUserPersonalProfileSchema.safeParse({ fullName: "Ada" })
    expect(r.success).toBe(true)
  })
})
