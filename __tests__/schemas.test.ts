import { describe, it, expect } from "vitest"
import {
  SourceSchema,
  RawExtractionSchema,
  EntitySchema,
  SignalSchema,
  BriefSchema,
  CompetitorChangeSchema,
  ProspectRecordSchema,
  StartupProfileSchema,
  FundingOpportunitySchema,
  LikelyStageSchema,
  CompanyExtractionSchema,
  ProspectBriefSchema,
  AnalyzeProspectSchema,
} from "@/lib/schemas"

// ─── Source ───────────────────────────────────────────────────────────────────

describe("SourceSchema", () => {
  const valid = {
    id: "src-001",
    type: "url" as const,
    label: "Linear Pricing",
    url: "https://linear.app/pricing",
    tags: ["pricing"],
    module: "competitors" as const,
    createdAt: "2026-05-01T09:00:00.000Z",
    updatedAt: "2026-05-09T08:00:00.000Z",
  }

  it("accepts a valid source", () => {
    expect(() => SourceSchema.parse(valid)).not.toThrow()
  })

  it("rejects missing label", () => {
    const { label, ...rest } = valid
    expect(() => SourceSchema.parse(rest)).toThrow()
  })

  it("rejects invalid url", () => {
    expect(() => SourceSchema.parse({ ...valid, url: "not-a-url" })).toThrow()
  })

  it("rejects unknown module", () => {
    expect(() => SourceSchema.parse({ ...valid, module: "unknown" })).toThrow()
  })

  it("defaults tags to empty array when omitted", () => {
    const { tags, ...rest } = valid
    const result = SourceSchema.parse(rest)
    expect(result.tags).toEqual([])
  })
})

// ─── RawExtraction ────────────────────────────────────────────────────────────

describe("RawExtractionSchema", () => {
  const valid = {
    id: "re-001",
    sourceId: "src-001",
    url: "https://linear.app/pricing",
    fetchedAt: "2026-05-09T08:00:00.000Z",
    contentType: "html" as const,
    status: "ok" as const,
  }

  it("accepts a minimal valid extraction", () => {
    expect(() => RawExtractionSchema.parse(valid)).not.toThrow()
  })

  it("accepts optional fields", () => {
    expect(() =>
      RawExtractionSchema.parse({
        ...valid,
        title: "Pricing",
        markdown: "# Pricing",
        textPreview: "Pricing page",
      })
    ).not.toThrow()
  })

  it("rejects unknown status", () => {
    expect(() => RawExtractionSchema.parse({ ...valid, status: "pending" })).toThrow()
  })
})

// ─── Signal ───────────────────────────────────────────────────────────────────

describe("SignalSchema", () => {
  const valid = {
    id: "sig-001",
    module: "competitors" as const,
    entityId: "e-001",
    signalType: "pricing_change",
    score: 88,
    severity: "high" as const,
    summary: "Pricing repositioned",
    rationale: "SSO bundling closes objection",
    createdAt: "2026-05-09T07:30:00.000Z",
  }

  it("accepts a valid signal", () => {
    expect(() => SignalSchema.parse(valid)).not.toThrow()
  })

  it("rejects score > 100", () => {
    expect(() => SignalSchema.parse({ ...valid, score: 101 })).toThrow()
  })

  it("rejects score < 0", () => {
    expect(() => SignalSchema.parse({ ...valid, score: -1 })).toThrow()
  })

  it("rejects unknown severity", () => {
    expect(() => SignalSchema.parse({ ...valid, severity: "extreme" })).toThrow()
  })
})

// ─── Brief ────────────────────────────────────────────────────────────────────

describe("BriefSchema", () => {
  const valid = {
    id: "brief-001",
    module: "dashboard" as const,
    title: "Today's brief",
    summary: "Summary text",
    bullets: ["bullet 1", "bullet 2"],
    createdAt: "2026-05-10T06:00:00.000Z",
  }

  it("accepts a valid brief", () => {
    expect(() => BriefSchema.parse(valid)).not.toThrow()
  })

  it("defaults relatedIds to empty array", () => {
    const result = BriefSchema.parse(valid)
    expect(result.relatedIds).toEqual([])
  })

  it("accepts module-level briefs", () => {
    expect(() => BriefSchema.parse({ ...valid, module: "competitors" })).not.toThrow()
  })
})

