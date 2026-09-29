import type { Health } from "./api";

export interface DashboardSummary {
  uptimePercent: number;
  requests24h: number;
  avgLatencyMs: number;
  errorRatePercent: number;
  trends: Record<"uptime" | "requests" | "latency" | "errorRate", number[]>;
}

export interface LatencyPoint {
  time: string;
  /** null where nothing was measured; the chart leaves a gap. */
  p50: number | null;
  p95: number | null;
}

export interface UptimeHistoryRow {
  apiName: string;
  uptimePercent: number;
  days: Health[];
}
