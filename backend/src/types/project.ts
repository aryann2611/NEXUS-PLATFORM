export type ProjectStatus = "pending" | "healthy" | "degraded" | "down";

export interface Project {
  id: string;
  name: string;
  baseUrl: string;
  description: string | null;
  tags: string[];
  status: ProjectStatus;
  checkInterval: number;
  timeout: number;
  createdAt: string;
  updatedAt: string;
}

/** POST /api/projects body after schema validation (defaults applied). */
export interface CreateProjectInput {
  name: string;
  baseUrl: string;
  description?: string;
  tags: string[];
  checkInterval: number;
  timeout: number;
}
