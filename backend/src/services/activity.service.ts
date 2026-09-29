import { HttpError } from "../errors.js";
import { findRecentChecks, type RecentCheckRow } from "../repositories/checks.repository.js";
import { findProjectById } from "../repositories/projects.repository.js";
import type { ActivityEvent, ActivityItem } from "../types/activity.js";

// Status changes are worked out from the previous check within this window.
const WINDOW_MS = 7 * 86_400_000;

function eventFor(row: Pick<RecentCheckRow, "outcome" | "previous_outcome">): ActivityEvent {
  const previous = row.previous_outcome;
  if (!previous || previous === row.outcome) return "Health check";
  if (row.outcome === "down") return "Went down";
  if (row.outcome === "healthy") return "Recovered";
  return previous === "healthy" ? "Slow response" : "Recovered";
}

export async function listActivity(options: { limit: number; projectId?: string; changesOnly?: boolean }): Promise<ActivityItem[]> {
  if (options.projectId && !(await findProjectById(options.projectId))) throw new HttpError(404, "Project not found");
  const rows = await findRecentChecks({ ...options, from: new Date(Date.now() - WINDOW_MS) });
  return rows.map((row) => ({
    id: String(row.id),
    checkedAt: row.checked_at.toISOString(),
    apiId: String(row.project_id),
    apiName: row.name,
    outcome: row.outcome,
    event: eventFor(row),
    statusCode: row.status_code,
    latencyMs: row.latency_ms,
    error: row.error,
  }));
}
