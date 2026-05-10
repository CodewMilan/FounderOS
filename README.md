# FounderOS

A founder intelligence platform that turns public web pages into structured business signals.

FounderOS helps startup founders and operators monitor competitors, research sales prospects, and discover relevant funding opportunities from one shared command center.

## Modules

- **Competitor Change Radar** — track pricing, hiring, product, and changelog updates across competitor pages
- **Sales Prospect Agent** — analyze a company website and generate a structured prospect brief with fit scoring
- **VC Grant Scout** — discover and rank grants, accelerators, and funding programs against your startup profile

## Getting started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Install dependencies

```bash
npm install
# or
pnpm install
```

### Run in development

```bash
npm run dev
```

The app runs on [http://localhost:3000](http://localhost:3000) and opens to the FounderOS dashboard.

**No external credentials are required.** The app ships with seeded demo data and a mock scrape provider, so every workflow is fully demonstrable out of the box.

## Environment variables

Copy `.env.example` to `.env.local` and fill in the values you need.

```bash
cp .env.example .env.local
```

| Variable | Required | Default | Description |
|---|---|---|---|
| `SCRAPE_PROVIDER` | No | `mock` | Set to `real` to enable live scraping via Jina Reader instead of the built-in mock provider |
| `JINA_API_KEY` | No | — | Optional API key for [Jina AI Reader](https://jina.ai/reader/) — increases rate limits when using the real provider |

### Demo mode (default)

When `SCRAPE_PROVIDER` is unset or set to `mock`, the app uses the built-in mock provider. All scrape operations return realistic fixture data instantly. No network calls are made. This is the correct mode for demos and development.

### Real provider mode

Set `SCRAPE_PROVIDER=real` to route all scrape operations through [Jina AI Reader](https://r.jina.ai/), which returns clean markdown for any public webpage. Basic usage is free with no API key. Set `JINA_API_KEY` to raise rate limits.

```
SCRAPE_PROVIDER=real
JINA_API_KEY=your_key_here   # optional
```

The app automatically falls back to mock mode if `SCRAPE_PROVIDER` is unset, empty, or set to any value other than `real`.

## Commands

```bash
npm run dev          # start development server
npm run build        # production build
npm run lint         # ESLint
npm run typecheck    # TypeScript type check (no emit)
npm run test         # run all tests once
npm run test:watch   # run tests in watch mode
```

## Project structure

```
app/
  (app)/
    dashboard/       # founder intelligence brief
    competitors/     # competitor change feed
    prospects/       # sales prospect analysis
    funding/         # grant and program scout
    settings/        # source management and startup profile
  api/
    sources/         # source CRUD
    ingest/          # single-source ingestion
    competitors/     # change listing and scan trigger
    prospects/       # prospect analysis and brief generation
    dashboard/       # aggregate refresh

components/app/      # product UI components
lib/
  providers/         # ScrapeProvider interface + mock + Jina Real adapter
  schemas/           # Zod schemas for all domain models
  services/          # business logic (source, ingest, competitor, prospect, funding, brief)
  seed/              # demo fixtures
  store/             # in-memory store seeded with demo data
```

## Architecture

The app follows a shared pipeline: **source → provider → raw extraction → module extractor → scored entity → UI**.

All scraping is hidden behind the `ScrapeProvider` interface (`lib/providers/types.ts`). The default mock provider serves realistic fixture content keyed on URL patterns. Swapping to the real provider requires only the `SCRAPE_PROVIDER=real` environment variable.

See [architecture.md](./architecture.md) for the full system design.