// ─── CompetitorChange ─────────────────────────────────────────────────────────

describe("CompetitorChangeSchema", () => {
  const valid = {
    id: "cc-001",
    competitorName: "Linear",
    pageType: "pricing" as const,
    currentSnapshot: "New pricing page content",
    changeType: "pricing" as const,
    significanceScore: 88,
    summary: "Pricing changed",
    suggestedAction: "Update deck",
    detectedAt: "2026-05-09T07:30:00.000Z",
    sourceUrl: "https://linear.app/pricing",
  }

  it("accepts a valid competitor change", () => {
    expect(() => CompetitorChangeSchema.parse(valid)).not.toThrow()
  })

  it("rejects significanceScore > 100", () => {
    expect(() => CompetitorChangeSchema.parse({ ...valid, significanceScore: 150 })).toThrow()
  })

  it("rejects invalid sourceUrl", () => {
    expect(() => CompetitorChangeSchema.parse({ ...valid, sourceUrl: "not-valid" })).toThrow()
  })
})

// ─── ProspectRecord ───────────────────────────────────────────────────────────

describe("ProspectRecordSchema", () => {
  const valid = {
    id: "pr-001",
    companyName: "Retool",
    website: "https://retool.com",
    category: "Internal Tools",
    valueProp: "Build internal tools fast",
    maturitySignals: ["Series C funded"],
    hiringSignals: ["Hiring VP Marketing"],
    fitScore: 87,
    recommendedAngle: "Focus on ROI",
    analyzedAt: "2026-05-09T10:00:00.000Z",
  }

  it("accepts a valid prospect record", () => {
    expect(() => ProspectRecordSchema.parse(valid)).not.toThrow()
  })

  it("rejects fitScore > 100", () => {
    expect(() => ProspectRecordSchema.parse({ ...valid, fitScore: 101 })).toThrow()
  })

  it("rejects missing companyName", () => {
    const { companyName, ...rest } = valid
    expect(() => ProspectRecordSchema.parse(rest)).toThrow()
  })
})

// ─── StartupProfile ───────────────────────────────────────────────────────────

describe("StartupProfileSchema", () => {
  const valid = {
    id: "sp-001",
    startupName: "FounderOS",
    sector: "Developer Tools / AI",
    geography: "Global",
    stage: "pre-seed" as const,
    teamSize: 2,
    businessModel: "b2b" as const,
    fundraisingPreference: "both" as const,
  }

  it("accepts a valid startup profile", () => {
    expect(() => StartupProfileSchema.parse(valid)).not.toThrow()
  })

  it("rejects unknown stage", () => {
    expect(() => StartupProfileSchema.parse({ ...valid, stage: "ipo" })).toThrow()
  })

  it("rejects non-integer teamSize", () => {
    expect(() => StartupProfileSchema.parse({ ...valid, teamSize: 2.5 })).toThrow()
  })

  it("rejects zero teamSize", () => {
    expect(() => StartupProfileSchema.parse({ ...valid, teamSize: 0 })).toThrow()
  })
})

// ─── FundingOpportunity ───────────────────────────────────────────────────────

describe("FundingOpportunitySchema", () => {
  const valid = {
    id: "fo-001",
    programName: "Y Combinator",
    provider: "Y Combinator",
    opportunityType: "accelerator" as const,
    geography: ["Global"],
    sectorFocus: ["B2B SaaS"],
    equityType: "equity" as const,
    eligibilityNotes: "Any stage",
    fitScore: 92,
    fitReason: "Perfect match",
  }

  it("accepts a valid funding opportunity", () => {
    expect(() => FundingOpportunitySchema.parse(valid)).not.toThrow()
  })

  it("accepts optional deadline and fundingAmount", () => {
    expect(() =>
      FundingOpportunitySchema.parse({
        ...valid,
        deadline: "2026-09-10",
        fundingAmount: "$500,000",
      })
    ).not.toThrow()
  })

  it("rejects unknown opportunityType", () => {
    expect(() => FundingOpportunitySchema.parse({ ...valid, opportunityType: "vc" })).toThrow()
  })

  it("rejects fitScore out of range", () => {
    expect(() => FundingOpportunitySchema.parse({ ...valid, fitScore: -5 })).toThrow()
  })
})

