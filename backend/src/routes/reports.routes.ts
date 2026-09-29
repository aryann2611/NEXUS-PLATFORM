import type { FastifyInstance } from "fastify";
import { getReport } from "../controllers/reports.controller.js";
import { reportQuerySchema } from "../schemas/reports.schema.js";
import type { ReportRange } from "../types/report.js";

export async function reportsRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { range: ReportRange; projectId?: string } }>("/api/reports", { schema: reportQuerySchema }, getReport);
}
