import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { isDuplicateEntry, pool } from "../db/database.js";
import type { Project, ProjectMetrics, ProjectStatus } from "../types/project.js";

export type ProjectRecord = Omit<Project, keyof ProjectMetrics>;

interface ProjectRow extends RowDataPacket {
  id: number;
  name: string;
  base_url: string;
  description: string | null;
  tags: string[] | null;
  status: ProjectStatus;
  check_interval: number;
  timeout: number;
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

const columns = "id, name, base_url, description, tags, status, check_interval, timeout, created_at, updated_at";

function toProject(row: ProjectRow): ProjectRecord {
  return {
    id: String(row.id),
    name: row.name,
    baseUrl: row.base_url,
    description: row.description,
    tags: row.tags ?? [],
    status: row.status,
    checkInterval: row.check_interval,
    timeout: row.timeout,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function updateProjectStatus(id: string, status: ProjectStatus): Promise<void> {
  await pool.query("UPDATE projects SET status = ? WHERE id = ?", [status, id]);
}

export async function findAllProjects(): Promise<ProjectRecord[]> {
  const [rows] = await pool.query<ProjectRow[]>(`SELECT ${columns} FROM projects ORDER BY id DESC`);
  return rows.map(toProject);
}

export async function findProjectById(id: string): Promise<ProjectRecord | null> {
  const [rows] = await pool.query<ProjectRow[]>(`SELECT ${columns} FROM projects WHERE id = ?`, [id]);
  return rows[0] ? toProject(rows[0]) : null;
}

export async function findProjectsByIds(ids: string[]): Promise<ProjectRecord[]> {
  if (ids.length === 0) return [];
  const [rows] = await pool.query<ProjectRow[]>(`SELECT ${columns} FROM projects WHERE id IN (?)`, [ids]);
  return rows.map(toProject);
}

/** Returns the stored project, or null when the name is already taken. */
export async function insertProject(project: NewProject): Promise<ProjectRecord | null> {
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
