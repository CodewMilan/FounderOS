import type { ScrapeProvider } from "./types"
import type { RawExtraction } from "@/lib/schemas"

// ─── URL-pattern fixture helpers ─────────────────────────────────────────────

function makeId(): string {
  return `re-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function nowIso(): string {
  return new Date().toISOString()
}

interface Fixture {
  title: string
  markdown: string
}

function pricingFixture(url: string): Fixture {
  const domain = new URL(url).hostname.replace("www.", "")
  return {
    title: `${domain} — Pricing`,
    markdown: `# Pricing\n\n## Free\n$0/month — Up to 5 seats. Core features only.\n\n## Pro\n$12/seat/month — Unlimited projects, integrations, priority support.\n\n## Business\n$20/seat/month — SSO, audit logs, SLA, dedicated CSM.\n\n## Enterprise\nCustom pricing — On-premise option, custom SLA, volume discounts.\n\n> All plans include a 14-day free trial. No credit card required.`,
  }
}

function changelogFixture(url: string): Fixture {
  const domain = new URL(url).hostname.replace("www.", "")
  return {
    title: `${domain} — Changelog`,
    markdown: `# What's New\n\n## May 2026\n\n### AI Automations (May 8)\nWe shipped AI-powered automations for all paid plans. Automate repetitive tasks with natural language triggers.\n\n### Performance improvements (May 5)\n50% faster load times across all dashboard views.\n\n## April 2026\n\n### New API endpoints (Apr 22)\nPublic REST API for source and entity management. See docs.\n\n### Bug fixes (Apr 15)\nFixed sorting in table views and edge cases in CSV export.`,
  }
}

function hiringFixture(url: string): Fixture {
  const domain = new URL(url).hostname.replace("www.", "")
  return {
    title: `${domain} — Careers`,
    markdown: `# Join Our Team\n\nWe're hiring across all departments.\n\n## Open Roles\n\n**Engineering**\n- Senior Backend Engineer (Remote)\n- Staff Infrastructure Engineer (Remote)\n- Frontend Engineer, Growth (Remote)\n\n**Go-to-Market**\n- Enterprise Account Executive (New York)\n- Head of Partnerships (San Francisco)\n- Solutions Engineer (London)\n\n**Product**\n- Senior Product Manager, Platform\n- Product Designer, Mobile\n\nWe offer competitive compensation, equity, and full remote flexibility.`,
  }
}

function announcementFixture(url: string): Fixture {
  const domain = new URL(url).hostname.replace("www.", "")
  return {
    title: `${domain} — Blog`,
    markdown: `# Announcing Our Series B: $52M to Accelerate the Future of Work\n\nToday we're thrilled to announce we've raised a $52M Series B led by Accel, with participation from existing investors.\n\nThis funding will go toward:\n- Doubling our engineering team\n- Expanding into EMEA and APAC\n- Launching enterprise-grade compliance features\n\nWe've grown 4x in the last 12 months, crossing 100,000 active teams.\n\nRead the full post on our blog.`,
  }
}

function productFixture(url: string): Fixture {
  const domain = new URL(url).hostname.replace("www.", "")
  return {
    title: `${domain} — Product`,
    markdown: `# The Smartest Way to Manage Your Workflow\n\n${domain} helps modern teams move faster. Used by 50,000+ teams at companies like Stripe, Figma, and Vercel.\n\n## Core features\n- Real-time collaboration\n- AI-powered suggestions\n- Native integrations with 200+ tools\n- Built-in analytics and reporting\n- Enterprise-grade security\n\n## What teams say\n\n> "We cut meeting time by 40% in the first month." — Head of Product, Acme Corp\n\n> "The best tool we've adopted in years." — CTO, Scale AI`,
  }
}

function genericFixture(url: string): Fixture {
  const domain = new URL(url).hostname.replace("www.", "")
  return {
    title: `${domain}`,
    markdown: `# ${domain}\n\nWelcome to ${domain}.\n\nThis company builds tools for modern teams. Founded in 2021, they have raised $30M in total funding and serve 20,000+ customers globally.\n\n## About\nWe believe work should be simple, fast, and human. Our platform helps teams collaborate without friction.\n\n## Contact\nhello@${domain}`,
  }
}

function selectFixture(url: string): Fixture {
  try {
    const u = url.toLowerCase()
    if (u.includes("pricing")) return pricingFixture(url)
    if (u.includes("changelog") || u.includes("release")) return changelogFixture(url)
    if (u.includes("career") || u.includes("job") || u.includes("hiring")) return hiringFixture(url)
    if (u.includes("blog") || u.includes("announcement") || u.includes("news")) return announcementFixture(url)
    if (u.includes("product") || u.includes("feature")) return productFixture(url)
    return genericFixture(url)
  } catch {
    return { title: "Unknown page", markdown: "Unable to determine page type from URL." }
  }
}

// ─── Mock provider implementation ────────────────────────────────────────────

export class MockScrapeProvider implements ScrapeProvider {
  readonly name = "mock"

  async scrapeUrl(url: string): Promise<RawExtraction> {
    // Small artificial delay so the UI can show a loading state in demos.
    await new Promise((r) => setTimeout(r, 120))

    const fixture = selectFixture(url)
    const preview = fixture.markdown.slice(0, 300).replace(/\n+/g, " ")

    return {
      id: makeId(),
      sourceId: "",          // caller fills this in
      url,
      fetchedAt: nowIso(),
      contentType: "markdown",
      title: fixture.title,
      markdown: fixture.markdown,
      textPreview: preview,
      status: "ok",
    }
  }

  async scrapeMany(urls: string[]): Promise<RawExtraction[]> {
    return Promise.all(urls.map((url) => this.scrapeUrl(url)))
  }
}
