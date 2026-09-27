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
  p50: number;
  p95: number;
}

export interface UptimeHistoryRow {
  apiName: string;
  uptimePercent: number;
  days: Health[];
}
