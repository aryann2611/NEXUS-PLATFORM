import { HttpError } from "../errors.js";
import { emptyMetrics, findMetricsByProjectIds } from "../repositories/checks.repository.js";
import { findAllProjects, findProjectById, insertProject } from "../repositories/projects.repository.js";
import type { CreateProjectInput, Project } from "../types/project.js";

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const name = input.name.trim();
  const project = await insertProject({
    name,
    baseUrl: input.baseUrl,
    description: input.description?.trim() || null,
    tags: [...new Set(input.tags.map((tag) => tag.trim()))],
    checkInterval: input.checkInterval,
    timeout: input.timeout,
  });
  if (!project) throw new HttpError(409, `An API named "${name}" is already registered`);
  return { ...project, ...emptyMetrics };
}

export async function listProjects(): Promise<Project[]> {
  const projects = await findAllProjects();
  const metrics = await findMetricsByProjectIds(projects.map((project) => project.id));
  return projects.map((project) => ({ ...project, ...(metrics.get(project.id) ?? emptyMetrics) }));
}

export async function getProject(id: string): Promise<Project> {
  const project = await findProjectById(id);
  if (!project) throw new HttpError(404, "Project not found");
  const metrics = await findMetricsByProjectIds([id]);
  return { ...project, ...(metrics.get(id) ?? emptyMetrics) };
}
