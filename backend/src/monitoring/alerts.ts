import type { CheckOutcome } from "../types/check.js";
import type { ProjectStatus } from "../types/project.js";

export type AlertEvent = "down" | "recovered";

/**
 * Which alert, if any, a check result triggers. Only the edges alert: going down (including a
 * first check that fails) and coming back up. Healthy <-> degraded flips are too noisy to page on.
 */
export function alertEvent(previous: ProjectStatus, outcome: CheckOutcome): AlertEvent | null {
  if (outcome === "down") return previous === "down" ? null : "down";
  return previous === "down" ? "recovered" : null;
}
