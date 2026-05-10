import { z } from "zod"

// ─── Core pipeline models ────────────────────────────────────────────────────

export const ModuleSchema = z.enum(["competitors", "prospects", "funding"])
export type Module = z.infer<typeof ModuleSchema>

export const SourceSchema = z.object({
  id: z.string(),
  type: z.enum(["url", "domain", "rss"]),
  label: z.string().min(1),
  url: z.string().url(),
  tags: z.array(z.string()).default([]),
  module: ModuleSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type Source = z.infer<typeof SourceSchema>

export const RawExtractionSchema = z.object({
  id: z.string(),
  sourceId: z.string(),
  url: z.string().url(),
  fetchedAt: z.string().datetime(),
  contentType: z.enum(["html", "json", "markdown", "unknown"]),
  title: z.string().optional(),
  markdown: z.string().optional(),
  json: z.record(z.unknown()).optional(),
  textPreview: z.string().optional(),
  status: z.enum(["ok", "error", "timeout", "empty"]),
})
export type RawExtraction = z.infer<typeof RawExtractionSchema>

export const EntitySchema = z.object({
  id: z.string(),
  module: ModuleSchema,
  kind: z.string(),
  sourceId: z.string(),
  title: z.string(),
  summary: z.string(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
})
export type Entity = z.infer<typeof EntitySchema>

export const SeveritySchema = z.enum(["low", "medium", "high", "critical"])
export type Severity = z.infer<typeof SeveritySchema>

export const SignalSchema = z.object({
  id: z.string(),
  module: ModuleSchema,
  entityId: z.string(),
  signalType: z.string(),
  score: z.number().min(0).max(100),
  severity: SeveritySchema,
  summary: z.string(),
  rationale: z.string(),
  createdAt: z.string().datetime(),
})
export type Signal = z.infer<typeof SignalSchema>

export const BriefSchema = z.object({
  id: z.string(),
  module: z.union([ModuleSchema, z.literal("dashboard")]),
  title: z.string(),
  summary: z.string(),
  bullets: z.array(z.string()),
  relatedIds: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
})
export type Brief = z.infer<typeof BriefSchema>

// ─── Module-specific models ──────────────────────────────────────────────────

export const ChangeTypeSchema = z.enum([
  "pricing",
  "product",
  "hiring",
  "announcement",
  "changelog",
  "other",
])
export type ChangeType = z.infer<typeof ChangeTypeSchema>

export const CompetitorChangeSchema = z.object({
  id: z.string(),
  competitorName: z.string(),
  pageType: ChangeTypeSchema,
  previousSnapshot: z.string().optional(),
  currentSnapshot: z.string(),
  changeType: ChangeTypeSchema,
  significanceScore: z.number().min(0).max(100),
  summary: z.string(),
  suggestedAction: z.string(),
  detectedAt: z.string().datetime(),
  sourceUrl: z.string().url(),
})
export type CompetitorChange = z.infer<typeof CompetitorChangeSchema>

export const ProspectRecordSchema = z.object({
  id: z.string(),
  companyName: z.string(),
  website: z.string().url(),
  category: z.string(),
  valueProp: z.string(),
  maturitySignals: z.array(z.string()),
  hiringSignals: z.array(z.string()),
  fitScore: z.number().min(0).max(100),
  recommendedAngle: z.string(),
  analyzedAt: z.string().datetime(),
})
export type ProspectRecord = z.infer<typeof ProspectRecordSchema>

export const StartupProfileSchema = z.object({
  id: z.string(),
  startupName: z.string(),
  sector: z.string(),
  geography: z.string(),
  stage: z.enum(["pre-seed", "seed", "series-a", "series-b", "growth"]),
  teamSize: z.number().int().positive(),
  businessModel: z.enum(["b2b", "b2c", "b2b2c", "marketplace", "other"]),
  fundraisingPreference: z.enum(["equity", "grant", "both", "none"]),
})
export type StartupProfile = z.infer<typeof StartupProfileSchema>

export const FundingOpportunitySchema = z.object({
  id: z.string(),
  programName: z.string(),
  provider: z.string(),
  opportunityType: z.enum(["grant", "accelerator", "fellowship", "prize", "loan"]),
  geography: z.array(z.string()),
  sectorFocus: z.array(z.string()),
  deadline: z.string().optional(),
  fundingAmount: z.string().optional(),
  equityType: z.enum(["equity", "non-dilutive", "mixed", "unknown"]),
  eligibilityNotes: z.string(),
  fitScore: z.number().min(0).max(100),
  fitReason: z.string(),
  applyUrl: z.string().url().optional(),
})
export type FundingOpportunity = z.infer<typeof FundingOpportunitySchema>

// ─── Competitor intelligence schemas ─────────────────────────────────────────

/**
 * Page category — the type of web page being monitored for a competitor.
 * Distinct from ChangeType (which classifies what changed).
 */
export const PageCategorySchema = z.enum([
  "pricing",
  "changelog",
  "careers",
  "homepage",
  "blog",
])
export type PageCategory = z.infer<typeof PageCategorySchema>

/** Structured pricing plan extracted from a pricing page. */
export const PricingPlanSchema = z.object({
  name: z.string(),
  price: z.string().optional(),
  features: z.array(z.string()),
})
export type PricingPlan = z.infer<typeof PricingPlanSchema>

/** Open role extracted from a careers page. */
export const HiringRoleSchema = z.object({
  title: z.string(),
  department: z.string().optional(),
  location: z.string().optional(),
})
export type HiringRole = z.infer<typeof HiringRoleSchema>

/** Structured extraction of a competitor page from a RawExtraction. */
export const CompetitorPageExtractionSchema = z.object({
  id: z.string(),
  sourceId: z.string(),
  competitorName: z.string(),
  pageCategory: PageCategorySchema,
  url: z.string().url(),
  rawContent: z.string(),
  normalizedContent: z.string(),
  extractedAt: z.string().datetime(),
  plans: z.array(PricingPlanSchema).optional(),
  openRoles: z.array(HiringRoleSchema).optional(),
  headline: z.string().optional(),
  keyMessages: z.array(z.string()).optional(),
})
export type CompetitorPageExtraction = z.infer<typeof CompetitorPageExtractionSchema>

/**
 * A stored page snapshot used as the baseline for change detection.
 * Keyed by sourceId — there is one current snapshot per source.
 */
export const CompetitorSnapshotSchema = z.object({
  id: z.string(),
  sourceId: z.string(),
  competitorName: z.string(),
  pageCategory: PageCategorySchema,
  url: z.string().url(),
  content: z.string(),
  capturedAt: z.string().datetime(),
})
export type CompetitorSnapshot = z.infer<typeof CompetitorSnapshotSchema>

// ─── Sales Prospect Agent schemas ────────────────────────────────────────────

/** Estimated stage of a prospect company inferred from content signals. */
export const LikelyStageSchema = z.enum([
  "early",
  "growth",
  "scale",
  "enterprise",
  "unknown",
])
export type LikelyStage = z.infer<typeof LikelyStageSchema>

/**
 * Structured extraction of a prospect company's homepage (and related pages).
 * Produced by the prospect extractor from a RawExtraction.
 */
export const CompanyExtractionSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  companyName: z.string(),
  category: z.string(),
  valueProp: z.string(),
  likelyStage: LikelyStageSchema,
  fundingSignals: z.array(z.string()),
  hiringSignals: z.array(z.string()),
  enterpriseSignals: z.array(z.string()),
  integrationClues: z.array(z.string()),
  rawContent: z.string(),
  extractedAt: z.string().datetime(),
})
export type CompanyExtraction = z.infer<typeof CompanyExtractionSchema>

/**
 * Generated outreach brief for a prospect.
 * Created on demand via the "Generate brief" action.
 */
export const ProspectBriefSchema = z.object({
  id: z.string(),
  prospectId: z.string(),
  companyName: z.string(),
  headline: z.string(),
  openingLine: z.string(),
  keyPoints: z.array(z.string()),
  callToAction: z.string(),
  generatedAt: z.string().datetime(),
})
export type ProspectBrief = z.infer<typeof ProspectBriefSchema>

// ─── Request / API boundary schemas ─────────────────────────────────────────

/**
 * Validated shape for POST /api/sources request bodies.
 * Omits server-generated fields (id, createdAt, updatedAt).
 */
export const CreateSourceSchema = z.object({
  type: z.enum(["url", "domain", "rss"]),
  label: z.string().min(1, "Label is required"),
  url: z.string().url("Must be a valid URL (include https://)"),
  tags: z.array(z.string()).optional().default([]),
  module: ModuleSchema,
})
// Use z.input<> so that optional fields with defaults (e.g. tags) are typed as
// optional in the calling code, while the output type still has them required.
export type CreateSourceInput = z.input<typeof CreateSourceSchema>

/**
 * Validated shape for POST /api/ingest request bodies.
 */
export const IngestRequestSchema = z.object({
  sourceId: z.string().min(1, "sourceId is required"),
})
export type IngestRequest = z.infer<typeof IngestRequestSchema>

/**
 * Validated shape for POST /api/prospects/analyze request bodies.
 */
export const AnalyzeProspectSchema = z.object({
  url: z.string().url("Must be a valid URL (include https://)"),
  companyName: z.string().optional(),
})
export type AnalyzeProspectInput = z.infer<typeof AnalyzeProspectSchema>
