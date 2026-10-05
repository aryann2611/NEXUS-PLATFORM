import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { isDuplicateEntry, pool } from "../db/database.js";
import type { Project, ProjectStatus } from "../types/project.js";

interface ProjectRow extends RowDataPacket {
  id: number;
  name: string;
  base_url: string;
  description: string | null;
  tags: string[] | null;
  status: ProjectStatus;
  check_interval: number;
  timeout: number;
  last_checked_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface NewProject {
  name: string;
  baseUrl: string;
  description: string | null;
  tags: string[];
  checkInterval: number;
  timeout: number;
}

const columns = "id, name, base_url, description, tags, status, check_interval, timeout, last_checked_at, created_at, updated_at";

function toProject(row: ProjectRow): Project {
  return {
    id: String(row.id),
    name: row.name,
    baseUrl: row.base_url,
    description: row.description,
    tags: row.tags ?? [],
    status: row.status,
    checkInterval: row.check_interval,
    timeout: row.timeout,
    lastCheckedAt: row.last_checked_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function findAllProjects(): Promise<Project[]> {
  const [rows] = await pool.query<ProjectRow[]>(`SELECT ${columns} FROM projects ORDER BY id DESC`);
  return rows.map(toProject);
}

export async function findProjectById(id: string): Promise<Project | null> {
  const [rows] = await pool.query<ProjectRow[]>(`SELECT ${columns} FROM projects WHERE id = ?`, [id]);
  return rows[0] ? toProject(rows[0]) : null;
}

/** Projects never checked, or whose last check is older than their check interval. */
export async function findDueProjects(limit: number): Promise<Project[]> {
  const [rows] = await pool.query<ProjectRow[]>(
    `SELECT ${columns} FROM projects
     WHERE last_checked_at IS NULL OR last_checked_at <= UTC_TIMESTAMP(3) - INTERVAL check_interval SECOND
     ORDER BY last_checked_at IS NOT NULL, last_checked_at
     LIMIT ?`,
    [limit],
  );
  return rows.map(toProject);
}

/** Returns the stored project, or null when the name is already taken. */
export async function insertProject(project: NewProject): Promise<Project | null> {
  try {
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO projects (name, base_url, description, tags, check_interval, timeout) VALUES (?, ?, ?, ?, ?, ?)",
      [project.name, project.baseUrl, project.description, JSON.stringify(project.tags), project.checkInterval, project.timeout],
    );
    return findProjectById(String(result.insertId));
  } catch (error) {
    if (isDuplicateEntry(error)) return null;
    throw error;
  }
}
