# AGENTS.md

## Required docs
Before making changes, read and follow:
- SPEC.md
- ARCHITECTURE.md
- PLAN.md
- UI_GUARDRAILS.md

If implementation changes scope, architecture, or UI constraints, update the relevant docs.

## Project overview
This repository contains an existing frontend template that must be reused to build a hackathon MVP called FounderOS.

FounderOS is a founder intelligence platform with three workflows:
1. Competitor Change Radar
2. Sales Prospect Agent
3. VC Grant Scout

The product is a single app with shared architecture, not three disconnected mini-apps.

## Non-negotiable rules
- Preserve the existing UI template exactly.
- Do not change colors.
- Do not change typography choices.
- Do not change spacing language.
- Do not redesign the layout system.
- Do not introduce a new visual identity.
- Do not replace the current component style with generic AI SaaS styling.
- You may change text, labels, content, information architecture, and data wiring.
- You may add new components only if they visually match the current template exactly.
- Always extend the existing UI patterns before importing outside components.

## Build strategy
- Work phase by phase.
- Do not start the next phase until the current phase is complete and tested.
- Prefer simple, typed, modular code over clever abstractions.
- Keep the app hackathon-friendly and demo-ready.
- Use mock-first development so the app works without external API credentials.
- Put all external scraping/provider logic behind an adapter interface.

## Product surfaces
The app should contain:
- Dashboard
- Competitors
- Prospects
- Funding
- Settings / Sources

## Shared architecture rules
Use one shared pipeline:
Source input
→ scrape provider
→ normalized raw extraction
→ module-specific parser/extractor
→ scored entities/signals
→ dashboard and detail views

## Data modeling rules
Use shared typed schemas for:
- Source
- RawExtraction
- Entity
- Signal
- Brief
- StartupProfile
- FundingOpportunity
- ProspectRecord
- CompetitorChange

Use Zod for runtime validation where appropriate.

## Backend rules
- Wrap scraping behind a provider interface.
- Implement a mock provider first.
- Add a real provider adapter only behind environment variables.
- Never hardcode secrets.
- Always support fallback mock mode.
- Keep route logic thin; use service modules.

## UI rules
- Reuse existing cards, tables, dialogs, sidebars, tabs, filters, and layout shells.
- If a new component is added, make it indistinguishable from existing components.
- Do not restyle global theme files unless absolutely required.
- If a file controls the current design system, avoid editing it unless necessary for compatibility.
- Prefer composition over visual reinvention.

## Testing rules
Every phase must include tests before it is considered complete.

Minimum testing expectations:
- schema validation tests
- service tests
- route tests for added endpoints
- component/page rendering tests for new UI surfaces

Mock all external provider calls.

## Completion rules
Before claiming a phase is complete, run:
- lint
- typecheck
- tests

At the end of each phase, report:
- what was built
- files changed
- tests added
- known gaps
- exact commands to verify

## Preferred commands
Adjust to the repo package manager if needed. Prefer the existing package manager already used in the repo.

Typical commands:
- npm run dev
- npm run lint
- npm run typecheck
- npm run test

## Documentation maintenance
If the implementation changes the architecture, scope, data models, or workflow, update:
- ARCHITECTURE.md
- SPEC.md
- PLAN.md
- UI_GUARDRAILS.md

Keep documentation in sync with code.