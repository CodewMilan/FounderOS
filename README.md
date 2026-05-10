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
| `SCRAPE_PROVIDER` | No | `mock` | Controls which scrape provider to use: `mock`, `anakin`, `real`, or `jina` |
| `ANAKIN_API_KEY` | When using Anakin | — | API key for [Anakin URL Scraper](https://anakin.io) — required when `SCRAPE_PROVIDER=anakin` |
| `ANAKIN_BASE_URL` | No | `https://api.anakin.io` | Override the Anakin API base URL |
| `JINA_API_KEY` | No | — | Optional API key for [Jina AI Reader](https://jina.ai/reader/) — increases rate limits when `SCRAPE_PROVIDER=real` |

### Demo mode (default)

When `SCRAPE_PROVIDER` is unset or set to `mock`, the app uses the built-in mock provider. All scrape operations return realistic fixture data instantly. No network calls are made. This is the correct mode for demos and development.

### Anakin provider (recommended for live use)

[Anakin](https://anakin.io) is a production-grade scraping API with anti-detection, proxy routing across 207 countries, intelligent caching, and optional AI JSON extraction.

Set `SCRAPE_PROVIDER=anakin` and provide your API key:

```
SCRAPE_PROVIDER=anakin
ANAKIN_API_KEY=ask_your_key_here
```

The Anakin provider uses an async job pattern: it submits a scrape job and polls every 3 seconds until the job completes (up to 90 seconds timeout). Returns clean markdown content.

### Jina provider (lightweight alternative)

Set `SCRAPE_PROVIDER=real` or `SCRAPE_PROVIDER=jina` to route scrape operations through [Jina AI Reader](https://r.jina.ai/). Basic usage is free with no API key.

```
SCRAPE_PROVIDER=real
JINA_API_KEY=your_key_here   # optional, raises rate limits
```

The app automatically falls back to mock mode if `SCRAPE_PROVIDER` is unset, empty, or set to an unrecognised value.

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
