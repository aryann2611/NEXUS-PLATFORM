import type { ProjectStatus } from "./project.js";

export interface LatencyPoint {
  /** ISO start of the hour (UTC); the client formats it in local time. */
  time: string;
  p50: number | null;
  p95: number | null;
}

export interface UptimeHistoryRow {
  apiName: string;
  uptimePercent: number | null;
  /** Oldest day first; "pending" when the API had no checks that day. */
  days: ProjectStatus[];
}

export interface ActivityEvent {
  id: string;
  at: string;
  apiName: string;
  event: string;
  health: ProjectStatus;
  details: string;
}

export interface Overview {
  summary: {
    uptimePercent: number | null;
    checks24h: number;
    avgLatencyMs: number | null;
    errorRatePercent: number | null;
    trends: Record<"uptime" | "checks" | "latency" | "errorRate", number[]>;
  };
  latencyThresholdMs: number;
  latencySeries: LatencyPoint[];
  uptimeWindowDays: number;
  uptimeHistory: UptimeHistoryRow[];
  activity: ActivityEvent[];
}
