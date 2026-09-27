import type { FastifyInstance } from "fastify";
import { createProject, getProject, listProjects } from "../controllers/projects.controller.js";
import { createProjectSchema, projectParamsSchema } from "../schemas/projects.schema.js";
import type { CreateProjectInput } from "../types/project.js";

export async function projectsRoutes(app: FastifyInstance) {
  app.post<{ Body: CreateProjectInput }>("/api/projects", { schema: createProjectSchema }, createProject);
  app.get("/api/projects", listProjects);
  app.get<{ Params: { id: string } }>("/api/projects/:id", { schema: projectParamsSchema }, getProject);
}
