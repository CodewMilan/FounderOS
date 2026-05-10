import type {
  Source,
  CompetitorChange,
  ProspectRecord,
  FundingOpportunity,
  StartupProfile,
  Brief,
  Signal,
} from "@/lib/schemas"

// ─── Sources ─────────────────────────────────────────────────────────────────

export const seedSources: Source[] = [
  {
    id: "src-001",
    type: "url",
    label: "Linear Pricing Page",
    url: "https://linear.app/pricing",
    tags: ["pricing", "saas"],
    module: "competitors",
    createdAt: "2026-05-01T09:00:00.000Z",
    updatedAt: "2026-05-09T08:00:00.000Z",
  },
  {
    id: "src-002",
    type: "url",
    label: "Notion Changelog",
    url: "https://www.notion.so/releases",
    tags: ["changelog", "product"],
    module: "competitors",
    createdAt: "2026-05-01T09:00:00.000Z",
    updatedAt: "2026-05-09T08:00:00.000Z",
  },
  {
    id: "src-003",
    type: "domain",
    label: "Vercel Hiring",
    url: "https://vercel.com/careers",
    tags: ["hiring"],
    module: "competitors",
    createdAt: "2026-05-02T10:00:00.000Z",
    updatedAt: "2026-05-08T07:00:00.000Z",
  },
  {
    id: "src-004",
    type: "url",
    label: "Retool Website",
    url: "https://retool.com",
    tags: ["prospect", "b2b"],
    module: "prospects",
    createdAt: "2026-05-03T11:00:00.000Z",
    updatedAt: "2026-05-09T09:00:00.000Z",
  },
  {
    id: "src-005",
    type: "url",
    label: "YC Application Page",
    url: "https://www.ycombinator.com/apply",
    tags: ["grant", "accelerator"],
    module: "funding",
    createdAt: "2026-04-20T12:00:00.000Z",
    updatedAt: "2026-05-05T10:00:00.000Z",
  },
]

// ─── Competitor Changes ───────────────────────────────────────────────────────

export const seedCompetitorChanges: CompetitorChange[] = [
  {
    id: "cc-001",
    competitorName: "Linear",
    pageType: "pricing",
    currentSnapshot: "Linear introduced a new Business plan at $15/seat/mo with SSO and audit logs included. Enterprise tier now requires annual commitment.",
    changeType: "pricing",
    significanceScore: 88,
    summary: "Linear raised Business pricing and bundled SSO — now directly competing with enterprise-tier positioning.",
    suggestedAction: "Update competitive pricing slide. Highlight your SSO is included in all plans.",
    detectedAt: "2026-05-09T07:30:00.000Z",
    sourceUrl: "https://linear.app/pricing",
  },
  {
    id: "cc-002",
    competitorName: "Notion",
    pageType: "changelog",
    currentSnapshot: "Notion AI is now available on all paid plans at no additional cost. New automations feature launched for databases.",
    changeType: "product",
    significanceScore: 74,
    summary: "Notion bundled AI into all plans and launched database automations — closing the gap with dedicated workflow tools.",
    suggestedAction: "Prepare a comparison doc on native AI depth. Emphasize your structured data model vs. Notion's block model.",
    detectedAt: "2026-05-08T14:20:00.000Z",
    sourceUrl: "https://www.notion.so/releases",
  },
  {
    id: "cc-003",
    competitorName: "Vercel",
    pageType: "hiring",
    currentSnapshot: "Vercel is hiring 12 new roles in Enterprise Sales, Solution Engineers, and a Head of Partnerships.",
    changeType: "hiring",
    significanceScore: 61,
    summary: "Vercel is scaling enterprise go-to-market aggressively — could indicate a push into mid-market.",
    suggestedAction: "Review enterprise accounts pipeline. Expect more competitive pressure in SMB deals.",
    detectedAt: "2026-05-07T10:10:00.000Z",
    sourceUrl: "https://vercel.com/careers",
  },
  {
    id: "cc-004",
    competitorName: "Figma",
    pageType: "announcement",
    currentSnapshot: "Figma announced FigJam AI for automatic diagram generation and Figma Sites for publishing web experiences directly.",
    changeType: "product",
    significanceScore: 82,
    summary: "Figma is expanding into AI-generated diagramming and web publishing — broadening scope beyond design tools.",
    suggestedAction: "Evaluate positioning: if you overlap on diagramming or publishing, address differentiation now.",
    detectedAt: "2026-05-06T16:45:00.000Z",
    sourceUrl: "https://www.figma.com/blog/",
  },
  {
    id: "cc-005",
    competitorName: "Loom",
    pageType: "pricing",
    currentSnapshot: "Loom removed the free tier; minimum plan starts at $8/user/month. Free recordings limited to 5 per user.",
    changeType: "pricing",
    significanceScore: 55,
    summary: "Loom is monetizing the free tier — may push cost-conscious users to explore alternatives.",
    suggestedAction: "Monitor migration opportunities from Loom's free user base.",
    detectedAt: "2026-05-05T09:00:00.000Z",
    sourceUrl: "https://www.loom.com/pricing",
  },
]

