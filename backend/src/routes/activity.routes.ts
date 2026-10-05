import type { FastifyInstance } from "fastify";
import { getActivity, type ActivityQuery } from "../controllers/activity.controller.js";
import { activityQuerySchema } from "../schemas/activity.schema.js";

export async function activityRoutes(app: FastifyInstance) {
  app.get<{ Querystring: ActivityQuery }>("/api/activity", { schema: activityQuerySchema }, getActivity);
}
