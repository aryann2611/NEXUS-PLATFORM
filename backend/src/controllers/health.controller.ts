import type { HealthStatus } from "../types/health.js";

export function getHealthStatus(): HealthStatus {
  return {
    status: "ok",
    service: "nexus",
    timestamp: new Date().toISOString(),
  };
}
