import { z } from "zod"

export const IndustrySchema = z.enum([
  "AI Tools",
  "DevTools",
  "FinTech",
  "SaaS",
  "MarketTech",
  "Web3",
  "HealthTech",
  "EdTech",
  "E-Commerce",
  "Other",
])
export type Industry = z.infer<typeof IndustrySchema>

export const GeographySchema = z.enum([
  "India",
  "Southeast Asia",
  "Global",
  "USA",
  "Europe",
  "Middle East",
  "Africa",
  "Latin America",
])
export type Geography = z.infer<typeof GeographySchema>

export const TargetCustomerSchema = z.enum(["B2B", "B2C", "Both"])
export type TargetCustomer = z.infer<typeof TargetCustomerSchema>

export const FounderStageSchema = z.enum([
  "Idea",
  "MVP",
  "Early Revenue",
  "Growth",
  "Scale",
])
export type FounderStage = z.infer<typeof FounderStageSchema>

export const PricingModelSchema = z.enum([
  "Freemium",
  "Subscription",
  "Usage-based",
  "Enterprise",
  "Free",
  "One-time",
])
export type PricingModel = z.infer<typeof PricingModelSchema>

export const FounderProfileSchema = z.object({
  id: z.string(),
  companyName: z.string().min(1, "Company name is required"),
  websiteUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  description: z.string().min(1, "Description is required").max(200, "Keep it under 200 characters"),
  industry: IndustrySchema,
  targetGeographies: z.array(GeographySchema).min(1, "Select at least one geography"),
  targetCustomer: TargetCustomerSchema,
  stage: FounderStageSchema,
  pricingModel: PricingModelSchema,
  pricingPageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  knownCompetitors: z.string().optional(),
  problemSolved: z.string().max(400, "Keep it under 400 characters").optional(),
  keyDifferentiator: z.string().max(400, "Keep it under 400 characters").optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type FounderProfile = z.infer<typeof FounderProfileSchema>

export const SaveFounderProfileSchema = FounderProfileSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})
export type SaveFounderProfileInput = z.infer<typeof SaveFounderProfileSchema>
