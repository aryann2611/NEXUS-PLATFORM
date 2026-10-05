# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

NEXUS is an API monitoring platform: a React (Vite) frontend and a Fastify + MySQL backend, kept as two independent npm packages (`frontend/`, `backend/`) with a thin root `package.json` that only proxies scripts via `npm --prefix`. Each package has its own `node_modules` and lockfile; install all three (`npm install`, `npm install --prefix frontend`, `npm install --prefix backend`).

## Commands

Run from the repo root unless noted. Requires Node 22+ and MySQL 8 (MariaDB 10.11 also works).

| Task | Command |
| --- | --- |
| Frontend + backend with hot reload | `npm run dev` (frontend :5173, backend :3000) |
| Create DB and apply migrations | `npm run db:migrate` |
| Seed sample public APIs (idempotent) | `npm run db:seed` |
| Backend tests | `npm test` |
| Frontend lint (oxlint) | `npm run lint` |
| Typecheck both packages | `npm run typecheck` |
| Production build of both | `npm run build` |

Run a single backend test by name (from `backend/`):

```bash
npx tsx --test --test-name-pattern="duplicate name" src/routes/projects.routes.test.ts
```

Backend route tests are integration tests against a **real MySQL database**, not mocks. Each DB test file sets `DB_NAME=nexus_test` (and any other env) *before* dynamically importing the app (env is read at import time), runs migrations in `before`, and clears `projects` in `beforeEach` (checks cascade). Files share that database, so `npm test` runs them with `--test-concurrency=1`; keep it that way. DB credentials come from `backend/.env` or `DB_*` env vars. Checker tests use a throwaway local HTTP server and need no DB. There are no frontend tests.

CI (`.github/workflows/ci.yml`) runs backend typecheck + tests against a MySQL 8 service (root, empty password) and frontend lint + build.

## Backend architecture (`backend/src`)

ESM TypeScript run with `tsx`; relative imports must use the `.js` extension (NodeNext resolution).

Request flow is layered: `routes/` (URL + JSON schema) → `controllers/` (HTTP shape) → `services/` (business rules, throws `HttpError`) → `repositories/` (SQL via the shared `mysql2` pool in `db/database.ts`). Keep SQL in repositories and HTTP concerns out of services.

Cross-cutting behaviour lives in `app.ts` (`buildApp()`, used by both `server.ts` and tests):

- **Validation is strict.** Ajv is configured with `removeAdditional: false` and `coerceTypes: false`, so unknown fields and wrong types are 400s, not silently stripped/coerced. Schemas live in `schemas/`; the custom `http-url` format is `isHttpUrl`. Schema defaults are applied before the handler, so `CreateProjectInput` types defaulted fields as required.
- **One error envelope.** Success is `{ data: … }`; every error is `{ error: { message } }`. The central error handler maps Ajv failures through `schemas/validation-message.ts` into readable messages, maps "database unreachable" MySQL error codes (`isDatabaseUnavailable`) to 503, and hides 5xx details. Services signal expected failures with `throw new HttpError(status, message)`.
- The not-found and error handlers must be registered **before** routes (Fastify plugins copy them at registration time).
- `/api/health` runs `SELECT 1`, so it reports 503 when the DB is down; the frontend's "Connected" indicator depends on this.

Monitoring engine (`monitoring/`): `server.ts` calls `buildApp({ monitoring: true })`, which starts `startMonitoring()` and stops it in `onClose` before the pool closes; tests build the app without it and call `runDueChecks()` directly. A tick selects due projects (`findDueProjects`: never checked, or `last_checked_at` older than `check_interval`), runs `checkUrl`, and `recordCheck` inserts the check and updates `projects.status`/`last_checked_at` in one transaction. Outcome rules and thresholds are in `checker.ts`. `checkUrl` uses `node:http(s)` rather than `fetch` so it can pass `guardedLookup` (`network-guard.ts`), which rejects private/internal addresses at connect time (DNS-rebinding safe); IP-literal URLs are checked before connecting because Node skips `lookup` for them. Don't add `::ffff:0:0/96` to the `BlockList`: Node matches it against every IPv4 address.

