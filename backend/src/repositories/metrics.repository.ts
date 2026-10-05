import type { RowDataPacket } from "mysql2/promise";
import { pool } from "../db/database.js";
import type { ProjectStatus } from "../types/project.js";

export interface CheckRow extends RowDataPacket {
  id: number;
  project_id: number;
  name: string;
  status: ProjectStatus;
  latency_ms: number | null;
  checked_at: Date;
}

export interface DailyRow extends RowDataPacket {
  project_id: number;
  day: string;
  total: number;
  healthy_count: number;
}

/** Every check in the window, oldest first. Percentiles are computed in JS (MySQL has none). */
export async function findChecksSince(hours: number): Promise<CheckRow[]> {
  const [rows] = await pool.query<CheckRow[]>(
    `SELECT c.id, c.project_id, p.name, c.status, c.latency_ms, c.checked_at
     FROM project_checks c JOIN projects p ON p.id = c.project_id
     WHERE c.checked_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
     ORDER BY c.checked_at`,
    [hours],
  );
  return rows;
}

/** The newest checks, newest first, joined with the project name. */
export async function findLatestChecks(limit: number): Promise<CheckRow[]> {
  const [rows] = await pool.query<CheckRow[]>(
    `SELECT c.project_id, c.id, p.name, c.status, c.latency_ms, c.checked_at
     FROM project_checks c JOIN projects p ON p.id = c.project_id
     ORDER BY c.checked_at DESC, c.id DESC LIMIT ?`,
    [limit],
  );
  return rows;
}

export async function findDailyCounts(days: number): Promise<DailyRow[]> {
  const [rows] = await pool.query<DailyRow[]>(
    `SELECT project_id, DATE_FORMAT(checked_at, '%Y-%m-%d') AS day, COUNT(*) AS total, SUM(status = 'healthy') AS healthy_count
     FROM project_checks
     WHERE checked_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     GROUP BY project_id, day`,
    [days - 1],
  );
  return rows;
}

export async function findProjectNames(): Promise<{ id: string; name: string }[]> {
  const [rows] = await pool.query<(RowDataPacket & { id: number; name: string })[]>("SELECT id, name FROM projects ORDER BY name");
  return rows.map((row) => ({ id: String(row.id), name: row.name }));
}
