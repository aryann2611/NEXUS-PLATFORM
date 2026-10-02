import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { pool } from "../db/database.js";
import type { ProjectMetrics, ProjectStatus } from "../types/project.js";

const TREND_POINTS = 20;
const UPTIME_WINDOW_DAYS = 30;

export interface NewCheck {
  projectId: string;
  status: ProjectStatus;
  latencyMs: number | null;
}

export async function insertCheck(check: NewCheck): Promise<void> {
  await pool.query<ResultSetHeader>("INSERT INTO project_checks (project_id, status, latency_ms) VALUES (?, ?, ?)", [
    check.projectId,
    check.status,
    check.latencyMs,
  ]);
}

interface AggregateRow extends RowDataPacket {
  project_id: number;
  total: number;
  healthy_count: number;
  avg_latency: number | null;
  last_checked_at: Date;
}

interface TrendRow extends RowDataPacket {
  project_id: number;
  latency_ms: number | null;
  checked_at: Date;
}

/** One query for uptime/avg-latency, one for the trend — both grouped by project so N APIs cost 2 round trips, not 2N. */
export async function findMetricsByProjectIds(projectIds: string[]): Promise<Map<string, ProjectMetrics>> {
  const metrics = new Map<string, ProjectMetrics>();
  if (projectIds.length === 0) return metrics;

  const [aggregateRows] = await pool.query<AggregateRow[]>(
    `SELECT project_id, COUNT(*) AS total, SUM(status = 'healthy') AS healthy_count, AVG(latency_ms) AS avg_latency, MAX(checked_at) AS last_checked_at
     FROM project_checks
     WHERE project_id IN (?) AND checked_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
     GROUP BY project_id`,
    [projectIds, UPTIME_WINDOW_DAYS],
  );

  const [trendRows] = await pool.query<TrendRow[]>(
    `SELECT project_id, latency_ms, checked_at FROM project_checks
     WHERE project_id IN (?)
     ORDER BY project_id, checked_at DESC`,
    [projectIds],
  );

  const trends = new Map<string, number[]>();
  for (const row of trendRows) {
    const id = String(row.project_id);
    const list = trends.get(id) ?? [];
    if (list.length < TREND_POINTS && row.latency_ms !== null) list.push(row.latency_ms);
    trends.set(id, list);
  }

  for (const row of aggregateRows) {
    const id = String(row.project_id);
    metrics.set(id, {
      uptimePercent: row.total > 0 ? Math.round((row.healthy_count / row.total) * 1000) / 10 : null,
      avgLatencyMs: row.avg_latency !== null ? Math.round(row.avg_latency) : null,
      lastCheckedAt: row.last_checked_at.toISOString(),
      latencyTrend: (trends.get(id) ?? []).reverse(),
    });
  }

  return metrics;
}

export const emptyMetrics: ProjectMetrics = { uptimePercent: null, avgLatencyMs: null, lastCheckedAt: null, latencyTrend: [] };

interface DueRow extends RowDataPacket {
  id: number;
}

/** Projects never checked, or whose last check is older than their own check_interval. */
export async function findProjectIdsDueForCheck(): Promise<string[]> {
  const [rows] = await pool.query<DueRow[]>(
    `SELECT p.id FROM projects p
     LEFT JOIN (SELECT project_id, MAX(checked_at) AS last_checked_at FROM project_checks GROUP BY project_id) c
       ON c.project_id = p.id
     WHERE c.last_checked_at IS NULL OR c.last_checked_at <= DATE_SUB(NOW(), INTERVAL p.check_interval SECOND)`,
  );
  return rows.map((row) => String(row.id));
}
