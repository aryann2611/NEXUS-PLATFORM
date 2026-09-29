import { env } from "../config/env.js";
import { deleteChecksBefore, recordCheck } from "../repositories/checks.repository.js";
import { findDueProjects } from "../repositories/projects.repository.js";
import type { Project } from "../types/project.js";
import { checkUrl } from "./checker.js";

const TICK_MS = 5_000;
const BATCH_SIZE = 20;
const RETENTION_SWEEP_MS = 60 * 60 * 1000;

/** What /api/health reports about the engine. */
export const monitoringState = {
  running: false,
  lastRunAt: null as Date | null,
};

interface Logger {
  info(message: string): void;
  error(error: unknown, message?: string): void;
}

export async function checkProject(project: Project): Promise<void> {
  const checkedAt = new Date();
  const result = await checkUrl(project.baseUrl, {
    timeoutMs: project.timeout * 1000,
    degradedAfterMs: env.monitoring.degradedAfterMs,
    allowPrivateTargets: env.monitoring.allowPrivateTargets,
  });
  await recordCheck({ projectId: project.id, checkedAt, ...result });
}

/** Checks every project that is due, a batch at a time. Returns how many were checked. */
export async function runDueChecks(): Promise<number> {
  const due = await findDueProjects(BATCH_SIZE);
  await Promise.all(due.map(checkProject));
  return due.length;
}

/**
 * Polls for due projects every few seconds. Each tick waits for the previous one to finish, so a
 * slow target never causes overlapping checks of the same project. `stop()` resolves once idle.
 */
export function startMonitoring(log: Logger) {
  let stopped = false;
  let timer: NodeJS.Timeout | undefined;
  let current: Promise<void> = Promise.resolve();
  let lastSweep = 0;

  async function tick() {
    try {
      if (Date.now() - lastSweep > RETENTION_SWEEP_MS) {
        lastSweep = Date.now();
        const cutoff = new Date(Date.now() - env.monitoring.retentionDays * 86_400_000);
        const removed = await deleteChecksBefore(cutoff);
        if (removed) log.info(`Removed ${removed} checks older than ${env.monitoring.retentionDays} days`);
      }
      // Drain the backlog in batches; the next tick picks up anything that becomes due later.
      while (!stopped && (await runDueChecks()) === BATCH_SIZE);
      monitoringState.lastRunAt = new Date();
    } catch (error) {
      log.error(error, "Monitoring tick failed");
    }
  }

  function schedule() {
    if (stopped) return;
    timer = setTimeout(() => {
      current = tick().finally(schedule);
    }, TICK_MS);
  }

  current = tick().finally(schedule);
  monitoringState.running = true;
  log.info("Monitoring engine started");

  return async function stop() {
    stopped = true;
    monitoringState.running = false;
    clearTimeout(timer);
    await current;
  };
}
