import type { CheckOutcome } from "./check.js";
import type { ProjectStatus } from "./project.js";

export type ReportRange = "24h" | "7d" | "30d";

/** Latency figures in ms; null when there were no responses to measure. */
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
  status: ProjectStatus;
  lastCheckedAt: string | null;
  checks: number;
  failedChecks: number;
  /** Share of checks that got a non-5xx response (degraded counts as up). Null with no checks. */
  uptimePercent: number | null;
  latency: LatencyStats;
  incidents: number;
  downtimeSeconds: number;
  /** Worst outcome per bucket, aligned with `buckets`; null where the API had no checks. */
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
  /** When the next healthy check came in; null while it's still ongoing. */
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
  /** Responses slower than this count as degraded. */
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
