import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { pool } from "../db/database.js";
import type { CheckOutcome, CheckRecord } from "../types/check.js";

interface CheckRow extends RowDataPacket {
  project_id: number;
  checked_at: Date;
  outcome: CheckOutcome;
  status_code: number | null;
  latency_ms: number | null;
  error: string | null;
}

/** Stores a check and moves the project to that outcome, atomically. */
export async function recordCheck(check: CheckRecord): Promise<void> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      "INSERT INTO checks (project_id, checked_at, outcome, status_code, latency_ms, error) VALUES (?, ?, ?, ?, ?, ?)",
      [check.projectId, check.checkedAt, check.outcome, check.statusCode, check.latencyMs, check.error],
    );
    await connection.query("UPDATE projects SET status = ?, last_checked_at = ? WHERE id = ?", [
      check.outcome,
      check.checkedAt,
      check.projectId,
    ]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/** Checks at or after `from`, ordered by project then time (the order report aggregation relies on). */
export async function findChecksSince(from: Date, projectId?: string): Promise<CheckRecord[]> {
  const [rows] = await pool.query<CheckRow[]>(
    `SELECT project_id, checked_at, outcome, status_code, latency_ms, error FROM checks
     WHERE checked_at >= ?${projectId ? " AND project_id = ?" : ""}
     ORDER BY project_id, checked_at, id`,
    projectId ? [from, projectId] : [from],
  );
  return rows.map((row) => ({
    projectId: String(row.project_id),
    checkedAt: row.checked_at,
    outcome: row.outcome,
    statusCode: row.status_code,
    latencyMs: row.latency_ms,
    error: row.error,
  }));
}

export async function deleteChecksBefore(cutoff: Date): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>("DELETE FROM checks WHERE checked_at < ?", [cutoff]);
  return result.affectedRows;
}

export interface RecentCheckRow extends RowDataPacket {
  id: number;
  project_id: number;
  name: string;
  checked_at: Date;
  outcome: CheckOutcome;
  previous_outcome: CheckOutcome | null;
  status_code: number | null;
  latency_ms: number | null;
  error: string | null;
}

/**
 * Newest checks since `from`, each with the outcome of the same API's previous check (LAG), so
 * callers can tell status changes from routine checks. `changesOnly` keeps just the changes.
 */
export async function findRecentChecks(options: { from: Date; limit: number; projectId?: string; changesOnly?: boolean }) {
  const params: unknown[] = [options.from];
  if (options.projectId) params.push(options.projectId);
  params.push(options.limit);
  const [rows] = await pool.query<RecentCheckRow[]>(
    `SELECT * FROM (
       SELECT c.id, c.project_id, p.name, c.checked_at, c.outcome, c.status_code, c.latency_ms, c.error,
              LAG(c.outcome) OVER (PARTITION BY c.project_id ORDER BY c.checked_at, c.id) AS previous_outcome
       FROM checks c JOIN projects p ON p.id = c.project_id
       WHERE c.checked_at >= ?${options.projectId ? " AND c.project_id = ?" : ""}
     ) recent
     ${options.changesOnly ? "WHERE previous_outcome IS NOT NULL AND previous_outcome <> outcome" : ""}
     ORDER BY checked_at DESC, id DESC
     LIMIT ?`,
    params,
  );
  return rows;
}
