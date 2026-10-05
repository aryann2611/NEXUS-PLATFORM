import type { FastifyRequest } from "fastify";
import { HttpError } from "../errors.js";
import { MAX_ACTIVITY_LIMIT } from "../schemas/activity.schema.js";
import { listActivity } from "../services/activity.service.js";

export interface ActivityQuery {
  limit: string;
  projectId?: string;
  changes: "true" | "false";
}

export async function getActivity(request: FastifyRequest<{ Querystring: ActivityQuery }>) {
  const limit = Number(request.query.limit);
  if (limit > MAX_ACTIVITY_LIMIT) throw new HttpError(400, `limit must be at most ${MAX_ACTIVITY_LIMIT}`);
  return {
    data: await listActivity({ limit, projectId: request.query.projectId, changesOnly: request.query.changes === "true" }),
  };
}
