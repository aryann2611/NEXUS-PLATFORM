# NEXUS

Real-Time API Intelligence Platform — "See what your APIs feel like under pressure."

## Current Architecture

```
React
  ↓
Fastify
  ↓
/api/health
```

## Tech Stack

**Frontend:** React, Vite, TypeScript, React Router, Tailwind CSS, Lucide React, Recharts, Geist / Geist Mono

**Backend:** Node.js, Fastify, TypeScript, @fastify/cors, dotenv

## Local Setup

```bash
git clone <repo-url>
cd nexus-platform
npm install
npm install --prefix frontend
npm install --prefix backend

cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env

npm run dev
```

This starts both the frontend (http://localhost:5173) and backend (http://localhost:3000).

Run them individually with `npm run dev:frontend` / `npm run dev:backend`.

## Current Status

Phase 1 foundation plus the initial NEXUS interface:

| Area | State |
| --- | --- |
| Backend `GET /api/health` | Real |
| Backend connection status (sidebar, dashboard, settings) | Real — checked on load and every 30s |
| Dashboard, APIs, Monitoring metrics | Sample data from `frontend/src/mock/`, labelled "Sample data" in the UI |
| Add API drawer | Works locally; added APIs live in memory until an API-registration endpoint exists |
| Load Tests, Reports | UI foundation only |

Monitoring engine, load testing (k6), persistence, authentication, alerts and reports are planned for later phases.