Alerts (`monitoring/alerts.ts`): `checkProject` calls `notifyStatusChange` right after `recordCheck`. At that point `project.status` is still the pre-check status (the row was loaded before the check), so `alertEvent(previous, outcome)` can tell edges apart: it returns `down` for any non-down → down (including `pending`), `recovered` for down → healthy/degraded, and `null` otherwise. The webhook comes from `ALERT_WEBHOOK_URL`; delivery errors are caught and logged so they can't fail the check. The URL is operator-supplied config, so it is deliberately not run through `network-guard`. Alert state is not persisted: if the process restarts mid-outage, the next check sees `project.status = down` and stays quiet (no duplicate "down").

Activity (`services/activity.service.ts`): recent checks with the previous outcome per API from a `LAG()` window over the last 7 days (MySQL 8 / MariaDB 10.2+), turned into `Went down` / `Slow response` / `Recovered` / `Health check`. Query strings arrive as strings because Ajv coercion is off, so `limit`/`changes` are validated as patterns and parsed in the controller; do the same for any new numeric or boolean query parameter.

Reports (`services/reports.service.ts`): `GET /api/reports` loads the range's checks ordered by project and time and aggregates in JS (percentiles are nearest-rank; incidents are runs of non-healthy checks). Bucket width depends on range (24h → 1h, 7d → 6h, 30d → 1d) and buckets are aligned to UTC. Aggregating in JS keeps it portable across MySQL/MariaDB but loads every check in the range; move to SQL rollups if check volume grows large.

Load tests (`services/loadTest.service.ts`, `routes/loadTests.routes.ts`): `POST /api/load-tests` spawns the `k6` binary (must be on PATH, otherwise 503) against the target URL and streams newline-delimited JSON snapshots (`application/x-ndjson`) built from k6's `--out json` file. Request caps (50 VUs, 5-60s) live in `schemas/loadTests.schema.ts` and are enforced before k6 starts, which is why `loadTests.routes.test.ts` needs neither k6 nor a database. Unlike the monitoring checker, the target is not passed through `network-guard`, so localhost targets work; keep the caps if that ever changes.

Database: migrations are plain `.sql` files in `db/migrations/`, applied in filename order by `db/migrator.ts` and tracked in `schema_migrations`. Add a new numbered file; never edit an applied one. The pool pins sessions to UTC. BIGINT ids are exposed to clients as strings. Duplicate project names (unique key, case-insensitive collation) surface as 409 via `isDuplicateEntry` → `null` from the repository.

CORS only allows `FRONTEND_URL` (default `http://localhost:5173`), so open the frontend on `localhost`, not `127.0.0.1`.

## Frontend architecture (`frontend/src`)

React 19 + React Router 7 + Tailwind CSS v4 (configured in `index.css` via `@theme`, no tailwind config file) + Recharts + lucide-react.

- `services/api.ts` is the only place that calls the backend (`VITE_API_URL`); it unwraps `{ data }` and turns `{ error.message }` into thrown `Error`s. Hooks (`hooks/useApis.ts`, `hooks/useHealth.ts`) own fetching state.
- Backend `Project` records are mapped to the UI's `MonitoredApi` shape in `useApis`; uptime/latency/endpoint fields are `null` until a monitoring engine exists, and the UI renders them as "—"/"Pending".
- `AppLayout` calls `useHealth()` once (polls every 30s) and passes it to pages through the router outlet context (`useOutletContext<LayoutContext>()`).
- Pages are lazy-loaded in `App.tsx`; `AppLayout` wraps the `<Outlet>` in `Suspense`.
- The header search navigates to `/apis?q=…`; the APIs page reads its filter from the URL query.
- **All data is real.** Dashboard, Monitoring and Reports read `GET /api/reports` (`useReport`); activity feeds read `GET /api/activity` (`useActivity`); API cards merge a 24h report into the registry (`useApis`). There is no mock data. Load Tests streams from `POST /api/load-tests` (see below); finished runs are kept in `localStorage` by `lib/loadTestHistory.ts`, not the database.
- `/api/health` also reports the monitoring engine (`running`, `lastRunAt`), which System Status shows as Running / Stalled / Off.
- `pages/Reports.tsx` keeps its state (`range`, `api`, `tab`) in the URL query, so API cards link to `/reports?api=<id>`. Frontend report types in `types/report.ts` mirror `backend/src/types/report.ts`; change both together.
- Status colours/labels are centralised in `lib/status.ts` (tone maps); use them rather than hardcoding Tailwind colour classes.

## Roadmap context

Next planned work is auth.
