import { useEffect, useState } from "react";
import { createProject, getProjects, getReport } from "../services/api";
import type { MonitoredApi, NewApiInput, Project } from "../types/api";
import type { ApiReport } from "../types/report";

export type LoadState = "loading" | "ready" | "error";

// The registry comes from MySQL; uptime and latency come from the last 24h of monitoring checks.
function toMonitoredApi(project: Project, metrics?: ApiReport): MonitoredApi {
  return {
    id: project.id,
    name: project.name,
    baseUrl: project.baseUrl,
    health: project.status,
    endpointCount: null,
    uptimePercent: metrics?.uptimePercent ?? null,
    avgLatencyMs: metrics?.latency.avg ?? null,
    lastCheckedAt: project.lastCheckedAt,
    latencyTrend: [],
  };
}

/** `withMetrics: false` skips the 24h report when only the registry is needed (e.g. a picker). */
export function useApis({ withMetrics = true } = {}) {
  const [apis, setApis] = useState<MonitoredApi[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    // Metrics are a bonus: if the report fails, the registry still loads.
    Promise.all([getProjects(), withMetrics ? getReport("24h").catch(() => null) : null])
      .then(([projects, report]) => {
        if (!active) return;
        const metrics = new Map(report?.apis.map((api) => [api.id, api]));
        setApis(projects.map((project) => toMonitoredApi(project, metrics.get(project.id))));
        setState("ready");
      })
      .catch((e: unknown) => {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Couldn't load APIs.");
        setState("error");
      });
    return () => {
      active = false;
    };
  }, [attempt, withMetrics]);

  function reload() {
    setState("loading");
    setAttempt((n) => n + 1);
  }

  async function addApi(input: NewApiInput) {
    const project = await createProject(input);
    setApis((current) => [toMonitoredApi(project), ...current]);
  }

  return { apis, state, error, reload, addApi };
}
