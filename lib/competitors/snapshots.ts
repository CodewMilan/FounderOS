import type { CompetitorSnapshot } from "@/lib/schemas"

/**
 * Historical baseline snapshots for competitor sources.
 *
 * These represent the "before" state of each monitored page. They are
 * deliberately different from what the mock provider returns today so that
 * change detection fires on every demo scan.
 *
 * In production, snapshots would be captured automatically on first ingest
 * and updated after each scan cycle.
 */
export const seedSnapshots: CompetitorSnapshot[] = [
  {
    id: "snap-001",
    sourceId: "src-001",
    competitorName: "Linear",
    pageCategory: "pricing",
    url: "https://linear.app/pricing",
    capturedAt: "2026-04-25T08:00:00.000Z",
    content: `# Pricing

## Free
$0/month — Up to 5 seats, 1,000 issues, basic integrations.

## Pro
$8/seat/month — Unlimited issues, all integrations, priority support.

## Business
$12/seat/month — Advanced permissions, admin controls, 90-day analytics history.

## Enterprise
Custom pricing — SAML SSO, audit logs, dedicated SLA, on-premise option.

> All plans include a 14-day free trial. No credit card required.`,
  },

  {
    id: "snap-002",
    sourceId: "src-002",
    competitorName: "Notion",
    pageCategory: "changelog",
    url: "https://www.notion.so/releases",
    capturedAt: "2026-04-20T10:00:00.000Z",
    content: `# What's New

## April 2026

### Notion AI (Apr 15) — Add-on at $10/member/month
Notion AI is now available as a paid add-on. Use AI to summarize pages, generate content, and answer questions from your workspace.

### Database improvements (Apr 5)
New formula fields and improved filtering options.

## March 2026

### New API endpoints (Mar 20)
Public REST API for page and database management. Full documentation available.

### Bug fixes (Mar 8)
Fixed sorting issues and edge cases in export.`,
  },

  {
    id: "snap-003",
    sourceId: "src-003",
    competitorName: "Vercel",
    pageCategory: "careers",
    url: "https://vercel.com/careers",
    capturedAt: "2026-04-18T09:00:00.000Z",
    content: `# Join Our Team

We're building the future of web development.

## Open Roles

**Engineering**
- Senior Backend Engineer (Remote)
- Site Reliability Engineer (Remote)
- Frontend Engineer (Remote)

**Product**
- Product Manager, DX
- Product Designer

We offer competitive salary, equity, and remote flexibility.`,
  },
]

// ─── Fixture pairs used directly in unit tests ────────────────────────────────

export const pricingBeforeFixture = `# Pricing

## Starter
$0/month — Up to 3 seats, core features only.

## Pro
$8/seat/month — Unlimited projects, all integrations.

## Business
$12/seat/month — Admin controls, permissions, 90-day history.

## Enterprise
Custom — SAML SSO in Enterprise only.`

export const pricingAfterFixture = `# Pricing

## Free
$0/month — Up to 5 seats. Core features only.

## Pro
$12/seat/month — Unlimited projects, integrations, priority support.

## Business
$20/seat/month — SSO, audit logs, SLA, dedicated CSM.

## Enterprise
Custom pricing — On-premise option, custom SLA, volume discounts.

> All plans include a 14-day free trial. No credit card required.`

export const hiringBeforeFixture = `# Join Our Team

## Open Roles

**Engineering**
- Backend Engineer
- Frontend Engineer`

export const hiringAfterFixture = `# Join Our Team

We're hiring across all departments.

## Open Roles

**Engineering**
- Senior Backend Engineer (Remote)
- Staff Infrastructure Engineer (Remote)
- Frontend Engineer, Growth (Remote)

**Go-to-Market**
- Enterprise Account Executive (New York)
- Head of Partnerships (San Francisco)
- Solutions Engineer (London)

**Product**
- Senior Product Manager, Platform
- Product Designer, Mobile

We offer competitive compensation, equity, and full remote flexibility.`

export const changelogBeforeFixture = `# What's New

## April 2026

### Performance improvements (Apr 5)
Faster load times in dashboard views.`

export const changelogAfterFixture = `# What's New

## May 2026

### AI Automations (May 8)
We shipped AI-powered automations for all paid plans. Automate repetitive tasks with natural language triggers.

### Performance improvements (May 5)
50% faster load times across all dashboard views.

## April 2026

### New API endpoints (Apr 22)
Public REST API for source and entity management. See docs.`
