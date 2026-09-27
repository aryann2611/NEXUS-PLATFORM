import type { MonitoredApi } from "../types/api";

export type HealthFilter = "all" | "healthy" | "degraded" | "down";
export type ApiSort = "lastChecked" | "name" | "latency" | "uptime";

// Never-checked APIs count as the most recent so newly added ones surface first.
const checkedAt = (api: MonitoredApi) =>
  api.lastCheckedAt ? Date.parse(api.lastCheckedAt) : Number.MAX_SAFE_INTEGER;

const comparators: Record<ApiSort, (a: MonitoredApi, b: MonitoredApi) => number> = {
  lastChecked: (a, b) => checkedAt(b) - checkedAt(a),
  name: (a, b) => a.name.localeCompare(b.name),
  latency: (a, b) => (b.avgLatencyMs ?? -1) - (a.avgLatencyMs ?? -1),
  uptime: (a, b) => (a.uptimePercent ?? 101) - (b.uptimePercent ?? 101),
};

export function filterApis(apis: MonitoredApi[], query: string, status: HealthFilter, sort: ApiSort) {
  const q = query.trim().toLowerCase();
  return apis
    .filter((api) => status === "all" || api.health === status)
    .filter((api) => !q || api.name.toLowerCase().includes(q) || api.baseUrl.toLowerCase().includes(q))
    .sort(comparators[sort]);
}

export function countByHealth(apis: MonitoredApi[]): Record<HealthFilter, number> {
  const counts = { all: apis.length, healthy: 0, degraded: 0, down: 0 };
  for (const api of apis) if (api.health !== "pending") counts[api.health]++;
  return counts;
}
