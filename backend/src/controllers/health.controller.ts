import { pool } from "../db/database.js";
import type { HealthStatus } from "../types/health.js";

/** Reports ok only when the database answers; a failure surfaces as 503 via the error handler. */
export async function getHealthStatus(): Promise<HealthStatus> {
  await pool.query("SELECT 1");
  return {
    status: "ok",
    service: "nexus",
    timestamp: new Date().toISOString(),
  };
}
