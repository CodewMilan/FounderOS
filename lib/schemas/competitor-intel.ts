import { z } from "zod"

export const MarketPositionSchema = z.enum([
  "leader",
  "challenger",
  "niche",
  "emerging",
])
export type MarketPosition = z.infer<typeof MarketPositionSchema>

export const RadarScoresSchema = z.object({
  pricingCompetitiveness: z.number().min(1).max(10),
  featureDepth: z.number().min(1).max(10),
  marketPresence: z.number().min(1).max(10),
  geographicReach: z.number().min(1).max(10),
  targetClarity: z.number().min(1).max(10),
  tractionSignals: z.number().min(1).max(10),
})
export type RadarScores = z.infer<typeof RadarScoresSchema>

export const TractionSignalsSchema = z.object({
  hiringActivity: z.number().min(0).max(10),
  productLaunchSignals: z.number().min(0).max(10),
  socialProof: z.number().min(0).max(10),
  integrationsCount: z.number().min(0).max(10),
})
export type TractionSignals = z.infer<typeof TractionSignalsSchema>

export const EnrichedCompetitorSchema = z.object({
  id: z.string(),
  companyName: z.string(),
  websiteUrl: z.string(),
  description: z.string(),
  marketPosition: MarketPositionSchema,
  whyCompetitor: z.string(),
  pricingModel: z.string().optional(),
  estimatedPriceRange: z.string().optional(),
  estimatedMonthlyPriceEntry: z.number().optional(),
  hasFreeTier: z.boolean().default(false),
  keyFeatures: z.array(z.string()).default([]),
  positioning: z.string().optional(),
  targetCustomer: z.string().optional(),
  notableStrengths: z.array(z.string()).default([]),
  geographyFocus: z.array(z.string()).default([]),
  radarScores: RadarScoresSchema.optional(),
  tractionSignals: TractionSignalsSchema.optional(),
  positioningX: z.number().min(0).max(10).optional(),
  positioningY: z.number().min(0).max(10).optional(),
  enrichedAt: z.string().datetime().optional(),
  isManuallyAdded: z.boolean().default(false),
})
export type EnrichedCompetitor = z.infer<typeof EnrichedCompetitorSchema>

export const CompetitorIntelStateSchema = z.object({
  competitors: z.array(EnrichedCompetitorSchema),
  lastFetchedAt: z.string().datetime().optional(),
  yourRadarScores: RadarScoresSchema.optional(),
  yourFeatures: z.array(z.string()).default([]),
  yourMonthlyPriceEntry: z.number().optional(),
  yourHasFreeTier: z.boolean().default(false),
  yourPositioningX: z.number().min(0).max(10).optional(),
  yourPositioningY: z.number().min(0).max(10).optional(),
})
export type CompetitorIntelState = z.infer<typeof CompetitorIntelStateSchema>

export const FetchCompetitorsRequestSchema = z.object({
  profileId: z.string().optional(),
})
export type FetchCompetitorsRequest = z.infer<typeof FetchCompetitorsRequestSchema>

export const EnrichCompetitorRequestSchema = z.object({
  competitorId: z.string(),
  websiteUrl: z.string().url(),
})
export type EnrichCompetitorRequest = z.infer<typeof EnrichCompetitorRequestSchema>

export const AddCompetitorManuallySchema = z.object({
  websiteUrl: z.string().url("Must be a valid URL (include https://)"),
  companyName: z.string().optional(),
})
export type AddCompetitorManuallyInput = z.infer<typeof AddCompetitorManuallySchema>
