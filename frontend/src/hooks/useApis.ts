import { useEffect, useState } from "react";
import { createProject, getProjects } from "../services/api";
import type { MonitoredApi, NewApiInput, Project } from "../types/api";

export type LoadState = "loading" | "ready" | "error";

// The registry and health-check metrics both come from MySQL; endpointCount needs per-endpoint
// discovery, which the health checker (base-URL pings only) doesn't do yet.
function toMonitoredApi(project: Project): MonitoredApi {
  return {
    id: project.id,
    name: project.name,
    baseUrl: project.baseUrl,
    health: project.status,
    endpointCount: null,
    uptimePercent: project.uptimePercent,
    avgLatencyMs: project.avgLatencyMs,
    lastCheckedAt: project.lastCheckedAt,
    latencyTrend: project.latencyTrend,
  };
}

export function useApis() {
  const [apis, setApis] = useState<MonitoredApi[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    getProjects()
      .then((projects) => {
        if (!active) return;
        setApis(projects.map(toMonitoredApi));
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
  }, [attempt]);

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
