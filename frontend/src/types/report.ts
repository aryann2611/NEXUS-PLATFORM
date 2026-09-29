// Mirrors backend/src/types/report.ts (GET /api/reports).
import type { Health } from "./api";

export type ReportRange = "24h" | "7d" | "30d";
export type CheckOutcome = Exclude<Health, "pending">;

export interface LatencyStats {
  avg: number | null;
  p50: number | null;
  p95: number | null;
  p99: number | null;
  min: number | null;
  max: number | null;
}

export interface ApiReport {
  id: string;
  name: string;
  baseUrl: string;
  status: Health;
  lastCheckedAt: string | null;
  checks: number;
  failedChecks: number;
  uptimePercent: number | null;
  latency: LatencyStats;
  incidents: number;
  downtimeSeconds: number;
  history: (CheckOutcome | null)[];
}

export interface ReportBucket {
  start: string;
  checks: number;
  uptimePercent: number | null;
  p50: number | null;
  p95: number | null;
}

export interface Incident {
  apiId: string;
  apiName: string;
  severity: "down" | "degraded";
  startedAt: string;
  resolvedAt: string | null;
  durationSeconds: number;
  checks: number;
  lastError: string | null;
}

export interface Report {
  range: ReportRange;
  from: string;
  to: string;
  bucketSeconds: number;
  generatedAt: string;
  degradedAfterMs: number;
  totals: {
    apis: number;
    checks: number;
    failedChecks: number;
    uptimePercent: number | null;
    latency: LatencyStats;
    incidents: number;
    downtimeSeconds: number;
  };
  buckets: ReportBucket[];
  apis: ApiReport[];
  incidents: Incident[];
}
