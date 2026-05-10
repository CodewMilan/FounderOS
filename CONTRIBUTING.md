# Contributing to FounderOS

Thanks for taking the time to contribute. Here's everything you need to get started.

---

## Ground rules

- Keep changes focused. One feature or fix per pull request.
- Do not change the visual design system (colors, typography, spacing). See [`UI_GUARDRAILS.md`](./UI_GUARDRAILS.md).
- All new code should be typed. Avoid `any`.
- New services and schemas must have corresponding tests.
- Keep route handlers thin — put business logic in `lib/services/`.

---

## Development setup

```bash
git clone https://github.com/your-org/founder-os.git
cd founder-os
npm install
cp .env.example .env.local
npm run dev
```

No external credentials are required. The app runs in mock mode by default.

---

## Before you open a PR

Run all three checks locally and make sure they pass:

```bash
npm run lint        # ESLint
npm run typecheck   # TypeScript (no emit)
npm run test        # Vitest
```

---

## Adding a new scrape provider

1. Create a new file in `lib/providers/` that implements the `ScrapeProvider` interface from `lib/providers/types.ts`.
2. Register it in `lib/providers/index.ts` behind an environment variable guard.
3. Add a mock fixture in `lib/mocks/` so tests never call the network.
4. Document the new variable in `.env.example` and `README.md`.

---

## Adding a new workflow or module

1. Define Zod schemas in `lib/schemas/`.
2. Write the service in `lib/services/`.
3. Add a thin API route in `app/api/`.
4. Build the UI surface in `components/app/` — match existing component patterns exactly.
5. Seed demo data in `lib/seed/`.
6. Write tests covering schemas, services, and routes.

---

## Reporting bugs

Open an issue with:
- Steps to reproduce
- Expected vs actual behavior
- Environment (Node version, OS, `SCRAPE_PROVIDER` value)

---

## Code style

The project uses ESLint with the Next.js config. Let the linter guide you — do not disable rules without a documented reason.
