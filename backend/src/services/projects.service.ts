import { HttpError } from "../errors.js";
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
  return project;
}

export const listProjects = () => findAllProjects();

export async function getProject(id: string): Promise<Project> {
  const project = await findProjectById(id);
  if (!project) throw new HttpError(404, "Project not found");
  return project;
}
