import type { FastifyReply, FastifyRequest } from "fastify";
import * as projects from "../services/projects.service.js";
import type { CreateProjectInput } from "../types/project.js";

export async function createProject(request: FastifyRequest<{ Body: CreateProjectInput }>, reply: FastifyReply) {
  const project = await projects.createProject(request.body);
  return reply.status(201).send({ data: project });
}

export async function listProjects() {
  return { data: await projects.listProjects() };
}

export async function getProject(request: FastifyRequest<{ Params: { id: string } }>) {
  return { data: await projects.getProject(request.params.id) };
}