// ─── Entity ───────────────────────────────────────────────────────────────────

describe("EntitySchema", () => {
  const valid = {
    id: "ent-001",
    module: "competitors" as const,
    kind: "competitor_change",
    sourceId: "src-001",
    title: "Linear pricing update",
    summary: "Pricing repositioned",
    createdAt: "2026-05-09T08:00:00.000Z",
  }

  it("accepts a valid entity", () => {
    expect(() => EntitySchema.parse(valid)).not.toThrow()
  })

  it("defaults metadata to empty object", () => {
    const result = EntitySchema.parse(valid)
    expect(result.metadata).toEqual({})
  })
})

// ─── Phase 4: LikelyStageSchema ───────────────────────────────────────────────

describe("LikelyStageSchema", () => {
  const valid = ["early", "growth", "scale", "enterprise", "unknown"] as const

  it.each(valid)("accepts '%s' as a valid stage", (stage) => {
    expect(() => LikelyStageSchema.parse(stage)).not.toThrow()
  })

  it("rejects an unknown stage value", () => {
    expect(() => LikelyStageSchema.parse("late")).toThrow()
    expect(() => LikelyStageSchema.parse("seed")).toThrow()
    expect(() => LikelyStageSchema.parse("")).toThrow()
    expect(() => LikelyStageSchema.parse(null)).toThrow()
  })
})

// ─── Phase 4: CompanyExtractionSchema ────────────────────────────────────────

describe("CompanyExtractionSchema", () => {
  const valid = {
    id: "cex-001",
    url: "https://retool.com",
    companyName: "Retool",
    category: "No-code / Low-code",
    valueProp: "Build internal tools in minutes.",
    likelyStage: "scale" as const,
    fundingSignals: ["Series C ($140M raised)"],
    hiringSignals: ["VP of Marketing"],
    enterpriseSignals: ["SOC 2 certified", "SAML / SSO support"],
    integrationClues: ["Slack", "GitHub"],
    rawContent: "# Retool\n\nBuild internal tools in minutes.",
    extractedAt: "2026-05-09T10:00:00.000Z",
  }

  it("accepts a fully valid CompanyExtraction", () => {
    expect(() => CompanyExtractionSchema.parse(valid)).not.toThrow()
  })

  it("accepts empty signal arrays", () => {
    const minimal = {
      ...valid,
      fundingSignals: [],
      hiringSignals: [],
      enterpriseSignals: [],
      integrationClues: [],
    }
    expect(() => CompanyExtractionSchema.parse(minimal)).not.toThrow()
  })

  it("rejects missing id", () => {
    const { id, ...rest } = valid
    expect(() => CompanyExtractionSchema.parse(rest)).toThrow()
  })

  it("rejects invalid url", () => {
    expect(() => CompanyExtractionSchema.parse({ ...valid, url: "not-a-url" })).toThrow()
  })

  it("rejects invalid likelyStage", () => {
    expect(() => CompanyExtractionSchema.parse({ ...valid, likelyStage: "unicorn" })).toThrow()
  })

  it("rejects invalid extractedAt datetime", () => {
    expect(() =>
      CompanyExtractionSchema.parse({ ...valid, extractedAt: "2026-05-09" })
    ).toThrow()
  })

  it("rejects non-array hiringSignals", () => {
    expect(() =>
      CompanyExtractionSchema.parse({ ...valid, hiringSignals: "VP of Engineering" })
    ).toThrow()
  })

  it("rejects missing companyName", () => {
    const { companyName, ...rest } = valid
    expect(() => CompanyExtractionSchema.parse(rest)).toThrow()
  })
})

