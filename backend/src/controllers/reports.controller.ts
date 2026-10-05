import type { FastifyRequest } from "fastify";
import * as reports from "../services/reports.service.js";
import type { ReportRange } from "../types/report.js";

export async function getReport(request: FastifyRequest<{ Querystring: { range: ReportRange; projectId?: string } }>) {
  return { data: await reports.buildReport(request.query.range, request.query.projectId) };
}