// ─── Prospect Records ─────────────────────────────────────────────────────────

export const seedProspects: ProspectRecord[] = [
  {
    id: "pr-001",
    companyName: "Retool",
    website: "https://retool.com",
    category: "Internal Tools / Low-code",
    valueProp: "Build internal tools in minutes using pre-built UI components and connect to any database or API.",
    maturitySignals: [
      "Series C funded ($140M raised)",
      "2000+ enterprise customers including Amazon, DoorDash",
      "Established pricing from $10–$50/user/month",
    ],
    hiringSignals: [
      "Hiring VP of Marketing",
      "3 open Product Manager roles",
      "Expanding EU sales team",
    ],
    fitScore: 87,
    recommendedAngle:
      "Lead with workflow automation ROI. Retool's users are technical PMs — focus on how your product reduces the number of Retool apps they need to maintain.",
    analyzedAt: "2026-05-09T10:00:00.000Z",
  },
  {
    id: "pr-002",
    companyName: "Coda",
    website: "https://coda.io",
    category: "Collaborative Docs / Workspace",
    valueProp: "A doc that acts like an app — combines documents, spreadsheets, and workflow automation.",
    maturitySignals: [
      "Series C $100M funding",
      "Teams at Spotify, Square, and Figma",
      "Strong product-led growth motion",
    ],
    hiringSignals: [
      "Head of Enterprise Partnerships",
      "Solutions Engineer (Enterprise)",
      "Customer Success Manager — APAC",
    ],
    fitScore: 72,
    recommendedAngle:
      "Coda's power users are building internal tools that outgrow docs. Position your product as the next step when Coda tables aren't enough.",
    analyzedAt: "2026-05-08T11:30:00.000Z",
  },
  {
    id: "pr-003",
    companyName: "Hex Technologies",
    website: "https://hex.tech",
    category: "Data / Analytics Notebooks",
    valueProp: "Collaborative data workspace that combines SQL, Python, and no-code for analytics teams.",
    maturitySignals: [
      "Series B $52M",
      "Used by Notion, Lemonade, Scale AI",
      "Strong data team adoption",
    ],
    hiringSignals: [
      "Data Infrastructure Engineer",
      "Developer Advocate",
      "Sales Engineer — Data",
    ],
    fitScore: 65,
    recommendedAngle:
      "Target Hex's non-technical stakeholders who can't access notebooks. Show how your structured output layer makes analyst insights readable to execs.",
    analyzedAt: "2026-05-07T14:00:00.000Z",
  },
  {
    id: "pr-004",
    companyName: "Raycast",
    website: "https://www.raycast.com",
    category: "Developer Productivity",
    valueProp: "Supercharged macOS launcher with built-in AI, extensions, and team collaboration.",
    maturitySignals: [
      "Seed+ stage, $30M raised",
      "Strong developer community (100k+ users)",
      "Launched Pro tier with AI features",
    ],
    hiringSignals: [
      "Growth Engineer",
      "Community Manager",
    ],
    fitScore: 58,
    recommendedAngle:
      "Raycast users are high-intent productivity optimizers. Focus on workflow depth and keyboard-first interaction patterns.",
    analyzedAt: "2026-05-06T09:15:00.000Z",
  },
  {
    id: "pr-005",
    companyName: "Linear",
    website: "https://linear.app",
    category: "Project Management / Issue Tracking",
    valueProp: "Fast, opinionated issue tracking for software teams. Built for speed and clarity.",
    maturitySignals: [
      "Series B $35M",
      "Adopted by thousands of engineering teams",
      "Strong NPS and developer love",
    ],
    hiringSignals: [
      "Enterprise Account Executive",
      "Head of Finance",
      "Infrastructure Engineer",
    ],
    fitScore: 79,
    recommendedAngle:
      "Linear is moving upmarket into enterprise. Target their VP-level buyers with ROI data on engineering velocity improvements.",
    analyzedAt: "2026-05-05T13:00:00.000Z",
  },
]

