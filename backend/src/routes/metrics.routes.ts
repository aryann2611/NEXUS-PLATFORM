import type { FastifyInstance } from "fastify";
import { overview } from "../controllers/metrics.controller.js";

export async function metricsRoutes(app: FastifyInstance) {
  app.get("/api/metrics/overview", overview);
}
