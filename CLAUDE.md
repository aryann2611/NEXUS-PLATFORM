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

Backend tests are integration tests against a **real MySQL database**, not mocks. The test file sets `DB_NAME=nexus_test` *before* dynamically importing the app (env is read at import time), runs migrations in `before`, and clears `projects` in `beforeEach`. DB credentials come from `backend/.env` or `DB_*` env vars. There are no frontend tests.

CI (`.github/workflows/ci.yml`) runs backend typecheck + tests against a MySQL 8 service (root, empty password) and frontend lint + build.

## Backend architecture (`backend/src`)

ESM TypeScript run with `tsx`; relative imports must use the `.js` extension (NodeNext resolution).

Request flow is layered: `routes/` (URL + JSON schema) → `controllers/` (HTTP shape) → `services/` (business rules, throws `HttpError`) → `repositories/` (SQL via the shared `mysql2` pool in `db/database.ts`). Keep SQL in repositories and HTTP concerns out of services.

Cross-cutting behaviour lives in `app.ts` (`buildApp()`, used by both `server.ts` and tests):

- **Validation is strict.** Ajv is configured with `removeAdditional: false` and `coerceTypes: false`, so unknown fields and wrong types are 400s, not silently stripped/coerced. Schemas live in `schemas/`; the custom `http-url` format is `isHttpUrl`. Schema defaults are applied before the handler, so `CreateProjectInput` types defaulted fields as required.
- **One error envelope.** Success is `{ data: … }`; every error is `{ error: { message } }`. The central error handler maps Ajv failures through `schemas/validation-message.ts` into readable messages, maps "database unreachable" MySQL error codes (`isDatabaseUnavailable`) to 503, and hides 5xx details. Services signal expected failures with `throw new HttpError(status, message)`.
- The not-found and error handlers must be registered **before** routes (Fastify plugins copy them at registration time).
- `/api/health` runs `SELECT 1`, so it reports 503 when the DB is down; the frontend's "Connected" indicator depends on this.

Database: migrations are plain `.sql` files in `db/migrations/`, applied in filename order by `db/migrator.ts` and tracked in `schema_migrations`. Add a new numbered file; never edit an applied one. The pool pins sessions to UTC. BIGINT ids are exposed to clients as strings. Duplicate project names (unique key, case-insensitive collation) surface as 409 via `isDuplicateEntry` → `null` from the repository.

CORS only allows `FRONTEND_URL` (default `http://localhost:5173`), so open the frontend on `localhost`, not `127.0.0.1`.

## Frontend architecture (`frontend/src`)

React 19 + React Router 7 + Tailwind CSS v4 (configured in `index.css` via `@theme`, no tailwind config file) + Recharts + lucide-react.

- `services/api.ts` is the only place that calls the backend (`VITE_API_URL`); it unwraps `{ data }` and turns `{ error.message }` into thrown `Error`s. Hooks (`hooks/useApis.ts`, `hooks/useHealth.ts`) own fetching state.
- Backend `Project` records are mapped to the UI's `MonitoredApi` shape in `useApis`; uptime/latency/endpoint fields are `null` until a monitoring engine exists, and the UI renders them as "—"/"Pending".
- `AppLayout` calls `useHealth()` once (polls every 30s) and passes it to pages through the router outlet context (`useOutletContext<LayoutContext>()`).
- Pages are lazy-loaded in `App.tsx`; `AppLayout` wraps the `<Outlet>` in `Suspense`.
- The header search navigates to `/apis?q=…`; the APIs page reads its filter from the URL query.
- **Real vs. sample data:** only the API registry and backend connection status are real. Dashboard metrics, Monitoring, and Recent Activity come from `src/mock/` and must stay labelled "Sample data" in the UI. Load Tests and Reports are UI shells.
- Status colours/labels are centralised in `lib/status.ts` (tone maps); use them rather than hardcoding Tailwind colour classes.

## Roadmap context

Next planned work is a health-check worker that measures registered APIs and replaces the mock data, then k6 load testing, auth, alerts and reports. When the worker fetches user-supplied `baseUrl`s, add SSRF protection (the API currently accepts internal addresses such as `169.254.169.254`).
