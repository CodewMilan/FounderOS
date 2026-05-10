# FounderOS

**Founder intelligence, built for speed.**

FounderOS turns public web pages into structured startup signals. Monitor competitors, research sales prospects, and discover relevant funding opportunities — all from one shared command center.

> Works out of the box. No external credentials required.

---

## Overview

FounderOS is a single Next.js application with three interconnected intelligence workflows:

| Module | What it does |
|---|---|
| **Competitor Change Radar** | Tracks pricing, hiring, changelog, and product changes across competitor pages — scored and summarized |
| **Sales Prospect Agent** | Analyzes a company website and produces a structured brief with fit score and recommended outreach angle |
| **VC Grant Scout** | Finds and ranks grants, accelerators, and programs matched against your startup profile |

All three modules share a unified data backbone: one source model, one ingestion pipeline, one dashboard.

---

## Screenshots

The app ships with seeded demo data so every workflow is fully demonstrable the moment you run it.

| Dashboard | Competitors | Prospects | Funding |
|---|---|---|---|
| Daily brief | Change feed | Prospect briefs | Matched programs |

---

## Tech stack

- **Framework** — [Next.js 14](https://nextjs.org) (App Router)
- **Language** — TypeScript 5
- **UI** — [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) (Radix primitives)
- **Validation** — [Zod](https://zod.dev)
- **Testing** — [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com)
- **Scraping** — pluggable provider interface (mock / [Anakin](https://anakin.ai) / [Jina AI](https://jina.ai/reader/))

---

## Getting started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Install

```bash
git clone https://github.com/your-org/founder-os.git
cd founder-os
npm install        # or: pnpm install
```

### Configure environment

```bash
cp .env.example .env.local
```

The defaults work without any changes. The app starts in mock mode and serves realistic seeded data with zero network calls.

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The landing page links to the app at `/app`.

---

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `SCRAPE_PROVIDER` | No | `mock` | Scrape backend: `mock`, `anakin`, `real`, or `jina` |
| `ANAKIN_API_KEY` | When using Anakin | — | API key for [Anakin URL Scraper](https://anakin.ai) |
| `ANAKIN_BASE_URL` | No | `https://api.anakin.io` | Override the Anakin API base URL |
| `JINA_API_KEY` | No | — | Optional key for [Jina AI Reader](https://jina.ai/reader/) — raises rate limits |
| `OPENAI_API_KEY` | No | — | OpenAI key for brief generation |
| `OPENAI_MODEL` | No | `gpt-4.1-mini` | OpenAI model to use |
| `TELEGRAM_BOT_TOKEN` | No | — | Telegram bot for workflow notifications |
| `TELEGRAM_CHAT_ID` | No | — | Telegram chat to receive alerts |
| `SLACK_WEBHOOK_URL` | No | — | Slack webhook for competitor alerts |
| `USER_SITE_URL` | No | — | Your product URL — used for feature-gap comparisons |

### Scrape providers

**Mock (default)** — No credentials needed. Returns realistic fixture data keyed to URL patterns. Best for development and demos.

**Anakin** — Production-grade scraping with anti-detection, proxy routing across 207 countries, and intelligent caching. Uses an async job pattern with 3-second polling up to a 90-second timeout.

```
SCRAPE_PROVIDER=anakin
ANAKIN_API_KEY=your_key_here
```

**Jina AI** — Lightweight alternative. Basic usage is free with no key.

```
SCRAPE_PROVIDER=real
JINA_API_KEY=your_key_here   # optional
```

The app automatically falls back to mock mode if `SCRAPE_PROVIDER` is unset or unrecognised.

---

## Commands

```bash
npm run dev          # start development server (http://localhost:3000)
npm run build        # production build
npm run start        # start production server
npm run lint         # ESLint
npm run typecheck    # TypeScript type check (no emit)
npm run test         # run all tests once
npm run test:watch   # run tests in watch mode
```

---

## Project structure

```
app/
  (app)/
    dashboard/       # daily founder brief
    competitors/     # competitor change feed and detail
    prospects/       # prospect analysis and briefs
    funding/         # grant and program scout
    settings/        # source management and startup profile
  api/
    sources/         # source CRUD
    ingest/          # single-source ingestion trigger
    competitors/     # change listing and scan
    prospects/       # prospect analysis and brief generation
    dashboard/       # aggregate refresh

components/
  app/               # product UI components (nav, cards, panels, tables)
  ui/                # shadcn/ui primitives

lib/
  providers/         # ScrapeProvider interface + mock + Jina + Anakin adapters
  schemas/           # Zod schemas for all domain models
  services/          # business logic (source, ingest, competitor, prospect, funding, brief)
  seed/              # demo fixtures
  store/             # in-memory store pre-seeded with demo data
  workflows/         # multi-step approval-gated workflows

__tests__/           # Vitest test suite (schemas, services, routes, UI)
```

---

## Architecture

All scraping is hidden behind a `ScrapeProvider` interface (`lib/providers/types.ts`). Switching from mock to a live provider requires only a single environment variable — no code changes.

The shared pipeline for every module:

```
Source URL
  → ScrapeProvider.scrapeUrl()
  → RawExtraction (normalized markdown + metadata)
  → Module extractor (competitor / prospect / funding)
  → Scored entity + signal
  → Dashboard brief + module detail view
```

Key design principles:
- **Mock-first** — the app is fully usable without credentials
- **Thin routes** — API handlers validate and delegate; business logic lives in services
- **Zod at the boundary** — all incoming data and inter-module contracts are validated
- **One shared domain model** — `Source`, `RawExtraction`, `Entity`, `Signal`, `Brief`

See [`architecture.md`](./architecture.md) for the full system design and domain model.

---

## Contributing

Contributions are welcome. Please read [`CONTRIBUTING.md`](./CONTRIBUTING.md) before opening a pull request.

Quick checklist before submitting:

```bash
npm run lint
npm run typecheck
npm run test
```

All three must pass with no errors.

---

## License

MIT — see [`LICENSE`](./LICENSE) for details.
