import { z } from "zod"

export const UserPersonalProfileSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().max(200).nullable(),
  phone: z.string().max(50).nullable(),
  jobTitle: z.string().max(200).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type UserPersonalProfile = z.infer<typeof UserPersonalProfileSchema>

export const SaveUserPersonalProfileSchema = z.object({
  fullName: z.string().max(200).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  jobTitle: z.string().max(200).nullable().optional(),
})

export type SaveUserPersonalProfile = z.infer<typeof SaveUserPersonalProfileSchema>
