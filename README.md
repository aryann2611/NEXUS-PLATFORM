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

## API

All responses are JSON. Success: `{ "data": … }`. Errors: `{ "error": { "message": "…" } }`.

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/api/health` | `{ status, service, timestamp }` |
| `GET` | `/api/projects` | All registered APIs, newest first |
| `GET` | `/api/projects/:id` | One API, or `404` |
| `POST` | `/api/projects` | Register an API → `201` |

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

## Current Status

| Area | State |
| --- | --- |
| API registry (APIs page, Add API drawer) | Real — stored in MySQL |
| Backend connection status (sidebar, dashboard, settings) | Real — checked on load and every 30s |
| Uptime, latency, endpoint counts per API | Not measured yet — shown as `—` / "Pending" |
| Dashboard metrics, Monitoring page, Recent Activity | Sample data from `frontend/src/mock/`, labelled "Sample data" |
| Load Tests, Reports | UI foundation only |

Next up: a health-check worker that measures registered APIs and replaces the sample data. Load testing (k6), authentication, alerts and reports come after that.