// ─── Startup Profile ──────────────────────────────────────────────────────────

export const seedStartupProfile: StartupProfile = {
  id: "sp-001",
  startupName: "FounderOS",
  sector: "Developer Tools / AI",
  geography: "Global (US-first)",
  stage: "pre-seed",
  teamSize: 2,
  businessModel: "b2b",
  fundraisingPreference: "both",
}

// ─── Funding Opportunities ────────────────────────────────────────────────────

export const seedFundingOpportunities: FundingOpportunity[] = [
  {
    id: "fo-001",
    programName: "Y Combinator",
    provider: "Y Combinator",
    opportunityType: "accelerator",
    geography: ["Global"],
    sectorFocus: ["B2B SaaS", "AI", "Dev Tools", "Fintech", "Health"],
    deadline: "2026-09-10",
    fundingAmount: "$500,000",
    equityType: "equity",
    eligibilityNotes: "Any stage, solo founders welcome. Must be early-stage. Apply via yc.com/apply.",
    fitScore: 92,
    fitReason:
      "YC is top-matched: pre-seed B2B dev tools with AI are a core YC category. 2-person team and early traction align perfectly with their intake profile.",
    applyUrl: "https://www.ycombinator.com/apply",
  },
  {
    id: "fo-002",
    programName: "Antler Residency",
    provider: "Antler",
    opportunityType: "accelerator",
    geography: ["US", "Europe", "APAC"],
    sectorFocus: ["AI", "Developer Tools", "SaaS", "Deep Tech"],
    deadline: "2026-06-01",
    fundingAmount: "$100,000–$250,000",
    equityType: "equity",
    eligibilityNotes:
      "Early-stage founders, pre-product OK. Residency-based cohort program. Equity stake taken for investment.",
    fitScore: 78,
    fitReason:
      "Good AI/dev tools match. Antler's global presence and pre-seed thesis fit perfectly. Apply before June to catch current cohort.",
    applyUrl: "https://www.antler.co/apply",
  },
  {
    id: "fo-003",
    programName: "NSF SBIR Phase I",
    provider: "National Science Foundation",
    opportunityType: "grant",
    geography: ["US"],
    sectorFocus: ["AI", "Software", "Data Analytics", "Cybersecurity"],
    deadline: "2026-06-16",
    fundingAmount: "Up to $275,000",
    equityType: "non-dilutive",
    eligibilityNotes:
      "US-based for-profit company required. Must demonstrate scientific/technical innovation with commercial potential.",
    fitScore: 71,
    fitReason:
      "Non-dilutive grant highly relevant for pre-seed AI tools. Requires strong technical narrative — FounderOS's LLM extraction approach qualifies.",
    applyUrl: "https://www.sbir.gov/apply",
  },
  {
    id: "fo-004",
    programName: "Google for Startups Accelerator: AI",
    provider: "Google",
    opportunityType: "accelerator",
    geography: ["US", "Canada"],
    sectorFocus: ["AI", "ML", "Developer Tools"],
    deadline: "2026-07-15",
    fundingAmount: "$200,000 in Cloud credits + mentorship",
    equityType: "non-dilutive",
    eligibilityNotes:
      "Must be using Google Cloud or willing to migrate. Seed–Series A stage preferred. Equity-free.",
    fitScore: 68,
    fitReason:
      "Strong AI alignment and non-dilutive structure. Cloud credit value is high for early-stage infra cost. Apply if you're open to GCP.",
    applyUrl: "https://startup.google.com/programs/accelerator/ai/",
  },
  {
    id: "fo-005",
    programName: "Founder Fellowship by Compound",
    provider: "Compound VC",
    opportunityType: "fellowship",
    geography: ["US"],
    sectorFocus: ["AI", "B2B SaaS", "Infrastructure"],
    deadline: "2026-08-01",
    fundingAmount: "$25,000 stipend + $150,000 investment",
    equityType: "equity",
    eligibilityNotes:
      "Solo or co-founder teams. Pre-seed stage. Fellowship includes structured mentorship, community access, and follow-on investment opportunity.",
    fitScore: 83,
    fitReason:
      "Compound's thesis matches well — AI-first B2B tools. 2-person founding team with a software product maps well to their fellowship track record.",
    applyUrl: "https://compound.vc/fellowship",
  },
  {
    id: "fo-006",
    programName: "Techstars NYC",
    provider: "Techstars",
    opportunityType: "accelerator",
    geography: ["US"],
    sectorFocus: ["B2B SaaS", "AI", "Fintech", "Media"],
    deadline: "2026-06-30",
    fundingAmount: "$120,000",
    equityType: "equity",
    eligibilityNotes:
      "3-month in-person accelerator in NYC. Take 6% equity. Strong alumni network and corporate partnerships.",
    fitScore: 61,
    fitReason:
      "Solid match by sector. NYC residency requirement may be limiting but the network density and corporate partnership channel is useful for B2B.",
    applyUrl: "https://www.techstars.com/accelerators/nyc",
  },
]

