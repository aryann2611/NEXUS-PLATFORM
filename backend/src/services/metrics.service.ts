import { findChecksSince, findDailyCounts, findLatestChecks, findProjectNames, type CheckRow, type DailyRow } from "../repositories/metrics.repository.js";
import type { ActivityEvent, LatencyPoint, Overview, UptimeHistoryRow } from "../types/metrics.js";
import type { ProjectStatus } from "../types/project.js";
import { DEGRADED_LATENCY_MS } from "./healthCheck.service.js";

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
const SERIES_HOURS = 24;
const TREND_POINTS = 8;
const UPTIME_WINDOW_DAYS = 45;
const SUMMARY_WINDOW_DAYS = 30;
const ACTIVITY_LIMIT = 50;

const round = (value: number, digits = 1) => Math.round(value * 10 ** digits) / 10 ** digits;
const avg = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null);

/** Nearest-rank percentile of an ascending-sorted list. */
function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
}

const dayKey = (ms: number) => new Date(ms).toISOString().slice(0, 10);

// ponytail: day status is a fixed ratio rule (>=99% healthy / >=50% degraded / else down); tune if it reads too noisy.
function dayStatus(total: number, healthy: number): ProjectStatus {
  if (total === 0) return "pending";
  const ratio = healthy / total;
  return ratio >= 0.99 ? "healthy" : ratio >= 0.5 ? "degraded" : "down";
}

export function buildUptimeHistory(projects: { id: string; name: string }[], daily: DailyRow[], now: number): UptimeHistoryRow[] {
  const keys = Array.from({ length: UPTIME_WINDOW_DAYS }, (_, i) => dayKey(now - (UPTIME_WINDOW_DAYS - 1 - i) * DAY_MS));
  return projects.map(({ id, name }) => {
    const byDay = new Map(daily.filter((row) => String(row.project_id) === id).map((row) => [row.day, row]));
    let total = 0;
    let healthy = 0;
    const days = keys.map((key) => {
      const row = byDay.get(key);
      total += row?.total ?? 0;
      healthy += Number(row?.healthy_count ?? 0);
      return dayStatus(row?.total ?? 0, Number(row?.healthy_count ?? 0));
    });
    return { apiName: name, uptimePercent: total ? round((healthy / total) * 100) : null, days };
  });
}

export function buildLatencySeries(checks: Pick<CheckRow, "latency_ms" | "checked_at">[], now: number): LatencyPoint[] {
  const start = Math.floor(now / HOUR_MS) * HOUR_MS - (SERIES_HOURS - 1) * HOUR_MS;
  const buckets: number[][] = Array.from({ length: SERIES_HOURS }, () => []);
  for (const check of checks) {
    const i = Math.floor((check.checked_at.getTime() - start) / HOUR_MS);
    if (check.latency_ms !== null && i >= 0 && i < SERIES_HOURS) buckets[i].push(check.latency_ms);
  }
  return buckets.map((latencies, i) => {
    latencies.sort((a, b) => a - b);
    return { time: new Date(start + i * HOUR_MS).toISOString(), p50: percentile(latencies, 50), p95: percentile(latencies, 95) };
  });
}

/** Rows arrive newest first; the next row of the same project is the check before it. */
export function buildActivity(latest: CheckRow[]): ActivityEvent[] {
  return latest.map((check, i) => {
    const previous = latest.slice(i + 1).find((other) => other.project_id === check.project_id);
    const ms = check.latency_ms;
    const [event, details] =
      check.status === "down"
        ? [ms === null ? "Timeout" : "Error response", ms === null ? "No response" : `${ms}ms`]
        : check.status === "degraded"
          ? ["High latency", `${ms}ms (threshold ${DEGRADED_LATENCY_MS}ms)`]
          : [previous && previous.status !== "healthy" ? "Recovered" : "Health check", `${ms}ms`];
    return { id: String(check.id), at: check.checked_at.toISOString(), apiName: check.name, event, health: check.status, details };
  });
}

function buildSummary(checks: CheckRow[], daily: DailyRow[], series: LatencyPoint[], now: number): Overview["summary"] {
  const latencies = checks.flatMap((c) => (c.latency_ms === null ? [] : [c.latency_ms]));
  const errors = checks.filter((c) => c.status === "down").length;

  const since = dayKey(now - (SUMMARY_WINDOW_DAYS - 1) * DAY_MS);
  const perDay = new Map<string, [number, number]>();
  for (const row of daily) {
    const [total, healthy] = perDay.get(row.day) ?? [0, 0];
    perDay.set(row.day, [total + row.total, healthy + Number(row.healthy_count)]);
  }
  const recent = [...perDay].filter(([day]) => day >= since);
  const total = recent.reduce((sum, [, [t]]) => sum + t, 0);
  const healthy = recent.reduce((sum, [, [, h]]) => sum + h, 0);

  // Hourly buckets for the last few hours, skipping hours with no checks.
  const start = Date.parse(series[0].time);
  const hourly = Array.from({ length: SERIES_HOURS }, (_, i) =>
    checks.filter((c) => Math.floor((c.checked_at.getTime() - start) / HOUR_MS) === i),
  ).slice(-TREND_POINTS).filter((bucket) => bucket.length > 0);

  return {
    uptimePercent: total ? round((healthy / total) * 100) : null,
    checks24h: checks.length,
    avgLatencyMs: latencies.length ? Math.round(avg(latencies)!) : null,
    errorRatePercent: checks.length ? round((errors / checks.length) * 100, 2) : null,
    trends: {
      uptime: [...perDay].sort(([a], [b]) => (a < b ? -1 : 1)).slice(-TREND_POINTS).map(([, [t, h]]) => round((h / t) * 100)),
      checks: hourly.map((b) => b.length),
      latency: hourly.flatMap((b) => {
        const ms = b.flatMap((c) => (c.latency_ms === null ? [] : [c.latency_ms]));
        return ms.length ? [Math.round(avg(ms)!)] : [];
      }),
      errorRate: hourly.map((b) => round((b.filter((c) => c.status === "down").length / b.length) * 100, 2)),
    },
  };
}

export async function getOverview(now = Date.now()): Promise<Overview> {
  const [checks, latest, daily, projects] = await Promise.all([
    findChecksSince(SERIES_HOURS),
    findLatestChecks(ACTIVITY_LIMIT),
    findDailyCounts(UPTIME_WINDOW_DAYS),
    findProjectNames(),
  ]);
  const latencySeries = buildLatencySeries(checks, now);
  return {
    summary: buildSummary(checks, daily, latencySeries, now),
    latencyThresholdMs: DEGRADED_LATENCY_MS,
    latencySeries,
    uptimeWindowDays: UPTIME_WINDOW_DAYS,
    uptimeHistory: buildUptimeHistory(projects, daily, now),
    activity: buildActivity(latest),
  };
}
