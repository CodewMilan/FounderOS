import { z } from "zod"

// ─── Inbound request ──────────────────────────────────────────────────────────

export const WorkflowTypeSchema = z.enum(["feature_gap", "pricing_response", "auto"])
export type WorkflowType = z.infer<typeof WorkflowTypeSchema>

export const CompetitorAlertRequestSchema = z.object({
  competitorUrl: z.string().url("competitorUrl must be a valid URL (include https://)"),
  userSiteUrl: z.string().url("userSiteUrl must be a valid URL").optional(),
  workflowType: WorkflowTypeSchema.default("auto"),
})
export type CompetitorAlertRequest = z.infer<typeof CompetitorAlertRequestSchema>

// ─── OpenAI analysis output ───────────────────────────────────────────────────

export const DetectedFeatureSchema = z.object({
  name: z.string(),
  description: z.string(),
  pageContext: z.string().optional(),
})
export type DetectedFeature = z.infer<typeof DetectedFeatureSchema>

export const DetectedPricingChangeSchema = z.object({
  summary: z.string(),
  oldSignal: z.string().optional(),
  newSignal: z.string(),
})
export type DetectedPricingChange = z.infer<typeof DetectedPricingChangeSchema>

export const AnalysisResultSchema = z.object({
  competitorName: z.string(),
  detectedFeatures: z.array(DetectedFeatureSchema),
  detectedPricingChanges: z.array(DetectedPricingChangeSchema),
  recommendedWorkflowType: z.enum(["feature_gap", "pricing_response"]),
})
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>

// ─── Workflow result ──────────────────────────────────────────────────────────

export const CompetitorAlertResultSchema = z.object({
  workflowType: z.enum(["feature_gap", "pricing_response"]),
  competitorName: z.string(),
  brief: z.string(),
  telegramSent: z.boolean(),
  telegramError: z.string().optional(),
})
export type CompetitorAlertResult = z.infer<typeof CompetitorAlertResultSchema>