// ─── Phase 4: ProspectBriefSchema ─────────────────────────────────────────────

describe("ProspectBriefSchema", () => {
  const valid = {
    id: "brief-001",
    prospectId: "pr-001",
    companyName: "Retool",
    headline: "Retool — 88% fit · No-code / Low-code",
    openingLine: "I noticed Retool is expanding its engineering team.",
    keyPoints: ["88% fit score.", "SOC 2 certified.", "Hiring VP of Marketing."],
    callToAction: "Request a 20-minute call with the Head of Engineering.",
    generatedAt: "2026-05-09T12:00:00.000Z",
  }

  it("accepts a fully valid ProspectBrief", () => {
    expect(() => ProspectBriefSchema.parse(valid)).not.toThrow()
  })

  it("accepts an empty keyPoints array", () => {
    expect(() => ProspectBriefSchema.parse({ ...valid, keyPoints: [] })).not.toThrow()
  })

  it("rejects missing id", () => {
    const { id, ...rest } = valid
    expect(() => ProspectBriefSchema.parse(rest)).toThrow()
  })

  it("rejects missing prospectId", () => {
    const { prospectId, ...rest } = valid
    expect(() => ProspectBriefSchema.parse(rest)).toThrow()
  })

  it("rejects missing headline", () => {
    const { headline, ...rest } = valid
    expect(() => ProspectBriefSchema.parse(rest)).toThrow()
  })

  it("rejects missing openingLine", () => {
    const { openingLine, ...rest } = valid
    expect(() => ProspectBriefSchema.parse(rest)).toThrow()
  })

  it("rejects missing callToAction", () => {
    const { callToAction, ...rest } = valid
    expect(() => ProspectBriefSchema.parse(rest)).toThrow()
  })

  it("rejects non-array keyPoints", () => {
    expect(() =>
      ProspectBriefSchema.parse({ ...valid, keyPoints: "some point" })
    ).toThrow()
  })

  it("rejects invalid generatedAt datetime", () => {
    expect(() =>
      ProspectBriefSchema.parse({ ...valid, generatedAt: "not-a-date" })
    ).toThrow()
  })
})

// ─── Phase 4: AnalyzeProspectSchema ──────────────────────────────────────────

describe("AnalyzeProspectSchema", () => {
  it("accepts a valid URL with no companyName", () => {
    expect(() =>
      AnalyzeProspectSchema.parse({ url: "https://retool.com" })
    ).not.toThrow()
  })

  it("accepts a valid URL with an optional companyName", () => {
    expect(() =>
      AnalyzeProspectSchema.parse({ url: "https://retool.com", companyName: "Retool" })
    ).not.toThrow()
  })

  it("rejects an invalid URL", () => {
    expect(() =>
      AnalyzeProspectSchema.parse({ url: "not-a-url" })
    ).toThrow()
  })

  it("rejects a missing URL field", () => {
    expect(() => AnalyzeProspectSchema.parse({})).toThrow()
  })

  it("rejects a null URL", () => {
    expect(() => AnalyzeProspectSchema.parse({ url: null })).toThrow()
  })

  it("companyName is optional — parses without it", () => {
    const result = AnalyzeProspectSchema.parse({ url: "https://retool.com" })
    expect(result.companyName).toBeUndefined()
  })

  it("companyName is preserved when provided", () => {
    const result = AnalyzeProspectSchema.parse({
      url: "https://retool.com",
      companyName: "Retool Inc.",
    })
    expect(result.companyName).toBe("Retool Inc.")
  })

  it("rejects extra fields as unknown — parses cleanly (passthrough)", () => {
    // Zod strips unknown fields by default in strict mode — it does NOT throw
    // For non-strict schemas, unknown fields are stripped silently
    expect(() =>
      AnalyzeProspectSchema.parse({
        url: "https://retool.com",
        unknownField: "should be ignored",
      })
    ).not.toThrow()
  })
})
