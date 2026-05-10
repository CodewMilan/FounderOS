# ARCHITECTURE.md

## System overview
FounderOS is a single application with a shared ingestion and intelligence pipeline.

The app has three user-facing modules:
- Competitor Change Radar
- Sales Prospect Agent
- VC Grant Scout

All three modules share the same underlying patterns:
- source registration
- scrape/extract
- normalization
- scoring
- rendering

## High-level flow
1. User adds a source URL or company/program target.
2. A provider wrapper scrapes or retrieves the page content.
3. The system stores or passes normalized raw extraction output.
4. A module-specific extractor turns the content into structured entities/signals.
5. Scoring logic ranks significance or relevance.
6. The UI renders lists, cards, and detail views.
7. The dashboard aggregates top insights into a founder-friendly brief.

## Architecture principles
- One app, shared backbone.
- Mock-first, real-provider second.
- Keep route handlers thin.
- Put business logic in services.
- Put validation at important boundaries.
- Preserve UI by reusing existing component patterns.
- Keep the domain model centralized.

## Suggested folder layout
Adjust to the current repo structure rather than forcing a rewrite.

Example target shape:

app/
  dashboard/
  competitors/
  prospects/
  funding/
  settings/
  api/
    sources/
    ingest/
    competitors/
    prospects/
    funding/

components/
  shared/
  dashboard/
  competitors/
  prospects/
  funding/

lib/
  schemas/
  services/
  providers/
  mocks/
  utils/
  seed/

## Domain model

### Source
Represents an externally monitored URL or source target.

Fields:
- id
- type
- label
- url
- tags
- module
- createdAt
- updatedAt

### RawExtraction
Represents raw normalized content returned by the provider.

Fields:
- id
- sourceId
- url
- fetchedAt
- contentType
- title
- markdown
- json
- textPreview
- status

### Entity
A normalized structured record derived from raw extraction.

Fields:
- id
- module
- kind
- sourceId
- title
- summary
- metadata
- createdAt

### Signal
A derived actionable insight.

Fields:
- id
- module
- entityId
- signalType
- score
- severity
- summary
- rationale
- createdAt

### Brief
An aggregated human-readable summary.

Fields:
- id
- module
- title
- summary
- bullets
- relatedIds
- createdAt

## Module-specific models

### CompetitorChange
Fields:
- competitorName
- pageType
- previousSnapshot
- currentSnapshot
- changeType
- significanceScore
- summary
- suggestedAction

### ProspectRecord
Fields:
- companyName
- website
- category
- valueProp
- maturitySignals
- hiringSignals
- fitScore
- recommendedAngle

### StartupProfile
Fields:
- startupName
- sector
- geography
- stage
- teamSize
- businessModel
- fundraisingPreference

### FundingOpportunity
Fields:
- programName
- provider
- opportunityType
- geography
- sectorFocus
- deadline
- fundingAmount
- equityType
- eligibilityNotes
- fitScore
- fitReason

## Provider abstraction
Create a provider interface that hides the implementation details of scraping.

Example responsibilities:
- scrapeUrl(url)
- scrapeMany(urls)

Implementations:
- mock scrape provider
- real scrape provider adapter

The UI and services must not depend directly on provider-specific response formats.

## Service layer
Suggested services:
- sourceService
- ingestionService
- competitorService
- prospectService
- fundingService
- briefService

Responsibilities:
- validation
- normalization
- scoring
- transformation into view-ready objects

## API boundaries
Keep route handlers thin.
Route handlers should:
- validate request
- call service
- return typed response

Do not put business logic directly in routes.

## State strategy
- Use seeded data and mock mode for stability.
- Use shared mock fixtures for demo reliability.
- Avoid overcomplicated persistence early.
- In hackathon mode, local in-memory or lightweight local persistence is acceptable if needed.

## Error handling
- If provider credentials are missing, fall back to mock mode.
- Return safe typed errors.
- Never expose secrets.
- UI should render graceful empty/error states.

## Testing boundaries
Test:
- schemas
- services
- route handlers
- important rendered pages/components

Mock provider output in tests.
Do not rely on live network calls for test success.