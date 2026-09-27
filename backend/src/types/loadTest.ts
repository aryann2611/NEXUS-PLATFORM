export interface LoadTestInput {
  url: string;
  vus: number;
  durationSeconds: number;
}

export interface LoadTestSnapshot {
  status: "running" | "done";
  elapsedMs: number;
  durationMs: number;
  requests: number;
  requestsPerSec: number;
  avgLatencyMs: number;
  p95Ms: number;
  p99Ms: number;
  errorRatePercent: number;
}
