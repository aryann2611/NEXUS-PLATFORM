import { useState } from "react";
import { mockApis } from "../mock/apis";
import type { MonitoredApi, NewApiInput } from "../types/api";

// ponytail: in-memory registry (lost on refresh); swap for GET/POST calls in services/api.ts when the backend endpoint exists.
export function useApis() {
  const [apis, setApis] = useState<MonitoredApi[]>(mockApis);

  function addApi(input: NewApiInput) {
    const api: MonitoredApi = {
      id: crypto.randomUUID(),
      name: input.name,
      baseUrl: input.baseUrl,
      health: "pending",
      endpointCount: 0,
      uptimePercent: null,
      avgLatencyMs: null,
      lastCheckedAt: null,
      latencyTrend: [],
    };
    setApis((current) => [api, ...current]);
  }

  return { apis, addApi };
}