// ─── Briefs ───────────────────────────────────────────────────────────────────

export const seedBriefs: Brief[] = [
  {
    id: "brief-001",
    module: "dashboard",
    title: "Today's Founder Brief — May 10, 2026",
    summary:
      "Linear repriced upmarket, Notion bundled AI, and Vercel is scaling enterprise sales. Two new high-fit funding deadlines approaching. Retool and Linear are your top outreach targets this week.",
    bullets: [
      "Linear raised Business plan pricing and bundled SSO — update your competitive deck",
      "Notion AI is now free on all plans — evaluate differentiation narrative",
      "YC batch deadline is September 10 — application should start now",
      "NSF SBIR Phase I closes June 16 — highest non-dilutive opportunity in pipeline",
      "Retool (fit: 87) and Linear (fit: 79) are top prospect targets this week",
    ],
    relatedIds: ["cc-001", "cc-002", "fo-001", "fo-003", "pr-001", "pr-005"],
    createdAt: "2026-05-10T06:00:00.000Z",
  },
]

// ─── Signals ──────────────────────────────────────────────────────────────────

export const seedSignals: Signal[] = [
  {
    id: "sig-001",
    module: "competitors",
    entityId: "cc-001",
    signalType: "pricing_change",
    score: 88,
    severity: "high",
    summary: "Linear pricing repositioned — competitive threat to mid-market segment",
    rationale: "SSO bundling closes a common objection against Linear in deals where SSO was a differentiator.",
    createdAt: "2026-05-09T07:30:00.000Z",
  },
  {
    id: "sig-002",
    module: "competitors",
    entityId: "cc-002",
    signalType: "product_launch",
    score: 74,
    severity: "medium",
    summary: "Notion AI bundled — raises table stakes for workspace tools",
    rationale: "Bundled AI features compress willingness-to-pay for standalone AI add-ons.",
    createdAt: "2026-05-08T14:20:00.000Z",
  },
  {
    id: "sig-003",
    module: "prospects",
    entityId: "pr-001",
    signalType: "hiring_expansion",
    score: 87,
    severity: "medium",
    summary: "Retool expanding marketing and PM headcount — scaling growth motion",
    rationale: "VP Marketing hire signals readiness for more top-of-funnel investment. Good time to reach the buyer.",
    createdAt: "2026-05-09T10:00:00.000Z",
  },
  {
    id: "sig-004",
    module: "funding",
    entityId: "fo-003",
    signalType: "deadline_approaching",
    score: 71,
    severity: "high",
    summary: "NSF SBIR Phase I closes in 37 days",
    rationale: "Non-dilutive $275K with technical innovation requirement — strong match for AI extraction work.",
    createdAt: "2026-05-10T06:00:00.000Z",
  },
]

// ─── Dashboard summary stats ──────────────────────────────────────────────────

export const seedDashboardStats = {
  competitorChanges: seedCompetitorChanges.length,
  highSeverityChanges: seedCompetitorChanges.filter((c) => c.significanceScore >= 75).length,
  topProspects: seedProspects.filter((p) => p.fitScore >= 75).length,
  fundingOpportunities: seedFundingOpportunities.length,
  upcomingDeadlines: seedFundingOpportunities.filter((f) => {
    if (!f.deadline) return false
    const deadline = new Date(f.deadline)
    const now = new Date("2026-05-10")
    const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntil <= 60
  }).length,
}
