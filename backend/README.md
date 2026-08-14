# EchoBreaker Backend

Backend for the echo-chamber-breaking app: Scan & Context, Tone Check,
Dashboard, and Practice.

## Setup

```bash
npm install
cp .env.example .env
# Fill in GEMINI_API_KEY (get one free at https://aistudio.google.com/apikey)
npm run dev
```

Server runs at `http://localhost:3000`. Check `GET /health` first.

## Scripts

- `npm run dev` — dev server with hot reload (tsx watch)
- `npm run build` — compile to `dist/`
- `npm start` — run compiled output
- `npm test` — run tests once
- `npm run test:watch` — run tests in watch mode

## Ownership map

| Area | Owner | Notes |
|---|---|---|
| `modules/scan/*` | Person A | Feature 1 — heaviest module, 4-stage pipeline |
| `modules/logging/*` | Person A | Tightly coupled to scan output |
| `core/llm/*` | Person A drives, both consume | Shared contract — agree on `llmClient.ts` shape before diverging |
| `modules/tone/*` | Person B | Feature 2 |
| `modules/dashboard/*` | Person B | Feature 3 — pure aggregation, no LLM calls |
| `modules/practice/*` | Person B | Feature 4 — `compare.service.ts` uses the shared `llmClient` |
| `core/config`, `core/middleware`, `db/*` | Person B | Infra/plumbing |

## Endpoints

**Feature 1 — Scan**
- `POST /scan/triage` — `{ text }` → `{ is_controversial, confidence }`
- `POST /scan/analyze` — `{ text, sourceUrl? }` → full analysis card
- `POST /log/scan` — persist a scan result (opt-in, on-device first)

**Feature 2 — Tone**
- `POST /tone/check` — `{ draft }` → `{ flagged, tactic, suggested_rewrite }`

**Feature 3 — Dashboard**
- `GET /dashboard/:userId/echo-chamber-meter`
- `GET /dashboard/:userId/source-diversity`
- `GET /dashboard/:userId/reflection-journal`

**Feature 4 — Practice**
- `GET /practice/:userId/topic`
- `GET /practice/exercise?type=identify_framing`
- `POST /practice/compare` — `{ topic, position, userSteelman? }`

## Next steps (not yet implemented — TODOs in code)

- Wire a real DB (`src/db/client.ts` is a stub) — Prisma or Drizzle both work well with the model shapes already defined in `db/models/`.
- Populate `CURATED_TOPIC_BANK` (practice/topic.service.ts), `EXERCISE_BANK` (practice/exercise.service.ts), and `CURATED_DIVERSE_READS` (dashboard/sourceDiversity.service.ts).
- Replace the in-memory rate limiter with a real one before production.
- Decide on auth strategy once cloud sync (opt-in) is built — `core/middleware/auth.middleware.ts` is a placeholder.
- The `@core/*`, `@modules/*`, `@db/*` path aliases are configured in `tsconfig.json` and `vitest.config.ts` — `server.ts` uses `tsconfig-paths/register` to resolve them at runtime in dev/prod. If you switch to a bundler (esbuild/swc) later, you can drop that in favor of the bundler's native alias resolution.
