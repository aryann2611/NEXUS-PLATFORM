// Sample data — replace with backend metrics once the monitoring engine exists.
import type { Endpoint } from "../types/api";
import type { DashboardSummary, LatencyPoint } from "../types/metrics";
import { secondsAgo } from "./time";

export const dashboardSummary: DashboardSummary = {
  uptimePercent: 99.97,
  requests24h: 1_284_392,
  avgLatencyMs: 142,
  errorRatePercent: 0.21,
  trends: {
    uptime: [99.91, 99.95, 99.93, 99.97, 99.96, 99.98, 99.95, 99.97],
    requests: [38, 42, 51, 47, 58, 63, 57, 66],
    latency: [151, 138, 146, 162, 139, 144, 135, 142],
    errorRate: [0.18, 0.22, 0.19, 0.31, 0.24, 0.2, 0.26, 0.21],
  },
};

export const latencyThresholdMs = 500;

// Daily traffic curve peaking mid-day, with one incident spike at 14:00.
export const latencySeries: LatencyPoint[] = Array.from({ length: 24 }, (_, hour) => {
  const load = Math.sin(((hour - 6) / 24) * Math.PI * 2);
  const spike = hour === 14;
  const p50 = Math.round(128 + 22 * load + (spike ? 64 : 0));
  return {
    time: `${String(hour).padStart(2, "0")}:00`,
    p50,
    p95: Math.round(p50 * 2.1 + (spike ? 240 : 0)),
  };
});

export const endpoints: Endpoint[] = [
  { id: "e1", method: "GET", path: "/users", health: "healthy", latencyMs: 124, errorRatePercent: 0.02, lastCheckedAt: secondsAgo(12) },
  { id: "e2", method: "GET", path: "/products", health: "healthy", latencyMs: 85, errorRatePercent: 0, lastCheckedAt: secondsAgo(8) },
  { id: "e3", method: "POST", path: "/login", health: "healthy", latencyMs: 210, errorRatePercent: 0.11, lastCheckedAt: secondsAgo(15) },
  { id: "e4", method: "POST", path: "/orders", health: "degraded", latencyMs: 842, errorRatePercent: 1.84, lastCheckedAt: secondsAgo(5) },
  { id: "e5", method: "GET", path: "/orders/:id", health: "healthy", latencyMs: 132, errorRatePercent: 0.05, lastCheckedAt: secondsAgo(21) },
];
