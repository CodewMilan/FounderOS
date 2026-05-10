# PLAN.md

## Delivery strategy
Build FounderOS phase by phase.
Do not begin the next phase until the current phase has passed tests.

Every phase must end with:
- implementation summary
- changed files
- tests added
- acceptance check
- exact commands to run

---

## Phase 1: App shell + seeded product surface

### Goal
Turn the existing frontend template into a believable FounderOS shell using seeded data.

### Scope
- preserve current UI
- adapt navigation labels
- add Dashboard, Competitors, Prospects, Funding, Settings
- create shared schemas/types
- create realistic seed data
- render dashboard summary cards and at least one detailed module list
- no real scraping yet

### Tests
- shell renders
- navigation renders all sections
- dashboard renders seeded cards
- one module page renders seeded list data
- schemas validate good data and reject bad data

### Acceptance criteria
- app compiles
- seeded demo feels coherent
- theme remains unchanged
- tests pass

---

## Phase 2: Shared ingestion backbone

### Goal
Create the mock-first provider and ingestion architecture.

### Scope
- scrape provider interface
- mock provider implementation
- optional real provider adapter behind env vars
- source service
- ingestion service
- source management UI wiring
- source and ingest routes

### Tests
- source creation/listing works
- ingest route works with mock provider
- invalid payloads fail validation
- UI can render created source data

### Acceptance criteria
- source can be added in dev
- ingest pipeline works in mock mode
- typed responses exist
- tests pass

---

## Phase 3: Competitor Change Radar

### Goal
Ship the competitor intelligence workflow.

### Scope
- competitor extraction schema
- snapshot fixtures
- change detection logic
- change classification
- significance scoring
- competitor feed UI
- competitor detail panel

### Tests
- diffing works on fixtures
- change classification works
- significance scoring behaves predictably
- competitor feed renders signals

### Acceptance criteria
- one tracked competitor works end to end in mock mode
- change feed is visible and believable
- tests pass

---

## Phase 4: Sales Prospect Agent

### Goal
Ship company analysis and prospect brief generation.

### Scope
- prospect extraction schema
- fit scoring
- company brief generation
- prospects list UI
- prospect detail UI
- actions such as refresh/copy/generate brief

### Tests
- schema validation
- fit scoring fixtures
- brief generation output shape
- UI rendering tests

### Acceptance criteria
- one company can be analyzed in mock mode
- prospect brief is readable and useful
- tests pass

---

## Phase 5: VC Grant Scout

### Goal
Ship funding/program discovery and ranking.

### Scope
- startup profile schema
- funding opportunity schema
- matching engine
- funding list UI
- startup profile editor
- fit reasons

### Tests
- schema validation
- matching engine ranking tests
- funding UI rendering tests
- profile form state tests

### Acceptance criteria
- funding opportunities rank against a startup profile
- fit reasons are visible
- tests pass

---

## Phase 6: Unified dashboard + morning brief

### Goal
Turn the three workflows into one cohesive founder command center.

### Scope
- morning brief aggregation
- summary widgets
- cross-module story
- loading/empty/error states
- refresh scan action
- polished demo states

### Tests
- dashboard aggregation logic
- empty/loading/error states
- refresh action behavior
- combined dashboard rendering

### Acceptance criteria
- app feels like one coherent product
- dashboard tells a clear founder story
- tests pass

---

## Phase 7: Real provider + final polish

### Goal
Enable optional real provider usage and finish demo polish.

### Scope
- real provider env integration
- fallback to mock mode
- setup docs
- naming cleanup
- final responsive polish
- final README updates

### Tests
- provider fallback logic
- safe missing-env behavior
- smoke tests for key screens
- lint/typecheck/test all green

### Acceptance criteria
- app works without credentials
- app can use real provider if configured
- demo is stable
- tests pass