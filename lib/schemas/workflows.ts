/**
 * Zod schemas for all FounderOS workflow API boundaries.
 */

import { z } from "zod"

// ─── Shared primitives ────────────────────────────────────────────────────────

const ConfidenceSchema = z.enum(["high", "medium", "low"])
const UrgencySchema = z.enum(["high", "medium", "low"])

// ─── Workflow 1: Feature Gap ──────────────────────────────────────────────────

export const FeatureGapRequestSchema = z.object({
  competitorUrl: z.string().url("competitorUrl must be a valid URL"),
  userSiteUrl: z.string().url("userSiteUrl must be a valid URL").optional(),
})
export type FeatureGapRequest = z.infer<typeof FeatureGapRequestSchema>

export const FeatureGapBriefSchema = z.object({
  competitorName: z.string(),
  featureName: z.string(),
  whatItDoes: z.string(),
  gap: z.string(),
  whyItMatters: z.string(),
  suggestedAction: z.string(),
  confidence: ConfidenceSchema,
  sourceUrl: z.string(),
})
export type FeatureGapBrief = z.infer<typeof FeatureGapBriefSchema>

export const FeatureGapResultSchema = z.object({
  brief: FeatureGapBriefSchema,
  telegramSent: z.boolean(),
  telegramError: z.string().optional(),
  slackSent: z.boolean(),
  slackError: z.string().optional(),
})
export type FeatureGapResult = z.infer<typeof FeatureGapResultSchema>

// ─── Workflow 2: Dev Ticket ───────────────────────────────────────────────────

export const DevTicketRequestSchema = z.object({
  featureName: z.string().min(1),
  competitorName: z.string().min(1),
  description: z.string().min(1),
  whyNow: z.string().min(1),
  suggestedImplementation: z.string().min(1),
  confidence: ConfidenceSchema,
  sourceUrl: z.string().url("sourceUrl must be a valid URL"),
})
export type DevTicketRequest = z.infer<typeof DevTicketRequestSchema>

export const DevTicketResultSchema = z.object({
  slackSent: z.boolean(),
  slackError: z.string().optional(),
})
export type DevTicketResult = z.infer<typeof DevTicketResultSchema>

// ─── Workflow 3: Pricing Response ─────────────────────────────────────────────

export const PricingResponseRequestSchema = z.object({
  competitorUrl: z.string().url("competitorUrl must be a valid URL"),
  userPricingUrl: z.string().url("userPricingUrl must be a valid URL").optional(),
})
export type PricingResponseRequest = z.infer<typeof PricingResponseRequestSchema>

export const PricingResponseBriefSchema = z.object({
  competitorName: z.string(),
  changeDetected: z.string(),
  theirPricing: z.string(),
  yourPositioning: z.string(),
  suggestedResponse: z.string(),
  urgency: UrgencySchema,
  sourceUrl: z.string(),
})
export type PricingResponseBrief = z.infer<typeof PricingResponseBriefSchema>

export const PricingResponseResultSchema = z.object({
  brief: PricingResponseBriefSchema,
  telegramSent: z.boolean(),
  telegramError: z.string().optional(),
  slackSent: z.boolean(),
  slackError: z.string().optional(),
})
export type PricingResponseResult = z.infer<typeof PricingResponseResultSchema>

// ─── Workflow 4: Prospect Enrichment ─────────────────────────────────────────

export const ProspectEnrichmentRequestSchema = z.object({
  prospectUrl: z.string().url("prospectUrl must be a valid URL"),
})
export type ProspectEnrichmentRequest = z.infer<typeof ProspectEnrichmentRequestSchema>

export const ProspectBriefSchema = z.object({
  companyName: z.string(),
  description: z.string(),
  icpFit: ConfidenceSchema,
  keySignals: z.array(z.string()).min(1),
  outreachAngle: z.string(),
  confidence: ConfidenceSchema,
  sourceUrl: z.string(),
})
export type ProspectBrief = z.infer<typeof ProspectBriefSchema>

export const ProspectEnrichmentResultSchema = z.object({
  brief: ProspectBriefSchema,
  telegramSent: z.boolean(),
  telegramError: z.string().optional(),
  slackSent: z.boolean(),
  slackError: z.string().optional(),
})
export type ProspectEnrichmentResult = z.infer<typeof ProspectEnrichmentResultSchema>

// ─── Workflow 5: Funding Alert ────────────────────────────────────────────────

export const FundingAlertRequestSchema = z.object({
  fundingUrl: z.string().url("fundingUrl must be a valid URL"),
})
export type FundingAlertRequest = z.infer<typeof FundingAlertRequestSchema>

export const FundingBriefSchema = z.object({
  programName: z.string(),
  provider: z.string(),
  deadline: z.string(),
  isUrgent: z.boolean(),
  eligibility: z.string(),
  fitReason: z.string(),
  applyUrl: z.string(),
})
export type FundingBrief = z.infer<typeof FundingBriefSchema>

export const FundingAlertResultSchema = z.object({
  brief: FundingBriefSchema,
  telegramSent: z.boolean(),
  telegramError: z.string().optional(),
})
export type FundingAlertResult = z.infer<typeof FundingAlertResultSchema>

// ─── Workflow 6: Update Pricing ───────────────────────────────────────────────

export const UpdatePricingRequestSchema = z.object({
  newPriceCents: z.number().int().positive("newPriceCents must be a positive integer"),
  reason: z.string().min(1, "reason is required"),
  approved: z.boolean().default(false),
})
export type UpdatePricingRequest = z.infer<typeof UpdatePricingRequestSchema>

export const UpdatePricingResultSchema = z.object({
  variantId: z.string(),
  oldPriceCents: z.number(),
  newPriceCents: z.number(),
  applied: z.boolean(),
  previewOnly: z.boolean(),
  reason: z.string(),
})
export type UpdatePricingResult = z.infer<typeof UpdatePricingResultSchema>
