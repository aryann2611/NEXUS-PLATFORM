import { env } from "../config/env.js";
import { HttpError } from "../errors.js";
import { findChecksSince } from "../repositories/checks.repository.js";
import { findAllProjects, findProjectById } from "../repositories/projects.repository.js";
import type { CheckOutcome, CheckRecord } from "../types/check.js";
import type { Project } from "../types/project.js";
import type { ApiReport, Incident, LatencyStats, Report, ReportBucket, ReportRange } from "../types/report.js";

const HOUR = 3_600;
// Bucket width and count per range: 24 hourly, 28 six-hourly, 30 daily buckets.
const ranges: Record<ReportRange, { bucketSeconds: number; buckets: number }> = {
  "24h": { bucketSeconds: HOUR, buckets: 24 },
  "7d": { bucketSeconds: 6 * HOUR, buckets: 28 },
  "30d": { bucketSeconds: 24 * HOUR, buckets: 30 },
};

const severity: Record<CheckOutcome, number> = { healthy: 0, degraded: 1, down: 2 };
const worse = (a: CheckOutcome | null, b: CheckOutcome) => (a && severity[a] >= severity[b] ? a : b);

/** Nearest-rank percentile of an ascending array. */
export function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.min(sorted.length - 1, Math.max(0, index))];
}

function latencyStats(values: number[]): LatencyStats {
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((total, value) => total + value, 0);
  return {
    avg: sorted.length ? Math.round(sum / sorted.length) : null,
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
    min: sorted[0] ?? null,
    max: sorted.at(-1) ?? null,
  };
}

const uptime = (checks: number, failed: number) =>
  checks ? Math.round(((checks - failed) / checks) * 10_000) / 100 : null;

/**
 * Groups consecutive non-healthy checks into incidents. A run ends at the next healthy check; its
 * severity is the worst outcome seen. `checks` must be one project's checks in time order.
 */
export function findIncidents(project: Pick<Project, "id" | "name">, checks: CheckRecord[], now: Date): Incident[] {
  const incidents: Incident[] = [];
  let open: { started: Date; severity: "down" | "degraded"; checks: number; lastError: string | null } | null = null;

  const close = (resolvedAt: Date | null) => {
    if (!open) return;
    const end = resolvedAt ?? now;
    incidents.push({
      apiId: project.id,
      apiName: project.name,
      severity: open.severity,
      startedAt: open.started.toISOString(),
      resolvedAt: resolvedAt?.toISOString() ?? null,
      durationSeconds: Math.max(0, Math.round((end.getTime() - open.started.getTime()) / 1000)),
      checks: open.checks,
      lastError: open.lastError,
    });
    open = null;
  };

  for (const check of checks) {
    if (check.outcome === "healthy") {
      close(check.checkedAt);
      continue;
    }
    open ??= { started: check.checkedAt, severity: check.outcome, checks: 0, lastError: null };
    open.checks++;
    if (check.outcome === "down") open.severity = "down";
    if (check.error) open.lastError = check.error;
  }
  close(null);
  return incidents;
}

export async function buildReport(range: ReportRange, projectId?: string, now = new Date()): Promise<Report> {
  const { bucketSeconds, buckets: bucketCount } = ranges[range];
  const bucketMs = bucketSeconds * 1000;
  // Buckets end at the current (partial) bucket so labels land on whole hours/days in UTC.
  const firstBucket = Math.floor(now.getTime() / bucketMs) * bucketMs - (bucketCount - 1) * bucketMs;
  const from = new Date(firstBucket);

  let projects: Project[];
  if (projectId) {
    const project = await findProjectById(projectId);
    if (!project) throw new HttpError(404, "Project not found");
    projects = [project];
  } else {
    projects = await findAllProjects();
  }
  const checks = await findChecksSince(from, projectId);

  const byProject = new Map<string, CheckRecord[]>();
  for (const check of checks) {
    const list = byProject.get(check.projectId);
    if (list) list.push(check);
    else byProject.set(check.projectId, [check]);
  }

  const bucketIndex = (date: Date) => Math.min(bucketCount - 1, Math.floor((date.getTime() - firstBucket) / bucketMs));
  const bucketLatencies: number[][] = Array.from({ length: bucketCount }, () => []);
  const bucketTotals = Array.from({ length: bucketCount }, () => ({ checks: 0, failed: 0 }));

  const incidents: Incident[] = [];
  const apis: ApiReport[] = projects.map((project) => {
    const own = byProject.get(project.id) ?? [];
    const history: (CheckOutcome | null)[] = Array(bucketCount).fill(null);
    const latencies: number[] = [];
    let failed = 0;

    for (const check of own) {
      const i = bucketIndex(check.checkedAt);
      history[i] = worse(history[i], check.outcome);
      bucketTotals[i].checks++;
      if (check.outcome === "down") {
        failed++;
        bucketTotals[i].failed++;
      }
      if (check.latencyMs !== null) {
        latencies.push(check.latencyMs);
        bucketLatencies[i].push(check.latencyMs);
      }
    }

    const ownIncidents = findIncidents(project, own, now);
    incidents.push(...ownIncidents);
    return {
      id: project.id,
      name: project.name,
      baseUrl: project.baseUrl,
      status: project.status,
      lastCheckedAt: project.lastCheckedAt,
      checks: own.length,
      failedChecks: failed,
      uptimePercent: uptime(own.length, failed),
      latency: latencyStats(latencies),
      incidents: ownIncidents.length,
      downtimeSeconds: sumDowntime(ownIncidents),
      history,
    };
  });

  const buckets: ReportBucket[] = bucketTotals.map((totals, i) => {
    const sorted = bucketLatencies[i].sort((a, b) => a - b);
    return {
      start: new Date(firstBucket + i * bucketMs).toISOString(),
      checks: totals.checks,
      uptimePercent: uptime(totals.checks, totals.failed),
      p50: percentile(sorted, 50),
      p95: percentile(sorted, 95),
    };
  });

  const totalFailed = apis.reduce((total, api) => total + api.failedChecks, 0);
  incidents.sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  return {
    range,
    from: from.toISOString(),
    to: now.toISOString(),
    bucketSeconds,
    generatedAt: now.toISOString(),
    degradedAfterMs: env.monitoring.degradedAfterMs,
    totals: {
      apis: projects.length,
      checks: checks.length,
      failedChecks: totalFailed,
      uptimePercent: uptime(checks.length, totalFailed),
      latency: latencyStats(checks.flatMap((check) => (check.latencyMs === null ? [] : [check.latencyMs]))),
      incidents: incidents.length,
      downtimeSeconds: sumDowntime(incidents),
    },
    buckets,
    apis,
    incidents,
  };
}

// Downtime counts only "down" incidents; degraded APIs were still answering.
const sumDowntime = (incidents: Incident[]) =>
  incidents.reduce((total, incident) => total + (incident.severity === "down" ? incident.durationSeconds : 0), 0);
