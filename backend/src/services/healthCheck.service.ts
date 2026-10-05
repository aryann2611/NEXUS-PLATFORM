import { insertCheck, findProjectIdsDueForCheck } from "../repositories/checks.repository.js";
import { findProjectsByIds, updateProjectStatus, type ProjectRecord } from "../repositories/projects.repository.js";
import type { ProjectStatus } from "../types/project.js";

export const DEGRADED_LATENCY_MS = 1_000;
const POLL_INTERVAL_MS = 15_000;
const CHECK_CONCURRENCY = 5;

async function checkOne(project: ProjectRecord): Promise<void> {
  const started = Date.now();
  let status: ProjectStatus;
  let latencyMs: number | null;

  try {
    const res = await fetch(project.baseUrl, { signal: AbortSignal.timeout(project.timeout * 1000) });
    latencyMs = Date.now() - started;
    status = !res.ok ? "down" : latencyMs > DEGRADED_LATENCY_MS ? "degraded" : "healthy";
  } catch {
    latencyMs = null;
    status = "down";
  }

  await Promise.all([insertCheck({ projectId: project.id, status, latencyMs }), updateProjectStatus(project.id, status)]);
}

async function runDueChecks(): Promise<void> {
  const dueIds = await findProjectIdsDueForCheck();
  if (dueIds.length === 0) return;

  const projects = await findProjectsByIds(dueIds);
  for (let i = 0; i < projects.length; i += CHECK_CONCURRENCY) {
    await Promise.all(projects.slice(i, i + CHECK_CONCURRENCY).map((project) => checkOne(project)));
  }
}

/** Polls every 15s for projects whose check_interval has elapsed; each check is independent, so one failure can't block the rest. */
export function startHealthCheckScheduler(log: (error: unknown) => void = console.error): () => void {
  const timer = setInterval(() => {
    runDueChecks().catch(log);
  }, POLL_INTERVAL_MS);
  return () => clearInterval(timer);
}
