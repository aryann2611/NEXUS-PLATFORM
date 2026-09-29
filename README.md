# NEXUS

Real-Time API Intelligence Platform — "See what your APIs feel like under pressure."

## Architecture

```
React (Vite)
  ↓  HTTP / JSON
Fastify  →  route → controller → service → repository
  ↓
MySQL
```

## Tech Stack

**Frontend:** React, Vite, TypeScript, React Router, Tailwind CSS, Lucide React, Recharts, Geist / Geist Mono

**Backend:** Node.js, Fastify (JSON Schema validation), TypeScript, MySQL (`mysql2`), @fastify/cors, dotenv

**Tests:** Node's built-in test runner (`node:test`) via `tsx`, running against a real MySQL database

## Local Setup

Requires Node.js 22+ and a running MySQL 8 server.

```bash
git clone <repo-url>
cd nexus-platform
npm install
npm install --prefix frontend
npm install --prefix backend

cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env   # then set your MySQL credentials

npm run db:migrate   # creates the `nexus` database and tables
npm run db:seed      # optional: registers a few real public APIs (GitHub, Open-Meteo, …)
npm run dev
```

This starts the frontend (http://localhost:5173) and backend (http://localhost:3000).
Run them individually with `npm run dev:frontend` / `npm run dev:backend`.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Frontend and backend with hot reload |
| `npm run db:migrate` | Creates the database if needed and applies pending `backend/src/db/migrations/*.sql` files (tracked in `schema_migrations`) |
| `npm run db:seed` | Registers real, key-free public APIs; safe to run repeatedly |
| `npm test` | Backend API tests against the `nexus_test` database (created automatically) |
| `npm run lint` / `npm run typecheck` | Frontend lint; type-check backend and frontend (CI runs these on every pull request) |

## API

All responses are JSON. Success: `{ "data": … }`. Errors: `{ "error": { "message": "…" } }`.

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/api/health` | `{ status, service, timestamp }`; `503` when the database is unreachable |
| `GET` | `/api/projects` | All registered APIs, newest first |
| `GET` | `/api/projects/:id` | One API, or `404` |
| `POST` | `/api/projects` | Register an API → `201` |
| `GET` | `/api/reports?range=24h\|7d\|30d&projectId=` | Uptime, latency percentiles, incidents and time buckets (default `7d`, all APIs) |

`POST /api/projects` body:

```json
{
  "name": "My E-Commerce API",
  "baseUrl": "https://api.example.com",
  "description": "E-commerce backend",
  "tags": ["ecommerce", "production"],
  "checkInterval": 60,
  "timeout": 10
}
```

`name` and `baseUrl` are required; `baseUrl` must be an http(s) URL. `checkInterval` is 30–3600 seconds (default 60), `timeout` 1–30 seconds (default 10). Unknown fields are rejected (`400`), duplicate names return `409`, and an unreachable database returns `503`. New APIs always start as `"status": "pending"`.

## Monitoring and reports

The backend runs a monitoring engine in-process. Every few seconds it finds APIs whose `checkInterval` has elapsed, sends one `GET` to each `baseUrl`, stores the result in the `checks` table and updates the API's status:

| Result | Outcome |
| --- | --- |
| No response, timeout, or a `5xx` | `down` |
| Responded slower than `MONITOR_DEGRADED_AFTER_MS` (default 1000) | `degraded` |
| Anything else (including `3xx`/`4xx`; redirects are not followed) | `healthy` |

Uptime is the share of checks that weren't `down`. An incident is a run of consecutive non-healthy checks, ending at the next healthy check; downtime counts only `down` incidents. Checks older than `MONITOR_RETENTION_DAYS` (default 90) are deleted.

Because the engine fetches user-supplied URLs, it refuses loopback, private, link-local (cloud metadata) and other internal addresses, checked on the address actually connected to. Set `MONITOR_ALLOW_PRIVATE_TARGETS=true` to monitor APIs running on your own machine or network. Set `MONITORING_ENABLED=false` to run the API without the engine.

The Reports page shows the results for the last 24 hours, 7 days or 30 days, for all APIs or one: summary figures, response-time and availability trends, per-API latency percentiles, per-API uptime history and an incident log, with CSV and JSON export.

## Current Status

| Area | State |
| --- | --- |
| API registry (APIs page, Add API drawer) | Real — stored in MySQL |
| Backend connection status (sidebar, dashboard, settings) | Real — checked on load and every 30s |
| Health checks, uptime, latency, incidents | Real — measured by the monitoring engine, shown on the APIs and Reports pages |
| Endpoint counts per API | Not measured yet — shown as `—` |
| Dashboard metrics, Monitoring page, Recent Activity | Sample data from `frontend/src/mock/`, labelled "Sample data" |
| Load Tests | UI foundation only |

Next up: replace the Dashboard and Monitoring sample data with monitoring results, then load testing (k6), authentication and alerts.
