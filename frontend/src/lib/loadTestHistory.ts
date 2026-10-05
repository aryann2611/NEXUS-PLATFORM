import type { LoadTestInput, LoadTestRun, LoadTestSnapshot } from "../types/loadTest";

const STORAGE_KEY = "nexus.loadTestHistory";
const MAX_RUNS = 20;

export function getLoadTestHistory(): LoadTestRun[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LoadTestRun[]) : [];
  } catch {
    return [];
  }
}

export function saveLoadTestRun(input: LoadTestInput, snapshot: LoadTestSnapshot): LoadTestRun[] {
  const run: LoadTestRun = {
    id: crypto.randomUUID(),
    completedAt: new Date().toISOString(),
    url: input.url,
    vus: input.vus,
    durationSeconds: input.durationSeconds,
    durationMs: snapshot.durationMs,
    requests: snapshot.requests,
    requestsPerSec: snapshot.requestsPerSec,
    avgLatencyMs: snapshot.avgLatencyMs,
    p95Ms: snapshot.p95Ms,
    p99Ms: snapshot.p99Ms,
    errorRatePercent: snapshot.errorRatePercent,
  };
  const history = [run, ...getLoadTestHistory()].slice(0, MAX_RUNS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // storage unavailable (private browsing, quota) — history just won't persist
  }
  return history;
}
