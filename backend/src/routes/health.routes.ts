import type { FastifyInstance } from "fastify";
import { getHealthStatus } from "../controllers/health.controller.js";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/api/health", async () => getHealthStatus());
}
