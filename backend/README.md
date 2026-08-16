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

## Data

Everything is in Supabase Postgres — `scan_logs` (the only personal table),
plus the curated `topics`, `exercises`, and `diverse_reads`. Row level
security is on for all four with no policies, which blocks the PostgREST path
entirely: the anon key ships inside the app, so without that anyone holding
the APK could read every user's scan history straight from the REST endpoint.
The backend connects as the owning role and bypasses RLS, and it is the only
thing that should touch these tables.

The practice streak, bookmarks, and display name never reach the server —
they live in the app's own storage, which is what the app promises the user.
Nothing else is kept on the device: scan history is read back from
`scan_logs` rather than mirrored locally, so the history lists and the Echo
Chamber Meter can never disagree about what has been scanned.

## Endpoints

**Feature 1 — Scan**
- `POST /scan/triage` — `{ text?, imageBase64?, imageMimeType? }` → `{ is_controversial, confidence }`
- `POST /scan/analyze` — `{ text?, imageBase64?, imageMimeType?, sourceUrl? }` → full analysis card
- `POST /log/scan` — persist a scan result (opt-in)
- `GET /log/scans?limit=20` — the caller's own recent scans, newest first

> `text` OR `imageBase64` is required (one of them) — a body with neither, or
> with only whitespace text, gets a `400 invalid_request`. When `imageBase64`
> is set, Gemini reads the screenshot and runs the analysis on the visible
> text in a single vision call — no separate OCR step.
>
> `imageBase64` accepts either raw base64 or a full `data:image/png;base64,...`
> URI; the prefix and any line breaks are stripped server-side. `imageMimeType`
> must be one of `image/png` (default), `image/jpeg`, or `image/webp`.
> Request bodies are capped at 25mb to leave room for screenshots.

**Feature 2 — Tone**
- `POST /tone/check` — `{ draft }` → `{ flagged, tactic, suggested_rewrite }`

**Feature 3 — Dashboard** (all require auth)
- `GET /dashboard/echo-chamber-meter`
- `GET /dashboard/source-diversity`
- `GET /dashboard/reflection-journal`

**Feature 4 — Practice**
- `GET /practice/topic` (requires auth — reads the user's scan history)
- `GET /practice/exercise?type=identify_framing`
- `POST /practice/compare` — `{ topic, position, userSteelman? }`

> Routes marked "requires auth" take `Authorization: Bearer <supabase-jwt>`
> and derive the user from the verified token — there is **no `:userId` path
> param**, so a client can never read someone else's data by changing a URL.
> `POST /log/scan` works the same way.

## Next steps (not yet implemented — TODOs in code)

- Populate `CURATED_TOPIC_BANK` (practice/topic.service.ts), `EXERCISE_BANK` (practice/exercise.service.ts), and `CURATED_DIVERSE_READS` (dashboard/sourceDiversity.service.ts).
- Replace the in-memory rate limiter with a real one before production.
- Set `SUPABASE_URL` — `core/middleware/auth.middleware.ts` verifies Supabase JWTs against the project's JWKS, and every authed route returns 500 without it.
- The `@core/*`, `@modules/*`, `@db/*` path aliases are configured in `tsconfig.json` and `vitest.config.ts` — `server.ts` uses `tsconfig-paths/register` to resolve them at runtime in dev/prod. If you switch to a bundler (esbuild/swc) later, you can drop that in favor of the bundler's native alias resolution.
